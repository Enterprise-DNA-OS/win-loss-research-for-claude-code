create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table deals (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null check(length(trim(name))>0),
 account text not null, segment text not null, outcome text not null check(outcome in ('won','lost','no_decision')),
 closed_on date not null, currency text check(currency ~ '^[A-Z]{3}$'), amount_cents bigint check(amount_cents between 0 and 9000000000000),
 seller_reason text not null default 'unknown', competitor text not null default 'unknown', owner text not null,
 source text not null default 'manual', source_id text, source_data jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source,source_id), check(amount_cents is null or currency is not null)
);
create table interviews (
 id uuid primary key default gen_random_uuid(), code text not null unique, deal_id uuid not null references deals(id),
 participant text not null, interviewer text not null, due_on date not null,
 status text not null default 'planned' check(status in ('planned','completed','withdrawn')),
 permission text not null default 'pending' check(permission in ('pending','granted','declined')),
 notice_ref text not null default '', purpose text not null, retention_review_on date not null,
 completed_on date, evidence_ref text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status <> 'completed' or (permission='granted' and length(trim(notice_ref))>0 and length(trim(evidence_ref))>0 and completed_on is not null)),
 check(completed_on is null or retention_review_on>=completed_on)
);
create table findings (
 id uuid primary key default gen_random_uuid(), code text not null unique, interview_id uuid not null references interviews(id),
 theme text not null check(length(trim(theme))>0), direction text not null check(direction in ('positive','negative','neutral')),
 excerpt text not null check(length(trim(excerpt))>0), evidence_ref text not null check(length(trim(evidence_ref))>0),
 reviewer text not null check(length(trim(reviewer))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, finding_id uuid not null references findings(id),
 title text not null, owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','closed')),
 closure_ref text not null default '', closed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'closed' or (length(trim(closure_ref))>0 and closed_on is not null))
);
create table notes (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), body text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity_id uuid, verb text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function immutable_activity() returns trigger language plpgsql as $$ begin raise exception 'Activity is append-only'; end $$;
create trigger activity_immutable before update or delete on activity for each row execute function immutable_activity();
create function validate_finding() returns trigger language plpgsql as $$
begin
 if not exists(select 1 from interviews where id=new.interview_id and status='completed' and permission='granted' and retention_review_on>=current_date) then
  raise exception 'Finding requires a completed, permitted interview within its retention review date';
 end if; return new;
end $$;
create trigger findings_eligible before insert or update on findings for each row execute function validate_finding();
do $$ declare t text; begin
 foreach t in array array['deals','interviews','findings','actions','notes'] loop
  execute format('create trigger %I before update on %I for each row execute function touch_updated_at()',t||'_updated',t);
 end loop;
 foreach t in array array['deals','interviews','findings','actions','notes','activity'] loop
  execute format('alter table %I enable row level security',t);
  execute format('revoke all on %I from public',t);
 end loop;
end $$;
create index interviews_deal on interviews(deal_id);
create index findings_interview on findings(interview_id);
create index actions_finding on actions(finding_id);
create view v_eligible_interviews as
 select i.*, d.name deal, d.code deal_code, d.outcome, d.segment, d.competitor, d.seller_reason
 from interviews i join deals d on d.id=i.deal_id
 where i.status='completed' and i.permission='granted' and i.retention_review_on>=current_date;
create view v_evidence as
 select f.code, i.deal_code, i.deal, i.segment, i.outcome, i.competitor, f.theme, f.direction, f.excerpt, f.evidence_ref, f.reviewer
 from findings f join v_eligible_interviews i on i.id=f.interview_id;
create view v_coverage as
 select d.segment,d.outcome,count(*)::int deals,
 count(*) filter(where exists(select 1 from v_eligible_interviews i where i.deal_id=d.id))::int interviewed,
 count(*) filter(where not exists(select 1 from v_eligible_interviews i where i.deal_id=d.id))::int missing,
 round(100.0*count(*) filter(where exists(select 1 from v_eligible_interviews i where i.deal_id=d.id))/count(*),1) coverage_pct
 from deals d group by d.segment,d.outcome;
create view v_themes as
 select theme,direction,outcome,count(*)::int mentions,count(distinct deal_code)::int deals
 from v_evidence group by theme,direction,outcome;
create view v_disagreements as
 select distinct i.deal_code,i.deal,i.seller_reason,f.theme buyer_theme,i.outcome
 from v_eligible_interviews i join findings f on f.interview_id=i.id
 where f.direction='negative' and i.outcome='lost' and i.seller_reason<>'unknown' and lower(i.seller_reason)<>lower(f.theme);
create view v_actions as
 select a.code,a.title,a.owner,a.due_on,a.status,a.closure_ref,f.theme,
 d.code deal_code,case when i.id is null then 'restricted' else 'available' end evidence_status
 from actions a join findings f on f.id=a.finding_id join interviews raw on raw.id=f.interview_id
 join deals d on d.id=raw.deal_id left join v_eligible_interviews i on i.id=raw.id;
create view v_attention as
 select 'interview-overdue' issue,i.code record,d.name detail,i.due_on due_on from interviews i join deals d on d.id=i.deal_id
 where i.status='planned' and i.permission<>'declined' and i.due_on<current_date
 union all select 'action-overdue',a.code,a.title,a.due_on from actions a where a.status='open' and a.due_on<current_date
 union all select 'coverage-gap',d.code,d.name,d.closed_on+14 from deals d where d.closed_on+14<current_date
 and not exists(select 1 from v_eligible_interviews i where i.deal_id=d.id)
 union all select 'retention-review',i.code,'Review purpose and retained material',i.retention_review_on from interviews i
 where i.retention_review_on<current_date;
create view v_compliance as
 select 'NZ-IPP3' rule,i.code record,'Collection notice reference missing' issue from interviews i
 where i.status<>'withdrawn' and trim(i.notice_ref)=''
 union all select 'NZ-IPP9',i.code,'Retention purpose review overdue' from interviews i where i.retention_review_on<current_date
 union all select 'RESEARCH-PERMISSION',i.code,'Permission pending or declined; exclude from research' from interviews i where i.permission<>'granted' and i.status<>'withdrawn'
 union all select 'ACTION-EVIDENCE',a.code,'Supporting interview restricted; review action basis' from v_actions a where a.evidence_status='restricted' and a.status='open';
revoke all on v_eligible_interviews,v_evidence,v_coverage,v_themes,v_disagreements,v_actions,v_attention,v_compliance from public;
