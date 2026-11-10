#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';

export const reads = {
 deals: 'select code,name,segment,outcome,closed_on,currency,amount_cents,seller_reason,competitor,owner from deals order by code',
 'interviews-due': "select i.code,d.code deal,i.due_on,i.interviewer,i.permission,i.status from interviews i join deals d on d.id=i.deal_id where i.status='planned' order by i.due_on,i.code",
 coverage:'select * from v_coverage order by segment,outcome',
 themes:'select * from v_themes order by theme,direction,outcome',
 evidence:'select * from v_evidence order by code',
 disagreements:'select * from v_disagreements order by deal_code,buyer_theme',
 'actions-due':"select * from v_actions where status='open' order by due_on,code",
 attention:'select * from v_attention order by due_on,issue,record',
 compliance:'select * from v_compliance order by rule,record',
 competitors:'select competitor,outcome,count(distinct deal_code)::int interviewed_deals from v_eligible_interviews group by competitor,outcome order by competitor,outcome',
 stats:'select outcome,currency,count(*)::int deals,count(amount_cents)::int priced_deals,sum(amount_cents)::bigint amount_cents from deals group by outcome,currency order by outcome,currency',
 activity:'select verb,actor,entity_id,created_at from activity order by created_at desc,id limit 100',
};
export const usage = {
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,k])),
 deal:'deal D-101',
 'add-deal':'add-deal --name="Example renewal" --account="Example" --segment=Midmarket --outcome=lost --closed-on=2026-11-01 --currency=NZD --amount=12000.00 --seller-reason=price --competitor="Vendor" --owner=Alex --actor=Alex',
 'plan-interview':'plan-interview D-101 --participant="Buyer alias" --interviewer=Lee --due-on=2026-11-20 --purpose="Internal win-loss research" --retention-review-on=2027-02-01 --actor=Lee',
 permission:'permission I-101 --state=granted --notice-ref="Notice receipt" --actor=Lee',
 complete:'complete I-101 --completed-on=2026-11-10 --evidence-ref="Interview record" --actor=Lee',
 withdraw:'withdraw I-101 --actor=Lee',
 'review-retention':'review-retention I-101 --purpose="Continuing internal research" --retention-review-on=2027-02-01 --actor=Lee',
 'add-finding':'add-finding I-101 --theme=implementation --direction=negative --excerpt="Exact buyer words" --evidence-ref="Record paragraph 3" --actor=Morgan',
 'add-action':'add-action F-101 --title="Review rollout plan" --owner=Alex --due-on=2026-11-20 --actor=Alex',
 'close-action':'close-action A-101 --closure-ref="Reviewed plan" --actor=Alex',
 log:'log D-101 --body="Internal note" --actor=Alex',
 'draft-brief':'draft-brief D-101',
 'weekly-review':'weekly-review',
 import:'import clozd --file=fixtures/clozd-example.csv --map=fixtures/clozd-map.json --dry-run --actor=Alex',
 export:'export', help:'help',
};
function parse(args){
 const options={},pos=[];
 for(const arg of args){if(arg.startsWith('--')){const eq=arg.indexOf('=');const k=arg.slice(2,eq<0?undefined:eq);if(k in options)throw Error(`Duplicate flag ${k}`);options[k]=eq<0?true:arg.slice(eq+1);}else pos.push(arg);}
 return {pos,options};
}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid calendar date: ${v}`);return v;}
function money(v){if(v==null||v==='')return null;if(!/^\d{1,10}(\.\d{1,2})?$/.test(v))throw Error('Amount must be a nonnegative decimal with at most two decimal places');const [a,b='']=v.split('.');const cents=Number(a)*100+Number(b.padEnd(2,'0'));if(cents>9000000000000)throw Error('Amount too large');return cents;}
const code=(prefix)=>`${prefix}-${randomUUID().slice(0,8).toUpperCase()}`;
const today=async(db)=>(await db.query('select current_date::text today'))[0].today;
async function resolve(db,table,ref,label='code'){
 if(!ref)throw Error(`A ${table} reference is required`);
 const rows=await db.query(`select * from ${table} where lower(code)=lower($1) or id::text=$1 order by code`,[ref]);
 if(rows.length===1)return rows[0];
 const candidates=await db.query(`select * from ${table} where id::text like $1 or position(lower($2) in lower(${label}))>0 order by code`,[ref+'%',ref]);
 if(candidates.length===1)return candidates[0];
 throw Error(`${candidates.length?'Ambiguous':'No matching'} ${table}: ${ref}${candidates.length?'\n'+candidates.map(r=>`${r.code} | ${r[label]}`).join('\n'):''}`);
}
async function audit(db,verb,actor,id=null){await db.query('insert into activity(entity_id,verb,actor) values($1,$2,$3)',[id,verb,actor]);}
function writePrivate(subdir,name,text){const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,subdir);fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,name);fs.writeFileSync(file,text,{mode:0o600,flag:'wx'});return file;}
function display(v){return v===null?'unknown':typeof v==='object'?JSON.stringify(v):String(v);}
export function format(rows){
 if(!rows.length)return '(none)';const keys=Object.keys(rows[0]);const vals=rows.map(r=>keys.map(k=>display(r[k]).replace(/\r?\n/g,' ')));
 const widths=keys.map((k,i)=>Math.max(k.length,...vals.map(r=>r[i].length)));
 return [keys.map((k,i)=>k.padEnd(widths[i])).join(' | '),widths.map(w=>'-'.repeat(w)).join('-+-'),...vals.map(r=>r.map((v,i)=>v.padEnd(widths[i])).join(' | '))].join('\n');
}
async function importCsv(db,o,actor){
 const rows=parseCsv(fs.readFileSync(path.resolve(required(o,'file')),'utf8'));
 if(!rows.length)throw Error('CSV has no data rows');
 const mapping=JSON.parse(fs.readFileSync(path.resolve(required(o,'map')),'utf8'));
 const allowed=['source_id','name','account','segment','outcome','closed_on','currency','amount','seller_reason','competitor','owner'];
 for(const k of Object.keys(mapping))if(!allowed.includes(k))throw Error(`Unknown mapping field ${k}`);
 for(const k of ['source_id','name','account','segment','outcome','closed_on','owner'])if(!mapping[k])throw Error(`Mapping requires ${k}`);
 for(const h of Object.values(mapping))if(typeof h!=='string'||!Object.hasOwn(rows[0],h))throw Error(`CSV has no mapped header: ${h}`);
 const seen=new Set();let inserted=0,unchanged=0;
 for(const row of rows){
  const r=Object.fromEntries(Object.entries(mapping).map(([k,h])=>[k,row[h].trim()]));
  for(const k of ['source_id','name','account','segment','outcome','closed_on','owner'])if(!r[k])throw Error(`Blank ${k}`);
  if(seen.has(r.source_id))throw Error(`Duplicate source ID: ${r.source_id}`);seen.add(r.source_id);
  const outcome=r.outcome.toLowerCase();const outcomes={'won':'won','closed won':'won','lost':'lost','closed lost':'lost','no decision':'no_decision','no_decision':'no_decision'};
  if(!outcomes[outcome])throw Error(`Unknown outcome: ${r.outcome}`);
  const closed=date(r.closed_on);if(closed>await today(db))throw Error('Closed date is in the future');
  const amount=money(r.amount);const currency=r.currency?.toUpperCase()||null;
  if(currency&&!/^[A-Z]{3}$/.test(currency)||amount!==null&&!currency)throw Error('Amount requires a three-letter currency');
  const old=await db.query("select * from deals where source='clozd' and source_id=$1",[r.source_id]);
  if(old.length){if(JSON.stringify(old[0].source_data)!==JSON.stringify(JSON.parse(JSON.stringify(row)))){
    // jsonb reorders keys; compare by value instead.
    const same=Object.keys(row).length===Object.keys(old[0].source_data).length&&Object.keys(row).every(k=>old[0].source_data[k]===row[k]);
    if(!same)throw Error(`Changed source record ${r.source_id}; review and reconcile explicitly before replacing research history`);
   }unchanged++;continue;}
  const id=randomUUID();
  await db.query(`insert into deals(id,code,name,account,segment,outcome,closed_on,currency,amount_cents,seller_reason,competitor,owner,source,source_id,source_data)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'clozd',$13,$14)`,[id,'C-'+createHash('sha256').update(r.source_id).digest('hex').slice(0,16),r.name,r.account,r.segment,outcomes[outcome],closed,currency,amount,r.seller_reason||'unknown',r.competitor||'unknown',r.owner,r.source_id,JSON.stringify(row)]);
  await audit(db,'import-clozd',actor,id);inserted++;
 }
 return [{inserted,unchanged,dry_run:Boolean(o['dry-run']),scope:'Deal records only; interview content requires separate review'}];
}
export async function run(db,args){
 const {pos,options:o}=parse(args);const [cmd='help',ref]=pos;
 if(!(cmd in usage))throw Error(`Unknown command ${cmd}; use help`);
 const allowed={
 'add-deal':['name','account','segment','outcome','closed-on','currency','amount','seller-reason','competitor','owner'],
 'plan-interview':['participant','interviewer','due-on','purpose','retention-review-on'],permission:['state','notice-ref'],
 complete:['completed-on','evidence-ref'],withdraw:[], 'review-retention':['purpose','retention-review-on'],
 'add-finding':['theme','direction','excerpt','evidence-ref'], 'add-action':['title','owner','due-on'], 'close-action':['closure-ref'],
 log:['body'],import:['file','map','dry-run'],
 };
 for(const k of Object.keys(o))if(!['json','actor',...(allowed[cmd]||[])].includes(k))throw Error(`Unknown flag --${k} for ${cmd}`);
 const isWrite=Object.hasOwn(allowed,cmd);const actor=isWrite?required(o,'actor'):null;
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');
 try {
  let result;
  if(cmd in reads)result=await db.query(reads[cmd]);
  else if(cmd==='help')result=Object.entries(usage).map(([command,example])=>({command,example}));
  else if(cmd==='deal'){
   const d=await resolve(db,'deals',ref,'name');
   result=[{...d,interviews:await db.query('select code,status,permission,due_on,retention_review_on from interviews where deal_id=$1 order by code',[d.id]),findings:await db.query('select * from v_evidence where deal_code=$1 order by code',[d.code]),notes:await db.query('select body,actor,created_at from notes where deal_id=$1 order by created_at,id',[d.id])}];
  }else if(cmd==='add-deal'){
   const closed=date(required(o,'closed-on'));if(closed>await today(db))throw Error('Closed date is in the future');
   const amount=money(o.amount);const currency=o.currency?.toUpperCase()||null;
   result=await db.query(`insert into deals(code,name,account,segment,outcome,closed_on,currency,amount_cents,seller_reason,competitor,owner) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning code,id`,[code('D'),required(o,'name'),required(o,'account'),required(o,'segment'),required(o,'outcome'),closed,currency,amount,o['seller-reason']||'unknown',o.competitor||'unknown',required(o,'owner')]);
  }else if(cmd==='plan-interview'){
   const d=await resolve(db,'deals',ref,'name');const due=date(required(o,'due-on'));const review=date(required(o,'retention-review-on'));if(review<due)throw Error('Retention review must not precede interview due date');
   result=await db.query('insert into interviews(code,deal_id,participant,interviewer,due_on,purpose,retention_review_on) values($1,$2,$3,$4,$5,$6,$7) returning code,id',[code('I'),d.id,required(o,'participant'),required(o,'interviewer'),due,required(o,'purpose'),review]);
  }else if(['permission','complete','withdraw','review-retention'].includes(cmd)){
   const i=await resolve(db,'interviews',ref);await db.query('select id from interviews where id=$1 for update',[i.id]);
   if(cmd==='withdraw')result=await db.query("update interviews set status='withdrawn',permission='declined' where id=$1 returning code,id,status",[i.id]);
   else if(cmd==='permission'){
    if(i.status!=='planned')throw Error('Permission can only change on a planned interview; use withdraw to restrict completed evidence');
    const state=required(o,'state');if(!['granted','declined'].includes(state))throw Error('Permission must be granted or declined');
    result=await db.query('update interviews set permission=$2,notice_ref=$3 where id=$1 returning code,id,permission',[i.id,state,state==='granted'?required(o,'notice-ref'):(o['notice-ref']||'')]);
   }else if(cmd==='complete'){
    const completed=date(required(o,'completed-on'));if(completed>await today(db))throw Error('Completion date is in the future');
    if(i.status!=='planned'||i.permission!=='granted'||!i.notice_ref||i.retention_review_on<await today(db))throw Error('Complete needs a planned interview, permission, notice and current retention review');
    result=await db.query("update interviews set status='completed',completed_on=$2,evidence_ref=$3 where id=$1 returning code,id,status",[i.id,completed,required(o,'evidence-ref')]);
   }else{
    const review=date(required(o,'retention-review-on'));if(review<await today(db))throw Error('Retention review date must be today or later');
    result=await db.query('update interviews set purpose=$2,retention_review_on=$3 where id=$1 returning code,id,status',[i.id,required(o,'purpose'),review]);
   }
  }else if(cmd==='add-finding'){
   const i=await resolve(db,'interviews',ref);await db.query('select id from interviews where id=$1 for update',[i.id]);
   result=await db.query('insert into findings(code,interview_id,theme,direction,excerpt,evidence_ref,reviewer) values($1,$2,$3,$4,$5,$6,$7) returning code,id',[code('F'),i.id,required(o,'theme').toLowerCase(),required(o,'direction'),required(o,'excerpt'),required(o,'evidence-ref'),actor]);
  }else if(cmd==='add-action'){
   const f=await resolve(db,'findings',ref);const eligible=await db.query('select * from v_evidence where code=$1',[f.code]);if(!eligible.length)throw Error('Action needs available interview evidence');
   result=await db.query('insert into actions(code,finding_id,title,owner,due_on) values($1,$2,$3,$4,$5) returning code,id',[code('A'),f.id,required(o,'title'),required(o,'owner'),date(required(o,'due-on'))]);
  }else if(cmd==='close-action'){
   const a=await resolve(db,'actions',ref,'title');
   result=await db.query("update actions set status='closed',closure_ref=$2,closed_on=current_date where id=$1 and status='open' returning code,id,status",[a.id,required(o,'closure-ref')]);if(!result.length)throw Error('Action is already closed');
  }else if(cmd==='log'){
   const d=await resolve(db,'deals',ref,'name');result=await db.query('insert into notes(deal_id,body,actor) values($1,$2,$3) returning id',[d.id,required(o,'body'),actor]);
  }else if(cmd==='import'){
   if(ref!=='clozd')throw Error('Use import clozd');result=await importCsv(db,o,actor);
  }else if(cmd==='export'){
   const tables=['deals','interviews','findings','actions','notes','activity'];const data={format:'win-loss-research/v1',exported_at:new Date().toISOString()};for(const t of tables)data[t]=await db.query(`select * from ${t} order by id`);
   const file=writePrivate('exports',`research-${randomUUID()}.json`,JSON.stringify(data,null,2)+'\n');result=[{file,scope:'Full private administrative snapshot, including restricted records'}];
  }else if(cmd==='draft-brief'){
   const d=await resolve(db,'deals',ref,'name');const findings=await db.query('select * from v_evidence where deal_code=$1 order by code',[d.code]);
   const body=`# Internal win-loss brief: ${d.name}\n\nDraft for review. Never send automatically.\n\nOutcome: ${d.outcome}\nSeller reason: ${d.seller_reason}\n\n## Buyer evidence\n\n${format(findings)}\n\nEvidence gaps are not findings. This selected sample does not establish causes or represent every buyer.\n`;
   result=[{file:writePrivate('drafts',`brief-${d.code}-${randomUUID()}.md`,body)}];
  }else if(cmd==='weekly-review'){
   const body=['# Monday win-loss review','Draft for internal review. Nothing sent.','Coverage is descriptive. Deal values are not attributed to individual reasons.'];
   for(const k of ['coverage','attention','disagreements'])body.push(`## ${k}`,format(await db.query(reads[k])));
   result=[{file:writePrivate('drafts',`weekly-${randomUUID()}.md`,body.join('\n\n')+'\n')}];
  }
  if(isWrite&&cmd!=='import')await audit(db,cmd,actor,result?.[0]?.id||null);
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(error){await db.exec('ROLLBACK');throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;
 try{db=await getDb();const args=process.argv.slice(2);const rows=await run(db,args);console.log(args.includes('--json')?JSON.stringify(rows,null,2):format(rows));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
