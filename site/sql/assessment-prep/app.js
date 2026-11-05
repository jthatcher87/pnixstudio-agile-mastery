import {VERSION,fixture,extra,queries,diagnostics,tasks,explanations,schemaRequirements,demonstrations,referenceDDL,schemaSeed,schemaProbes,rubric,criticalAreas} from './data.js';
import {STORAGE_KEY,newAttempt,active,submit,setAnswer,addEvidence,totals,completeReview,outcome,exportAttempt,importSubmission} from './model.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
let state={attempt:null,history:[]},loadError=false,epoch=0,reviewChecks=null,busy=false;
try{const loaded=JSON.parse(localStorage.getItem(STORAGE_KEY));if(loaded?.version===VERSION&&Array.isArray(loaded.history))state={attempt:loaded.attempt,history:loaded.history};}catch{loadError=true;}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:VERSION,...state}));$('storage').textContent='Saved in this browser. Download a copy for reviewer handoff or backup.';}catch{$('storage').textContent='Browser storage is unavailable or full. Download your attempt before leaving.';$('storage').className='error';}}
function field(id,key,label,sql=false){const wrap=el('div'),l=el('label',label),a=el('textarea');l.htmlFor=id;a.id=id;a.dataset.answer=key;a.className=sql?'sql':'writing';if(sql){a.spellcheck=false;a.setAttribute('autocapitalize','off');a.autocomplete='off';}wrap.append(l,a);return wrap;}
for(const t of schemaRequirements)$('requirements').append(el('li',t));
for(const t of demonstrations)$('demonstrations').append(el('li',t));
$('fixture-sql').textContent=fixture;
for(const t of tasks){
 const s=el('article',undefined,'question');s.id=t.id;s.append(el('h3',t.id.toUpperCase()+' · '+t.title+' · '+t.points+' points'),el('p',t.prompt));
 if(t.broken){s.append(el('p','Query to diagnose:'),el('pre',t.broken));}
 s.append(field('sql-'+t.id,t.id+'SQL',t.broken?'Corrected SQL':'Your SQL',true));
 const b=el('button','Run query','run');b.id='run-'+t.id;b.onclick=()=>runQuery(t);s.append(b);
 const out=el('div',undefined,'execution');out.id='output-'+t.id;out.setAttribute('aria-live','polite');s.append(out);
 s.append(field('notes-'+t.id,t.id+'Notes',t.part==='C'?'Diagnosis, fixture evidence and verification':t.id==='q4'?'Explain NULL and zero':t.id==='q6'?'Data-quality concerns affecting confidence':'Reasoning or assumptions (optional)'));
 $(t.part==='B'?'query-questions':'diagnostic-questions').append(s);
}
for(const e of explanations){const s=el('article',undefined,'question');s.append(el('h3',e.id.toUpperCase()+' · 2 points'),el('p',e.prompt),field('answer-'+e.id,e.id,'Your explanation'));$('explanation-questions').append(s);}
function table(output){
 const wrap=el('div',undefined,'table-wrap');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Scrollable SQL results');
 const t=el('table'),head=el('thead'),tr=el('tr');for(const c of output.columns||[]){const th=el('th',c);th.scope='col';tr.append(th);}head.append(tr);t.append(head);const body=el('tbody');
 for(const row of output.values||[]){const r=el('tr');for(const v of row)r.append(el('td',v===null?'NULL':String(v)));body.append(r);}t.append(body);wrap.append(t,el('p',(output.values||[]).length+' row(s)'));return wrap;
}
function output(node,r){node.replaceChildren();if(r.error)node.append(el('p',r.error,'error'));if(r.actual)node.append(table(r.actual));if(r.tables)for(const t of r.tables)node.append(table(t));for(const s of r.trace||[]){node.append(el('p','Statement '+s.statement+(s.error?': '+s.error:': executed'),s.error?'error':''));if(s.output?.columns?.length)node.append(table(s.output));}if(r.checks)for(const c of r.checks)node.append(el('p',(c.passed?'✓ ':'Needs review: ')+c.label+(c.detail?' — '+c.detail:''),c.passed?'success':''));}
function worker(data){return new Promise(resolve=>{const w=new Worker('runner.js');let done=false;const finish=r=>{if(done)return;done=true;clearTimeout(timer);w.terminate();resolve(r);};const timer=setTimeout(()=>finish({error:'Execution exceeded eight seconds. The temporary database was discarded.'}),8000);w.onmessage=e=>finish(e.data);w.onerror=()=>finish({error:'The SQLite engine could not load. Check the connection and refresh.'});w.postMessage(data);});}
function ensureActive(){
 const a=state.attempt;if(active(a))return true;
 if(a&&!a.submission){submit(a);epoch++;save();render();}return false;
}
function lockButtons(){document.querySelectorAll('.run').forEach(b=>b.disabled=busy||!active(state.attempt));}
async function executeCandidate(key,sql,data,node){
 if(busy||!ensureActive())return;busy=true;lockButtons();const ticket=epoch;node.replaceChildren(el('p','Running on a fresh temporary database…'));
 const r=await worker(data);busy=false;lockButtons();if(ticket!==epoch)return;
 if(!ensureActive())return;
 output(node,r);addEvidence(state.attempt,{question:key,sql,result:r});save();
}
function runQuery(t){const sql=state.attempt?.answers[t.id+'SQL']||'';return executeCandidate(t.id,sql,{sql,fixture,action:'preview'},$('output-'+t.id));}
$('inspect').onclick=()=>executeCandidate('inspection',$('inspect-sql').value,{sql:$('inspect-sql').value,fixture,action:'preview'},$('output-inspect'));
$('run-schema').onclick=()=>{const a=state.attempt;executeCandidate('schema',a?.answers.schemaSQL||'',{mode:'schema',action:'preview',sql:a?.answers.schemaSQL||'',demo:a?.answers.demoSQL||''},$('output-schema'));};
function drawSnapshot(){
 const a=state.attempt;if(!a?.submission)return;
 $('snapshot-info').textContent=a.candidate+' · Form A · '+(a.exposed?'Familiar practice':'Declared unseen attempt')+' · submitted '+new Date(a.submission.submittedAt).toLocaleString()+' · '+Math.round(a.submission.elapsedMs/60000)+' minute(s) · '+a.submission.reason;
 const list=$('submitted-answers');list.replaceChildren();for(const [k,v]of Object.entries(a.submission.answers)){list.append(el('h3',k),el('pre',v||'(blank)'));}
 $('execution-history').textContent=JSON.stringify(a.submission.evidence,null,2);
}
function drawReferences(){
 const box=$('references');box.replaceChildren(el('h3','Schema reference — one defensible design'),el('pre',referenceDDL),el('p','Alternate correct schemas receive equal credit. The reference design stores integer cents and uses UNIQUE(source_system,source_key), not source_key alone. Schema behavior checks are supporting evidence, not a formal proof.'));
 for(const t of tasks)box.append(el('h3',t.id.toUpperCase()+' · '+t.title),el('pre',t.answer),el('p','Base expected rows (column order follows the question):'),el('pre',JSON.stringify(t.expected,null,2)),el('p',t.note));
 for(const e of explanations)box.append(el('h3',e.id.toUpperCase()),el('p',e.answer));
 box.append(el('p','Q1–Q6: approach 2; joins/filters/grouping 2; output and edge behavior 2. Q4 includes explanation and Q6 includes the data-quality observation in the final two points. Q7: approach 2, both key fields 3, output 2. Q8: normalization 2, validation 3, safe conversion/output 2. Hard-coded answers receive no correctness credit. Correct alternative solutions receive equal credit.'));
}
function changedReview(){if(!state.attempt?.submission)return;state.attempt.review.completedAt=null;save();updateSummary();$('review-feedback').textContent='Review changed. Record the completed review again when ready.';}
function drawRubric(){
 const r=state.attempt.review,box=$('rubric');box.replaceChildren();let part='';
 for(const c of rubric){if(c.part!==part){part=c.part;box.append(el('h3','Part '+part));}
 const row=el('div',undefined,'mark-row'),label=el('label',c.label+' (0–'+c.max+')'),input=el('input');input.id='mark-'+c.id;label.htmlFor=input.id;input.type='number';input.min='0';input.max=String(c.max);input.step='0.5';input.value=typeof r.scores[c.id]==='number'?r.scores[c.id]:'';
 input.oninput=()=>{if(input.value==='')delete r.scores[c.id];else r.scores[c.id]=Number(input.value);changedReview();};
 const comment=el('div',undefined,'comment'),cl=el('label','Reviewer comment for '+c.label),ci=el('input');ci.id='comment-'+c.id;cl.htmlFor=ci.id;ci.value=r.comments[c.id]||'';ci.oninput=()=>{r.comments[c.id]=ci.value;changedReview();};comment.append(cl,ci);row.append(label,input,comment);box.append(row);}
 const critical=$('critical');critical.replaceChildren();for(const area of criticalAreas){const l=el('label',area),s=el('select');s.id='critical-'+criticalAreas.indexOf(area);l.htmlFor=s.id;for(const [value,text]of [['','Select a decision'],['resolved','Resolved / no fundamental error'],['unresolved','Unresolved — remediation required']]){const o=el('option',text);o.value=value;s.append(o);}s.value=r.critical[area]||'';s.onchange=()=>{r.critical[area]=s.value;changedReview();};critical.append(l,s);}
 for(const [id,key]of [['reviewer','reviewer'],['review-notes','notes'],['remediation','remediation']]){$(id).value=r[key]||'';$(id).oninput=()=>{r[key]=$(id).value;changedReview();};}
}
function drawCheckResults(checks){
 const box=$('check-results');box.replaceChildren();
 for(const c of checks||[]){const d=el('details'),r=c.result,s=el('summary',c.question.toUpperCase()+(c.question==='schema'?' · schema behavior evidence':r.error?' · execution needs review':' · base '+(r.baseMatch?'matches':'differs')+', additional '+(r.additionalMatch?'matches':'differs')));d.append(s);const out=el('div');output(out,r);d.append(out);if(r.expected)d.append(el('p','Reference output:'),table(r.expected));d.append(el('p','This evidence does not assign rubric points.'));box.append(d);}
}
function updateSummary(){
 const a=state.attempt;$('status').textContent=outcome(a);if(!a?.submission)return;
 const t=totals(a.review),box=$('score-summary');box.replaceChildren(el('h3',outcome(a)),el('p','Recorded points: A '+t.A+'/20 · B '+t.B+'/50 · C '+t.C+'/20 · D '+t.D+'/10 · Total '+t.total+'/100'),el('p','Minimums: total 85; A 15, B 38, C 15, D 8. All fundamental errors must be resolved. Only Form A is available; this cannot establish two-form readiness. Actual test-engine readiness remains unverified.'));
}
function render(){
 const a=state.attempt;if(a&&!a.submission&&Date.now()>=a.deadline){submit(a);save();}
 $('setup').hidden=!!a;$('assessment').hidden=!a;$('review').hidden=!a?.submission;$('retake').hidden=!a?.submission;$('submit').disabled=!active(a);$('import-attempt').disabled=!!a&&!a.submission;
 document.querySelectorAll('[data-answer]').forEach(f=>{f.value=(a?.submission?.answers||a?.answers||{})[f.dataset.answer]||'';f.disabled=!active(a);});$('inspect-sql').disabled=!active(a);lockButtons();
 if(a?.submission){drawSnapshot();drawReferences();drawRubric();drawCheckResults(a.reviewChecks);}else{$('check-results').replaceChildren();}
 $('download-json').disabled=!a;$('download-text').disabled=!a;
 const history=$('history');history.replaceChildren();for(const old of state.history)history.append(el('p',old.candidate+' · '+new Date(old.startedAt).toLocaleString()+' · '+outcome(old)));
 updateSummary();tick();
}
function tick(){
 const a=state.attempt;if(!a){$('clock').textContent='90:00 remaining';return;}
 if(!a.submission&&Date.now()>=a.deadline){submit(a);epoch++;save();render();return;}
 const left=Math.max(0,Math.ceil((a.deadline-Date.now())/1000));$('clock').textContent=a.submission?'Attempt submitted':Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' remaining';
 $('timing').textContent='Started '+new Date(a.startedAt).toLocaleString()+' · deadline '+new Date(a.deadline).toLocaleString();
}
for(const f of document.querySelectorAll('[data-answer]'))f.oninput=()=>{if(setAnswer(state.attempt,f.dataset.answer,f.value)){save();}else{epoch++;save();render();}};
$('start').onclick=()=>{
 const name=$('candidate').value.trim();if(!name){$('candidate').focus();$('storage').textContent='Enter the candidate name.';return;}
 if(!$('conditions').checked){$('conditions').focus();$('storage').textContent='Confirm the attempt conditions before starting.';return;}
 state.attempt=newAttempt(name,Date.now(),$('familiar').checked||state.history.length>0);reviewChecks=null;epoch++;save();render();$('part-a').tabIndex=-1;$('part-a').focus();
};
$('submit').onclick=()=>{if(!ensureActive())return;if(!confirm('Submit and freeze all answers? Unfinished answers will also be submitted.'))return;submit(state.attempt);epoch++;save();render();$('review').tabIndex=-1;$('review').focus();};
$('marking').onsubmit=e=>{e.preventDefault();const errors=completeReview(state.attempt);$('review-feedback').textContent=errors.length?errors.join(' '):'Review recorded. '+outcome(state.attempt)+'.';save();updateSummary();};
$('check-submission').onclick=async()=>{
 if(busy||!state.attempt?.submission)return;busy=true;$('check-submission').disabled=true;const ticket=epoch,id=state.attempt.id,a=state.attempt.submission.answers,checks=[];const box=$('check-results');box.replaceChildren(el('p','Checking the frozen SQL on base and additional fixtures…'));
 for(const t of tasks){const sql=a[t.id+'SQL']||'';const r=sql.trim()?await worker({sql,fixture,extra,answer:t.answer,action:'review',ordered:t.id==='q1'}):{error:'No SQL submitted.'};if(epoch!==ticket||state.attempt.id!==id){busy=false;$('check-submission').disabled=false;lockButtons();return;}checks.push({question:t.id,result:r});}
 const schema=a.schemaSQL?.trim()?await worker({mode:'schema',action:'review',sql:a.schemaSQL,schemaSeed,probes:schemaProbes}):{error:'No schema submitted.'};
 if(epoch!==ticket){busy=false;$('check-submission').disabled=false;lockButtons();return;}checks.push({question:'schema',result:schema});reviewChecks=checks;state.attempt.reviewChecks=checks;box.replaceChildren();
 drawCheckResults(checks);busy=false;$('check-submission').disabled=false;lockButtons();save();
};
$('retake').onclick=()=>{if(!state.attempt?.submission||!confirm('Archive this submission and begin a blank familiar-practice setup? A repeated Form A cannot count as a new unseen form.'))return;state.history.push(state.attempt);state.attempt=null;reviewChecks=null;epoch++;$('candidate').value='';$('familiar').checked=true;$('conditions').checked=false;$('check-results').replaceChildren();save();render();$('setup').scrollIntoView();};
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function report(){const a=state.attempt,payload=exportAttempt(a,state.history),snapshot=a.submission||{answers:a.answers,evidence:a.evidence};let s='PNiXStudio — SQL Screening Readiness — Form A\n'+outcome(a)+'\nCandidate: '+a.candidate+'\nStarted: '+new Date(a.startedAt).toISOString()+'\nDeadline: '+new Date(a.deadline).toISOString()+'\nDeclared familiar: '+a.exposed+'\nSubmitted: '+(a.submission?new Date(a.submission.submittedAt).toISOString():'No — draft')+'\nElapsed milliseconds: '+(a.submission?.elapsedMs??Math.max(0,Date.now()-a.startedAt))+'\nEngine readiness: '+payload.testEngineReadiness+'\n'+payload.secondForm+'\n\n';for(const [k,v]of Object.entries(snapshot.answers))s+=k+'\n'+v+'\n\n';s+='Execution evidence\n'+JSON.stringify(snapshot.evidence,null,2)+'\n\nReviewer: '+a.review.reviewer+'\n'+JSON.stringify({totals:totals(a.review),review:a.review,postSubmissionChecks:a.reviewChecks||[]},null,2);return s;}
$('download-json').onclick=()=>{if(state.attempt)download(JSON.stringify(exportAttempt(state.attempt,state.history),null,2),'pnix-sql-readiness-form-a.json','application/json');};
$('download-text').onclick=()=>{if(state.attempt)download(report(),'pnix-sql-readiness-form-a.txt','text/plain;charset=utf-8');};
$('import-attempt').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(state.attempt&&!state.attempt.submission)throw Error('Finish the active attempt before opening another submission.');if(file.size>2*1024*1024)throw Error('Submission exceeds 2 MB.');const a=importSubmission(JSON.parse(await file.text()));if(state.attempt&&!confirm('Archive the current submission and open this file for review?'))return;if(state.attempt)state.history.push(state.attempt);state.attempt=a;epoch++;reviewChecks=null;save();render();$('transfer-feedback').textContent='Submission opened for reviewer marking. Exported identity and timing are self-reported, not authenticated.';}catch(error){$('transfer-feedback').textContent=error.message;}finally{e.target.value='';}};
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY||!e.newValue)return;try{const remote=JSON.parse(e.newValue);if(remote.version===VERSION&&remote.attempt?.id===state.attempt?.id&&remote.attempt.submission&&!state.attempt.submission){state.attempt=remote.attempt;epoch++;render();}}catch{}});
window.addEventListener('beforeunload',save);
if(loadError)$('storage').textContent='Saved state could not be read. Earlier storage was not imported.';
render();setInterval(tick,1000);
