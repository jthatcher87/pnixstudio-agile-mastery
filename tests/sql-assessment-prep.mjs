import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fixture,extra,queries,diagnostics,tasks,referenceDDL,schemaSeed,schemaProbes,rubric,criticalAreas,VERSION,DURATION} from '../site/sql/assessment-prep/data.js';
import {STORAGE_KEY,newAttempt,active,submit,setAnswer,addEvidence,totals,completeReview,outcome,exportAttempt,importSubmission} from '../site/sql/assessment-prep/model.js';
const require=createRequire(import.meta.url),cjs={exports:{}};
vm.runInNewContext(readFileSync(new URL('../site/sql/assets/sql-wasm.js',import.meta.url),'utf8'),{module:cjs,exports:cjs.exports,require,__dirname:new URL('../site/sql/assets/',import.meta.url).pathname,process,console,fetch,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout});
const sqljs=cjs.exports;let result;
const ctx={importScripts(){},initSqlJs:()=>sqljs({locateFile:()=>new URL('../site/sql/assets/sql-wasm.wasm',import.meta.url).pathname}),postMessage(v){result=v;},onmessage:null};
vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../site/sql/assessment-prep/runner.js',import.meta.url),'utf8'),ctx);
const plain=x=>JSON.parse(JSON.stringify(x));let count=0;
function check(label,fn){fn();count++;}
async function run(data){result=null;await ctx.onmessage({data});return plain(result);}
const request=(t,sql=t.answer)=>({sql,fixture,extra,answer:t.answer,action:'review',ordered:t.id==='q1'});
for(const t of tasks){
 const r=await run(request(t));check(t.id+' reference base and additional',()=>{assert.ok(!r.error,r.error);assert.equal(r.baseMatch,true);assert.equal(r.additionalMatch,true);assert.deepEqual(r.actual.values,t.expected);});
 const bad=await run(request(t,'SELECT 0;'));check(t.id+' incorrect answer',()=>assert.equal(bad.baseMatch,false));
}
const renamed=await run(request(queries[0],queries[0].answer.replace('AS department','AS department_name')));check('Alternate labels accepted',()=>assert.equal(renamed.baseMatch,true));
const alternate=await run(request(queries[1],"SELECT d.id,(SELECT COUNT(*) FROM ledger l WHERE l.department_id=d.id AND l.posted_at>='2026-01-01' AND l.posted_at<'2026-02-01') FROM departments d;"));check('Equivalent correlated query accepted',()=>{assert.equal(alternate.baseMatch,true);assert.equal(alternate.additionalMatch,true);});
const ordered=await run(request(queries[0],queries[0].answer.replace('ORDER BY l.id','ORDER BY l.id DESC')));check('Q1 ordering enforced',()=>assert.equal(ordered.baseMatch,false));
const wrongOn=await run(request(queries[1],diagnostics[0].broken));check('Broken join/date query differs',()=>assert.equal(wrongOn.baseMatch,false));
const inflated=await run(request(diagnostics[1],diagnostics[1].broken));check('Inflated budget differs',()=>{assert.equal(inflated.baseMatch,false);assert.deepEqual(inflated.actual.values,[[10,40000,25000],[20,0,0]]);});
const preview=await run({sql:queries[0].answer,fixture,action:'preview'});check('Preview withholds correctness',()=>{assert.ok(preview.actual);assert.equal(preview.baseMatch,undefined);assert.equal(preview.expected,undefined);assert.equal(preview.additionalMatch,undefined);});
for(const sql of ['DELETE FROM ledger;','WITH x AS (SELECT 1) DELETE FROM ledger;','PRAGMA query_only=OFF;','SELECT 1; SELECT 2;']){const r=await run({sql,fixture,action:'preview'});check('Read-only single query '+sql,()=>assert.ok(r.error));}
const hardcoded=await run(request(queries[2],'SELECT 10,25000;'));check('Additional fixture catches hard-coded Q3',()=>{assert.equal(hardcoded.baseMatch,true);assert.equal(hardcoded.additionalMatch,false);});
const parsed=await run({sql:queries[7].answer,fixture:fixture+extra,action:'preview'});check('Signed, bounded ASCII validation',()=>{const rows=Object.fromEntries(parsed.actual.values.map(r=>[r[0],r.slice(1)]));assert.deepEqual(rows[9],['valid',-500]);assert.deepEqual(rows[10],['invalid',null]);assert.deepEqual(rows[12],['invalid',null]);assert.deepEqual(rows[13],['invalid',null]);assert.deepEqual(rows[14],['invalid',null]);assert.deepEqual(rows[15],['valid',0]);assert.deepEqual(rows[16],['valid',-999999999]);assert.deepEqual(rows[17],['invalid',null]);});
const schemaRequest=sql=>({mode:'schema',action:'review',sql,schemaSeed,probes:schemaProbes});
const correct=await run(schemaRequest(referenceDDL));check('Reference design passes every behavior probe',()=>{assert.ok(!correct.error,correct.error);assert.equal(correct.checks.length,schemaProbes.length);assert.ok(correct.checks.every(c=>c.passed));});
for(const [name,ddl,label]of [
 ['wrong source scope',referenceDDL.replace('UNIQUE(source_system,source_key)','UNIQUE(source_key)'),'Allow the same key from another source'],
 ['missing source uniqueness',referenceDDL.replace(',\n UNIQUE(source_system,source_key)',''),'Reject a duplicate source-system/key across imports'],
 ['weak type',referenceDDL.replace(" CHECK(typeof(amount_cents)='integer')",''),'Reject a malformed amount'],
 ['missing amount mandatory',referenceDDL.replace("amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer')",'amount_cents INTEGER'),'Reject a missing amount'],
 ['cascading account delete',referenceDDL.replace('REFERENCES accounts(code) ON DELETE RESTRICT','REFERENCES accounts(code) ON DELETE CASCADE'),'Preserve a referenced account'],
 ['no department relationship',referenceDDL.replace(' REFERENCES departments(id) ON DELETE RESTRICT',''),'Reject an unknown department']
]){const r=await run(schemaRequest(ddl));check(name,()=>{assert.ok(!r.error,r.error);assert.equal(r.checks.find(c=>c.label===label).passed,false);});}
const altNames=await run(schemaRequest(referenceDDL.replaceAll('transactions','entries')));check('Alternative design is routed to human review',()=>assert.match(altNames.error,/Alternate names or structures require reviewer inspection/));
const schemaPreview=await run({mode:'schema',action:'preview',sql:referenceDDL,demo:schemaSeed+"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',50,'A','a'); SELECT COUNT(*) FROM transactions;"});check('Demo errors retained and later SQL continues',()=>{assert.ok(schemaPreview.trace.some(t=>t.error));assert.deepEqual(schemaPreview.trace.at(-1).output.values,[[1]]);assert.equal(schemaPreview.checks,undefined);});
const disabledFK=await run({mode:'schema',action:'preview',sql:'PRAGMA foreign_keys=OFF;'+referenceDDL});check('DDL cannot disable foreign keys',()=>assert.match(disabledFK.error,/not permitted/));
check('Rubric sums to approved component totals',()=>{const t={};for(const c of rubric)t[c.part]=(t[c.part]||0)+c.max;assert.deepEqual(t,{A:20,B:50,C:20,D:10});});
const now=100000,a=newAttempt('Candidate',now);check('Blank attempt and distinct storage',()=>{assert.equal(outcome(a),'Assessment incomplete');assert.deepEqual(a.answers,{});assert.notEqual(STORAGE_KEY,'pnix-sql-assessment-prep-v1');});
check('Active draft updates',()=>{assert.equal(setAnswer(a,'q1SQL','SELECT 1;',now+1),true);assert.equal(addEvidence(a,{question:'q1',sql:'SELECT 1;',result:{actual:{values:[[1]]}}},now+2),true);});
const persisted=JSON.parse(JSON.stringify(a));check('Refresh preserves absolute deadline',()=>{assert.equal(active(persisted,now+DURATION-1),true);assert.equal(active(persisted,now+DURATION),false);});
submit(a,now+1000);const snapshot=JSON.stringify(a.submission);check('Submit creates frozen copy',()=>{a.answers.q1SQL='changed';assert.equal(a.submission.answers.q1SQL,'SELECT 1;');assert.equal(outcome(a),'Submitted — awaiting review');});
check('Edits, late execution and resubmission cannot alter snapshot',()=>{assert.equal(setAnswer(a,'q1SQL','x',now+1001),false);assert.equal(addEvidence(a,{question:'late'},now+1002),false);submit(a,now+2000);assert.equal(JSON.stringify(a.submission),snapshot);});
const expired=newAttempt('Expired',now);setAnswer(expired,'e1','before',now+1);check('Expired input auto-submits without accepting late edits',()=>{assert.equal(setAnswer(expired,'e1','after',now+DURATION+100),false);assert.equal(expired.submission.answers.e1,'before');assert.equal(expired.submission.elapsedMs,DURATION);assert.equal(expired.submission.submittedAt,expired.deadline);assert.equal(expired.submission.reason,'time expired');});
check('Unmarked review cannot complete',()=>assert.ok(completeReview(a,now+2000).length));
function mark(attempt){const r=attempt.review;r.reviewer='Reviewer';r.notes='Inspected SQL, explanations and fixture evidence.';for(const c of rubric)r.scores[c.id]=c.max;for(const p of criticalAreas)r.critical[p]='resolved';}
mark(a);check('Perfect manual review yields first benchmark only',()=>{assert.deepEqual(completeReview(a,now+3000),[]);assert.equal(totals(a.review).total,100);assert.equal(outcome(a),'First readiness benchmark met');assert.ok(!outcome(a).includes('two-form'));});
a.review.critical[criticalAreas[0]]='unresolved';a.review.remediation='Targeted outer-join practice followed by a fresh unseen task.';check('Critical error overrides perfect score',()=>{assert.deepEqual(completeReview(a,now+4000),[]);assert.equal(outcome(a),'Remediation required');});
a.review.critical[criticalAreas[0]]='resolved';a.review.scores.a0=5;check('Out-of-range score rejected',()=>assert.ok(completeReview(a).some(s=>s.includes('0 to 4'))));a.review.scores.a0=4;
const border=newAttempt('Borderline',now);submit(border,now+1000);mark(border);for(const [part,earned]of [['A',15],['B',38],['C',15],['D',8]]){let remaining=earned;for(const c of rubric.filter(c=>c.part===part)){border.review.scores[c.id]=Math.min(c.max,remaining);remaining-=border.review.scores[c.id];}}
check('Component minimums alone do not meet 85 total',()=>{assert.equal(totals(border.review).total,76);assert.ok(completeReview(border).some(s=>s.includes('remediation')));border.review.remediation='Practice and retest';completeReview(border);assert.equal(outcome(border),'Remediation required');});
mark(border);border.review.scores.a0=0;border.review.scores.a1=2;check('Component deficit overrides high total',()=>{completeReview(border);assert.equal(totals(border.review).total,94);assert.equal(outcome(border),'Remediation required');});
const familiar=newAttempt('Retake',now,true);submit(familiar,now+10);mark(familiar);completeReview(familiar);check('Repeated Form A never counts as unseen',()=>assert.equal(outcome(familiar),'Practice benchmark met — familiar Form A'));
const payload=exportAttempt(familiar,[a]);check('Export includes immutable work, review, timing and history',()=>{assert.equal(payload.attempt.submission.elapsedMs,10);assert.equal(payload.history.length,1);assert.match(payload.testEngineReadiness,/Unverified/);assert.match(payload.secondForm,/Not yet approved/);});
const imported=importSubmission(payload);check('Reviewer handoff preserves submission',()=>assert.deepEqual(imported.submission,familiar.submission));
check('Draft import rejected',()=>assert.throws(()=>importSubmission(exportAttempt(newAttempt('Draft',now))),/submitted/));
check('Other assessment version rejected',()=>assert.throws(()=>importSubmission({...payload,version:'other'})));
check('Bad timing rejected',()=>assert.throws(()=>importSubmission({...payload,attempt:{...familiar,deadline:0}}),/invalid/));
const html=readFileSync(new URL('../site/sql/assessment-prep/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../site/sql/assessment-prep/app.js',import.meta.url),'utf8');
check('Old election content removed from visible page',()=>assert.ok(!/election|ballot|voter/i.test(html)));
check('No candidate correctness button or solution reveal',()=>{assert.ok(!html.includes('id="check"'));assert.ok(html.includes('id="review" class="glass" hidden'));assert.ok(!html.includes('id="showQuery"'));assert.match(app,/\$\('review'\)\.hidden=!a\?\.submission/);});
check('Answers rendered safely as text',()=>{assert.ok(!app.includes('innerHTML'));assert.match(app,/textContent=text/);});
console.log(`${count} readiness checks passed; ${schemaProbes.length} reference-schema behavior probes passed. Covers all 10 query/diagnostic references on both fixtures, malformed inputs, alternate solutions, scoring, frozen submissions, timing, reviewer handoff and feedback boundaries.`);

