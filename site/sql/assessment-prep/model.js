import {VERSION,FORM,DURATION,rubric,criticalAreas} from './data.js';
export const STORAGE_KEY='pnix-sql-readiness-a-v1';
export const parts={A:{max:20,min:15},B:{max:50,min:38},C:{max:20,min:15},D:{max:10,min:8}};
export function newAttempt(candidate,now=Date.now(),exposed=false){
 return {version:VERSION,form:FORM,id:globalThis.crypto?.randomUUID?.()||String(now),candidate:candidate.trim(),startedAt:now,deadline:now+DURATION,exposed,answers:{},evidence:[],submission:null,review:{scores:{},comments:{},critical:{},reviewer:'',notes:'',remediation:'',completedAt:null}};
}
export function active(a,now=Date.now()){return !!a&&!a.submission&&now<a.deadline;}
export function submit(a,now=Date.now(),reason='manual'){
 if(!a||a.submission)return a;
 a.submission=JSON.parse(JSON.stringify({answers:a.answers,evidence:a.evidence,submittedAt:Math.min(now,a.deadline),recordedAt:now,elapsedMs:Math.min(Math.max(0,now-a.startedAt),DURATION),reason:now>=a.deadline?'time expired':reason}));
 return a;
}
export function setAnswer(a,key,value,now=Date.now()){
 if(!active(a,now)){if(a&&!a.submission)submit(a,now);return false;}
 a.answers[key]=value;return true;
}
export function addEvidence(a,item,now=Date.now()){
 if(!active(a,now)){if(a&&!a.submission)submit(a,now);return false;}
 a.evidence.push({...item,at:now});
 if(a.evidence.length>120)a.evidence.shift();return true;
}
export function totals(review){
 const result=Object.fromEntries(Object.keys(parts).map(p=>[p,0]));
 for(const c of rubric){const v=review?.scores?.[c.id];if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=c.max)result[c.part]+=v;}
 return {...result,total:Object.values(result).reduce((s,v)=>s+v,0)};
}
export function reviewErrors(a){
 const r=a?.review||{},errors=[];
 if(!a?.submission)errors.push('Submit the attempt before marking.');
 if(!r.reviewer?.trim())errors.push('Enter the reviewer name.');
 for(const c of rubric){const n=r.scores?.[c.id];if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>c.max)errors.push('Mark '+c.label+' from 0 to '+c.max+'.');}
 for(const area of criticalAreas)if(!['resolved','unresolved'].includes(r.critical?.[area]))errors.push('Review '+area+'.');
 if(!r.notes?.trim())errors.push('Record the evidence supporting your review.');
 const t=totals(r),fail=t.total<85||Object.keys(parts).some(p=>t[p]<parts[p].min)||criticalAreas.some(p=>r.critical?.[p]==='unresolved');
 if(fail&&!r.remediation?.trim())errors.push('Record targeted remediation and a fresh retest plan.');
 return errors;
}
export function completeReview(a,now=Date.now()){
 const errors=reviewErrors(a);if(!errors.length)a.review.completedAt=now;return errors;
}
export function outcome(a){
 if(!a)return 'Assessment not started';
 if(!a.submission)return 'Assessment incomplete';
 if(!a.review?.completedAt||reviewErrors(a).length)return 'Submitted — awaiting review';
 const t=totals(a.review);
 if(t.total<85||Object.keys(parts).some(p=>t[p]<parts[p].min)||criticalAreas.some(p=>a.review.critical[p]==='unresolved'))return 'Remediation required';
 return a.exposed?'Practice benchmark met — familiar Form A':'First readiness benchmark met';
}
export function exportAttempt(a,history=[]){return {type:'pnix-sql-readiness',version:VERSION,exportedAt:new Date().toISOString(),status:outcome(a),testEngineReadiness:'Unverified — confirm recruiter requirements and demonstrate proficiency in the actual engine.',secondForm:'Not yet approved or available. Form A alone cannot establish two-form readiness.',attempt:a,history};}
export function importSubmission(payload){
 const a=payload?.attempt;
 if(payload?.type!=='pnix-sql-readiness'||payload.version!==VERSION||a?.version!==VERSION||a.form!==FORM||!a.submission)throw Error('Choose a submitted Form A export from this assessment version.');
 if(typeof a.id!=='string'||typeof a.candidate!=='string'||!Number.isFinite(a.startedAt)||a.deadline!==a.startedAt+DURATION||typeof a.submission.answers!=='object'||!a.submission.answers||!Array.isArray(a.submission.evidence))throw Error('Submission structure is invalid.');
 if(!Number.isFinite(a.submission.submittedAt)||a.submission.submittedAt<a.startedAt||a.submission.submittedAt>a.deadline)throw Error('Submission timing is invalid.');
 for(const value of Object.values(a.submission.answers))if(typeof value!=='string'||value.length>200000)throw Error('Submission answer is invalid or too large.');
 const copy=JSON.parse(JSON.stringify(a));copy.answers=JSON.parse(JSON.stringify(copy.submission.answers));copy.evidence=JSON.parse(JSON.stringify(copy.submission.evidence));
 copy.review={scores:{},comments:{},critical:{},reviewer:'',notes:'',remediation:'',completedAt:null,...copy.review};
 return copy;
}
