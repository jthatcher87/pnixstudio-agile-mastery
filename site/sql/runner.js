importScripts('assets/sql-wasm.js');
let engine;
const ready=initSqlJs({locateFile:f=>'assets/'+f}).then(s=>engine=s);
function run(sql, seed){const db=new engine.Database();try{db.run(seed);db.run('PRAGMA query_only = ON');const stmt=db.prepare(sql);const columns=stmt.getColumnNames();if(!columns.length)throw Error('Use a SELECT query that returns columns.');const values=[];while(stmt.step()){if(values.length>=500)throw Error('Result exceeds 500 rows. Narrow your query or use LIMIT.');values.push(stmt.get());}stmt.free();return {columns,values};}finally{db.close();}}
onmessage=async({data})=>{try{await ready;if(data.type==='ready'){postMessage({ready:true});return;} // prepare rejects trailing statements separately
const db=new engine.Database();try{db.run(data.seed);db.run('PRAGMA query_only = ON');let count=0;for(const stmt of db.iterateStatements(data.sql)){count++;stmt.free();}if(count!==1)throw Error('Run one SELECT statement at a time.');}finally{db.close();}
const actual=run(data.sql,data.seed);let expected=null,hidden=null;if(data.answer){expected=run(data.answer,data.seed);hidden={actual:run(data.sql,data.seed+data.extra),expected:run(data.answer,data.seed+data.extra)};}postMessage({actual,expected,hidden});}catch(e){postMessage({error:e.message});}};
