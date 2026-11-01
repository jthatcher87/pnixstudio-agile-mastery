import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import vm from 'node:vm';import assert from 'node:assert/strict';import {modules,seed,extra} from '../site/sql/scripting/course.js';
const require=createRequire(import.meta.url),cjs={exports:{}};vm.runInNewContext(readFileSync(new URL('../site/sql/assets/sql-wasm.js',import.meta.url),'utf8'),{module:cjs,exports:cjs.exports,require,__dirname:new URL('../site/sql/assets/',import.meta.url).pathname,process,console,fetch,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout});const sqljs=cjs.exports;let result;
const ctx={importScripts(){},initSqlJs:()=>sqljs({locateFile:()=>new URL('../site/sql/assets/sql-wasm.wasm',import.meta.url).pathname}),postMessage(v){result=v;},onmessage:null};vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../site/sql/scripting/runner.js',import.meta.url),'utf8'),ctx);
async function run(sql,exercise=null){result=null;await ctx.onmessage({data:{sql,seed,extra,exercise}});return result;}
let tests=0;for(const mod of modules)for(const e of mod.exercises){const r=await run(e.answer,e);assert.ok(!r.error,e.title+': '+r.error);assert.equal(r.passed,true,e.title+': '+JSON.stringify(r));tests++;const wrong=await run(e.starter,e);assert.ok(wrong.error||!wrong.passed,'Starter should not complete '+e.title);tests++;}
assert.match((await run('BEGIN; UPDATE employees SET salary=0;')).error,/transaction is still open/);tests++;
assert.match((await run('SELECT 1; SELECT missing FROM employees;')).error,/Statement 2.*no such column/);tests++;
const chain=await run("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT); INSERT INTO notes VALUES (1,'a;b'); SELECT * FROM notes;");assert.equal(chain.actual.values[0][1],'a;b');tests++;
const fresh=await run('SELECT * FROM notes;');assert.match(fresh.error,/no such table/);tests++;
const rollback=await run('BEGIN; UPDATE employees SET salary=0; ROLLBACK; SELECT salary FROM employees WHERE id=1;');assert.equal(rollback.actual.values[0][0],95000);tests++;
assert.equal((await run("INSERT INTO employees(id,name) VALUES(1,'Duplicate');")).error.includes('UNIQUE constraint'),true);tests++;
const commit=await run("BEGIN; UPDATE employees SET city='Chicago' WHERE id=2; COMMIT; SELECT city FROM employees WHERE id=2;");assert.equal(commit.actual.values[0][0],'Chicago');tests++;
const hidden=await run('DELETE FROM employees WHERE department_id IS NULL;',modules[3].exercises[1]);assert.equal(hidden.failed.length,0);assert.ok(hidden.hiddenFailed.length>0);tests++;
const noWrite=await run('SELECT * FROM employees;',modules[4].exercises[0]);assert.ok(noWrite.failed.some(x=>x.includes('BEGIN')));tests++;
console.log(`${tests} scripting checks passed: 12 solutions on both datasets, 12 incomplete starters rejected, multi-statement order, fresh database, rollback, commit, constraints, hidden-record preservation, statement errors and transaction requirements.`);