// Exercise the actual application event handlers with a small DOM adapter.
// This verifies behavior, not browser layout or rendering.
const domNodes=[],byId=new Map(),events={};
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.checked=false;this._text='';this.className='';domNodes.push(this);}
 set id(v){this._id=v;byId.set(v,this);}get id(){return this._id;}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent||'').join(' ');}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this._text='';this.children=nodes;}
 setAttribute(k,v){this[k]=v;}focus(){this.focused=true;}scrollIntoView(){}remove(){}
 click(){if(!this.disabled)this.onclick?.();}
}
const htmlTags=html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*\bid="[^"]+"[^>]*)>/g);
for(const match of htmlTags){const n=new Node(match[1]),attrs=match[2];n.id=attrs.match(/\bid="([^"]+)"/)[1];n.hidden=/\bhidden\b/.test(attrs);n.className=attrs.match(/\bclass="([^"]*)"/)?.[1]||'';const key=attrs.match(/\bdata-answer="([^"]+)"/)?.[1];if(key)n.dataset.answer=key;}
const body=new Node('body'),doc={getElementById:id=>byId.get(id),createElement:tag=>new Node(tag),body,querySelectorAll:selector=>domNodes.filter(n=>selector==='[data-answer]'?n.dataset.answer:selector==='.run'?n.className.split(' ').includes('run'):false)};
const storage=new Map();let intervalCallback;const oldNow=Date.now;let clock=200000;Date.now=()=>clock;
const globals={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,confirm:globalThis.confirm,Worker:globalThis.Worker,setInterval:globalThis.setInterval};
globalThis.document=doc;globalThis.window={addEventListener:(key,fn)=>events[key]=fn};globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.confirm=()=>true;
globalThis.setInterval=fn=>{intervalCallback=fn;return 1;};
globalThis.Worker=class{constructor(){}terminate(){}postMessage(data){run(data).then(r=>this.onmessage?.({data:r}));}};
const node=id=>doc.getElementById(id),settle=()=>new Promise(resolve=>setTimeout(resolve,15));
try{
 await import('../site/sql/assessment-prep/app.js?integration');
 check('UI initially hides questions and references',()=>{assert.equal(node('assessment').hidden,true);assert.equal(node('review').hidden,true);assert.equal(node('references').children.length,0);});
 node('candidate').value='Integration Candidate';node('conditions').checked=true;node('start').click();
 check('Start reveals blank timed attempt',()=>{assert.equal(node('assessment').hidden,false);assert.equal(node('review').hidden,true);assert.equal(node('sql-q1').value,'');assert.equal(node('clock').textContent,'90:00 remaining');});
 node('sql-q1').value=queries[0].answer;node('sql-q1').oninput();node('run-q1').click();await settle();
 check('Candidate run shows output without grading',()=>{assert.match(node('output-q1').textContent,/Clinical/);assert.ok(!node('output-q1').textContent.includes('matches'));assert.equal(node('review').hidden,true);const saved=JSON.parse(storage.get(STORAGE_KEY));assert.equal(saved.attempt.evidence.length,1);});
 node('submit').click();
 check('Submission locks inputs and exposes reviewer workspace',()=>{assert.equal(node('sql-q1').disabled,true);assert.equal(node('run-q1').disabled,true);assert.equal(node('review').hidden,false);assert.equal(node('references').children.length>0,true);assert.match(node('status').textContent,/awaiting review/);});
 node('marking').onsubmit({preventDefault(){}});
 check('Incomplete marking stays awaiting review',()=>assert.match(node('status').textContent,/awaiting review/));
 for(const c of rubric){node('mark-'+c.id).value=String(c.max);node('mark-'+c.id).oninput();}
 node('reviewer').value='Human Reviewer';node('reviewer').oninput();node('review-notes').value='Reviewed all rubric criteria against the submitted work.';node('review-notes').oninput();
 criticalAreas.forEach((area,i)=>{node('critical-'+i).value='resolved';node('critical-'+i).onchange();});node('marking').onsubmit({preventDefault(){}});
 check('Reviewer marking yields first benchmark only',()=>assert.equal(node('status').textContent,'First readiness benchmark met'));
 node('mark-q1a').value='';node('mark-q1a').oninput();
 check('Editing a completed review invalidates completion',()=>assert.match(node('status').textContent,/awaiting review/));
 node('retake').click();node('candidate').value='Integration Candidate';node('conditions').checked=true;node('start').click();
 check('Retake is blank and marked familiar',()=>{const a=JSON.parse(storage.get(STORAGE_KEY)).attempt;assert.equal(a.exposed,true);assert.equal(node('sql-q1').value,'');});
 node('answer-e1').value='Saved before expiry';node('answer-e1').oninput();clock+=DURATION+10;intervalCallback();
 check('Timer expiry freezes UI and saved draft',()=>{const a=JSON.parse(storage.get(STORAGE_KEY)).attempt;assert.equal(a.submission.reason,'time expired');assert.equal(a.submission.answers.e1,'Saved before expiry');assert.equal(node('answer-e1').disabled,true);assert.equal(node('review').hidden,false);});
 const saved=JSON.parse(storage.get(STORAGE_KEY));
 node('import-attempt').files=[{size:100,text:async()=>JSON.stringify(exportAttempt(saved.attempt))}];await node('import-attempt').onchange({target:node('import-attempt')});
 check('Submission handoff opens for review',()=>assert.match(node('transfer-feedback').textContent,/opened for reviewer marking/));
 const blobs=[];const previousCreate=URL.createObjectURL;URL.createObjectURL=blob=>{blobs.push(blob);return previousCreate(blob);};
 node('download-json').click();node('download-text').click();URL.createObjectURL=previousCreate;
 const jsonDownload=JSON.parse(await blobs[0].text()),textDownload=await blobs[1].text();
 check('Downloads contain frozen answers, timing and review',()=>{assert.equal(jsonDownload.attempt.submission.answers.e1,'Saved before expiry');assert.ok(jsonDownload.attempt.review);assert.match(textDownload,/Saved before expiry/);assert.match(textDownload,/Elapsed milliseconds/);assert.match(textDownload,/Engine readiness/);});
 const next=newAttempt('Remote submit',clock);const savedState=JSON.parse(storage.get(STORAGE_KEY));savedState.attempt=next;storage.set(STORAGE_KEY,JSON.stringify(savedState));
 check('Deadline remains absolute in saved state',()=>assert.equal(savedState.attempt.deadline,clock+DURATION));
}finally{Date.now=oldNow;Object.assign(globalThis,globals);}
console.log(`${count} total readiness checks passed, including actual application handlers for starting, execution, submission, marking, retake, timer expiry and reviewer handoff. DOM adapter does not verify visual rendering.`);
