importScripts('../assets/sql-wasm.js');
const ready=initSqlJs({locateFile:p=>'../assets/'+p});
function command(sql){return sql.replace(/--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\//g,' ').trim().match(/^[A-Za-z]+/)?.[0].toUpperCase();}
function result(stmt){const columns=stmt.getColumnNames(),values=[];while(stmt.step()){if(values.length>=500)throw Error('Result exceeds 500 rows. Narrow the query.');values.push(stmt.get());}return {columns,values};}
function execute(db,sql,allowed,continueErrors=false){
 const trace=[];let count=0;
 for(const stmt of db.iterateStatements(sql)){
  if(++count>100)throw Error('Use at most 100 statements.');
  const source=stmt.getSQL(),cmd=command(source);
  if(!allowed.includes(cmd))throw Error('Statement '+count+': '+cmd+' is not permitted here.');
  try{const output=result(stmt);trace.push({statement:count,sql:source,output,changes:db.getRowsModified()});}
  catch(e){if(!continueErrors)throw e;trace.push({statement:count,sql:source,error:e.message});}
 }
 if(!count)throw Error('Write SQL before running.');return trace;
}
function read(engine,sql,fixture){const db=new engine.Database();try{db.run(fixture);db.run('PRAGMA query_only=ON');const trace=execute(db,sql,['SELECT','WITH']);if(trace.length!==1)throw Error('Use one SELECT or WITH query.');return trace[0].output;}finally{db.close();}}
function same(actual,expected,ordered=false){
 if(actual.columns.length!==expected.columns.length)return false;
 const key=row=>JSON.stringify(row.map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:v));
 let a=actual.values.map(key),b=expected.values.map(key);if(!ordered){a.sort();b.sort();}return JSON.stringify(a)===JSON.stringify(b);
}
function schema(engine,data){const db=new engine.Database();try{
 db.run('PRAGMA foreign_keys=ON');execute(db,data.sql,['CREATE']);
 const tables=db.exec("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
 if(data.action==='preview')return {tables,trace:data.demo?.trim()?execute(db,data.demo,['INSERT','UPDATE','DELETE','SELECT','WITH'],true):[]};
 const checks=[];
 try{db.run(data.schemaSeed);}catch(e){return {tables,checks,error:'Reference probes could not load this design: '+e.message+'. Alternate names or structures require reviewer inspection; this is not an automatic score.'};}
 const snapshot=db.export();
 for(const [label,shouldAccept,sql]of data.probes){
  const p=new engine.Database(snapshot);let accepted=false,error='';
  try{p.run('PRAGMA foreign_keys=ON');p.run(sql);accepted=p.getRowsModified()>0;}catch(e){error=e.message;}finally{p.close();}
  checks.push({label,passed:shouldAccept?accepted:!accepted&&!!error,detail:error||'Operation accepted.'});
 }
 return {tables,checks};
 }finally{db.close();}}
 onmessage=async({data})=>{try{
 const engine=await ready;
 if(data.mode==='schema'){postMessage(schema(engine,data));return;}
 const actual=read(engine,data.sql,data.fixture);
 if(data.action!=='review'){postMessage({actual});return;}
 const expected=read(engine,data.answer,data.fixture);
 const additionalActual=read(engine,data.sql,data.fixture+data.extra),additionalExpected=read(engine,data.answer,data.fixture+data.extra);
 postMessage({actual,expected,baseMatch:same(actual,expected,data.ordered),additionalMatch:same(additionalActual,additionalExpected,data.ordered),note:'Result comparison is evidence only. Reviewer must assess approach, required constructs, explanations, hard-coding and partial credit. Column labels are not graded.'});
 }catch(e){postMessage({error:e.message});}};
