do $$ begin
 if exists(select 1 from deals where code='D-101') then return; end if;
 insert into deals(code,name,account,segment,outcome,closed_on,currency,amount_cents,seller_reason,competitor,owner) values
 ('D-101','Harbour renewal','Harbour Demo','Midmarket','lost',current_date-45,'NZD',4200000,'price','Vendor Amber','Alex'),
 ('D-102','Kauri expansion','Kauri Demo','Midmarket','won',current_date-25,'NZD',2800000,'service','Vendor Amber','Jordan'),
 ('D-103','Southern rollout','Southern Demo','Enterprise','lost',current_date-32,'AUD',6500000,'price','Vendor Indigo','Alex'),
 ('D-104','Harbour pilot','Harbour Labs Demo','Small business','no_decision',current_date-20,null,null,'timing','unknown','Casey'),
 ('D-105','Coast subscription','Coast Demo','Small business','won',current_date-10,'NZD',900000,'fit','none','Jordan');
 insert into interviews(code,deal_id,participant,interviewer,due_on,status,permission,notice_ref,purpose,retention_review_on,completed_on,evidence_ref)
 select 'I-101',id,'Buyer A (fictional)','Researcher Lee',current_date-30,'completed','granted','demo-notice-1','Internal win-loss study',current_date+120,current_date-29,'demo-interview-101' from deals where code='D-101';
 insert into interviews(code,deal_id,participant,interviewer,due_on,status,permission,notice_ref,purpose,retention_review_on,completed_on,evidence_ref)
 select 'I-102',id,'Buyer B (fictional)','Researcher Lee',current_date-15,'completed','granted','demo-notice-2','Internal win-loss study',current_date+120,current_date-15,'demo-interview-102' from deals where code='D-102';
 insert into interviews(code,deal_id,participant,interviewer,due_on,status,permission,notice_ref,purpose,retention_review_on,completed_on,evidence_ref)
 select 'I-103',id,'Buyer C (fictional)','Researcher Lee',current_date-4,'planned','pending','','Internal win-loss study',current_date+90,null,'' from deals where code='D-103';
 insert into interviews(code,deal_id,participant,interviewer,due_on,status,permission,notice_ref,purpose,retention_review_on,completed_on,evidence_ref)
 select 'I-104',id,'Buyer D (fictional)','Researcher Lee',current_date-18,'withdrawn','declined','demo-notice-4','Review withdrawal and erase material when authorised',current_date-1,null,'' from deals where code='D-104';
 insert into findings(code,interview_id,theme,direction,excerpt,evidence_ref,reviewer)
 select 'F-101',id,'implementation','negative','We could not resource the rollout before our busy season.','demo-interview-101 paragraph 3','Reviewer Morgan' from interviews where code='I-101';
 insert into findings(code,interview_id,theme,direction,excerpt,evidence_ref,reviewer)
 select 'F-102',id,'support','positive','The named support contact made the decision easier.','demo-interview-102 paragraph 2','Reviewer Morgan' from interviews where code='I-102';
 insert into actions(code,finding_id,title,owner,due_on)
 select 'A-101',id,'Add a phased rollout option to proposals','Alex',current_date-3 from findings where code='F-101';
 insert into activity(entity_id,verb,actor) select id,'demo-seed','Fictional data' from deals;
end $$;
