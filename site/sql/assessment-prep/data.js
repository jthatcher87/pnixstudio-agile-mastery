export const FORM='A',VERSION='readiness-a-1',DURATION=90*60*1000;
export const fixture=`CREATE TABLE departments(id INTEGER PRIMARY KEY,name TEXT);
INSERT INTO departments VALUES(10,'Clinical'),(20,'Support'),(30,'Research');
CREATE TABLE ledger(id INTEGER PRIMARY KEY,department_id INTEGER,posted_at TEXT,amount_cents INTEGER,source_system TEXT,source_key TEXT);
INSERT INTO ledger VALUES
(1,10,'2026-01-01 00:00:00',10000,'A','a'),(2,10,'2026-01-31 12:00:00',15000,'A','b'),
(3,20,'2026-01-15 00:00:00',0,'A','c'),(4,20,'2026-02-01 00:00:00',5000,'A','d'),
(5,99,'2026-01-10 00:00:00',7000,'A','e'),(6,10,'2025-12-31 00:00:00',4000,'A','f'),
(7,20,'2026-01-20 00:00:00',NULL,'A','g');
CREATE TABLE budgets(department_id INTEGER,period TEXT,amount_cents INTEGER,PRIMARY KEY(department_id,period));
INSERT INTO budgets VALUES(10,'2026-01',20000),(20,'2026-01',0),(30,'2026-01',10000),(10,'2026-02',22000);
CREATE TABLE staging(id INTEGER PRIMARY KEY,source_system TEXT,source_key TEXT,amount_text TEXT);
INSERT INTO staging VALUES(1,'A','a','10000'),(2,'A','a','10000'),(3,'A','x','-250'),(4,'B','a','0'),(5,'A','y','  '),(6,'A','z','12x'),(7,'A','n',NULL),(8,'A','o','1000000000');`;
export const extra=`INSERT INTO departments VALUES(40,'Facilities');
INSERT INTO ledger VALUES(8,40,'2026-01-31 23:59:59',-500,'B','b'),(9,10,'2026-02-01 00:00:00',999,'B','c'),(10,40,'2026-01-01 00:00:00',500,'B','d'),(11,40,'2026-01-15 00:00:00',25000,'B','e');
INSERT INTO budgets VALUES(40,'2026-01',500),(20,'2026-02',700);
INSERT INTO staging VALUES(9,'B','b','-000500'),(10,'C','a','+1'),(11,'A','x','-250'),(12,'C','c','-'),(13,'C','d','1.2'),(14,'C','e','12 3'),(15,'C','f','000000000'),(16,'C','g',' -999999999 '),(17,'C','h','１２');`;
export const schemaRequirements=[
'Each department has a unique ID and a required, nonblank name.',
'Each account has a unique code and a required, nonblank description.',
'Each posted transaction belongs to one existing department and one existing account.',
'A transaction requires a posting timestamp and an amount stored as integer cents. Negative amounts and zero are permitted.',
'Each transaction has a required, nonblank source-system identifier and source-transaction key.',
'The same source key can occur in different source systems.',
'The same combination of source system and source key must not be posted twice, including across repeated imports.',
'Deleting a department or account must not silently remove its transactions.'
];
export const demonstrations=['A successful transaction insert.','Rejection of a duplicate source-system/source-key combination.','Acceptance of the same key from a different source system.','Rejection of an unknown department.','Rejection of a missing amount.','Prevention of deletion of a referenced account.'];
const jan="posted_at >= '2026-01-01' AND posted_at < '2026-02-01'";
const totals=`WITH actuals AS (SELECT department_id,SUM(amount_cents) AS actual_cents FROM ledger WHERE ${jan} GROUP BY department_id)`;
const query=(id,title,prompt,points,answer,expected,note='')=>({id,title,prompt,points,answer,expected,note,part:'B',kind:'query'});
export const queries=[
query('q1','Join transactions to departments','Return January ledger IDs, department names, and amounts for transactions with a matching department. Sort by ledger ID.',6,`SELECT l.id,d.name AS department,l.amount_cents FROM ledger l JOIN departments d ON d.id=l.department_id WHERE ${jan} ORDER BY l.id;`,[[1,'Clinical',10000],[2,'Clinical',15000],[3,'Support',0],[7,'Support',null]]),
query('q2','Preserve departments with no activity','Return every department ID and its January transaction count, including departments with no transactions. A transaction with a NULL amount still counts.',6,`SELECT d.id AS department_id,COUNT(l.id) AS transaction_count FROM departments d LEFT JOIN ledger l ON l.department_id=d.id AND l.posted_at>='2026-01-01' AND l.posted_at<'2026-02-01' GROUP BY d.id;`,[[10,2],[20,2],[30,0]]),
query('q3','Filter grouped totals','Return department IDs and January totals where the total exceeds 20,000 cents. Use GROUP BY and HAVING.',6,`SELECT department_id,SUM(amount_cents) AS total_cents FROM ledger WHERE ${jan} GROUP BY department_id HAVING SUM(amount_cents)>20000;`,[[10,25000]]),
query('q4','Explain NULL-aware aggregates','Across all January ledger rows, return total row count, populated-amount count, sum, and average. Explain how NULL and zero affect these results.',6,`SELECT COUNT(*) AS rows_seen,COUNT(amount_cents) AS populated_amounts,SUM(amount_cents) AS sum_cents,AVG(amount_cents) AS average_cents FROM ledger WHERE ${jan};`,[[5,4,32000,8000]],'Zero participates in the average; NULL does not. Include department 99 because the question requests all January ledger rows.'),
query('q5','Detect duplicate business keys','Identify duplicate staging business keys. Return source system, source key, and occurrence count.',6,'SELECT source_system,source_key,COUNT(*) AS occurrences FROM staging GROUP BY source_system,source_key HAVING COUNT(*)>1;',[['A','a',2]]),
query('q6','Reconcile budget and actuals','For every January budget, return department ID, budget, actual, actual-minus-budget variance, and variance percentage rounded to two decimals. Aggregate actuals before joining. No activity means zero; a zero budget means NULL percentage. Separately identify any data-quality concern affecting confidence in the report.',6,`${totals} SELECT b.department_id,b.amount_cents AS budget_cents,COALESCE(a.actual_cents,0) AS actual_cents,COALESCE(a.actual_cents,0)-b.amount_cents AS variance_cents,ROUND(100.0*(COALESCE(a.actual_cents,0)-b.amount_cents)/NULLIF(b.amount_cents,0),2) AS variance_pct FROM budgets b LEFT JOIN actuals a ON a.department_id=b.department_id WHERE b.period='2026-01';`,[[10,20000,25000,5000,25],[20,0,0,0,null],[30,10000,0,-10000,-100]],'Ledger row 7 has an unknown amount, so Support may be incomplete. Ledger row 5 references an unknown department and is outside the budget report. Flag both exceptions before claiming reconciliation.'),
query('q7','Find source records not posted','Using NOT EXISTS, return staging IDs whose source-system/source-key combination has no ledger match. Keep each unmatched staging row.',7,'SELECT s.id FROM staging s WHERE NOT EXISTS(SELECT 1 FROM ledger l WHERE l.source_system=s.source_system AND l.source_key=s.source_key);',[[3],[4],[5],[6],[7],[8]],'Source B/key a is not source A/key a.'),
query('q8','Validate imported amounts','Return every staging ID, a status (missing, valid, or invalid), and parsed integer cents. Use a CTE to separate normalization from validation. Trim surrounding ordinary spaces. NULL or empty text is missing. Otherwise accept one to nine ASCII digits, optionally preceded by one minus sign. Zero and leading zeros are valid. Reject plus signs, decimal points, currency symbols, embedded spaces, suffixes, and longer values. Missing or invalid values produce NULL parsed cents.',7,`WITH t AS (SELECT id,TRIM(amount_text) AS v FROM staging), n AS (SELECT *,CASE WHEN SUBSTR(v,1,1)='-' THEN SUBSTR(v,2) ELSE v END AS digits FROM t) SELECT id,CASE WHEN v IS NULL OR v='' THEN 'missing' WHEN LENGTH(digits) BETWEEN 1 AND 9 AND digits NOT GLOB '*[^0-9]*' THEN 'valid' ELSE 'invalid' END AS status,CASE WHEN LENGTH(digits) BETWEEN 1 AND 9 AND digits NOT GLOB '*[^0-9]*' THEN CAST(v AS INTEGER) END AS parsed_cents FROM n;`,[[1,'valid',10000],[2,'valid',10000],[3,'valid',-250],[4,'valid',0],[5,'missing',null],[6,'invalid',null],[7,'missing',null],[8,'invalid',null]],'These are exercise rules, not claimed Strata import specifications. A successful SQLite CAST is not validation.')
];
export const diagnostics=[
{id:'d1',part:'C',kind:'query',title:'Missing January transactions',points:10,prompt:'Explain both defects, rewrite the query to include every department and its January transaction count, and state which fixture rows demonstrate the defects.',broken:`SELECT d.id,COUNT(*) AS transaction_count
FROM departments d
LEFT JOIN ledger l ON l.department_id=d.id
WHERE l.posted_at BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY d.id;`,answer:queries[1].answer,expected:queries[1].expected,note:'The date-only upper bound excludes January 31 timestamps, including ledger row 2. WHERE removes unmatched departments, including Research. Put the half-open time window in ON and use COUNT(l.id), not COUNT(*).'},
{id:'d2',part:'C',kind:'query',title:'Inflated budget',points:10,prompt:'Explain why this query reports Clinical’s January budget incorrectly and omits Research. Rewrite it to return each January budget and its actual total.',broken:`SELECT b.department_id,SUM(b.amount_cents) AS budget_cents,
       SUM(l.amount_cents) AS actual_cents
FROM budgets b JOIN ledger l ON l.department_id=b.department_id
WHERE b.period='2026-01'
  AND l.posted_at>='2026-01-01' AND l.posted_at<'2026-02-01'
GROUP BY b.department_id;`,answer:`${totals} SELECT b.department_id,b.amount_cents AS budget_cents,COALESCE(a.actual_cents,0) AS actual_cents FROM budgets b LEFT JOIN actuals a ON a.department_id=b.department_id WHERE b.period='2026-01';`,expected:[[10,20000,25000],[20,0,0],[30,10000,0]],note:'The broken query repeats Clinical’s 20,000 budget across two ledger rows, reporting 40,000. INNER JOIN drops Research. Aggregate actuals first and LEFT JOIN them to one budget row per department/period.'}
];
export const explanations=[
['e1','Explain simplified logical processing order from FROM/joins through filtering, grouping, selection, and ordering.','FROM/ON/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT for these SQLite queries. Logical order is a reasoning model; physical execution may differ.'],
['e2','How do COUNT(*), COUNT(column), SUM, and AVG treat NULL?','COUNT(*) counts rows; COUNT(column), SUM and AVG ignore NULL values. Zero is included. SUM/AVG over no non-NULL values return NULL; COUNT returns zero.'],
['e3','Why can joining two sets of detail rows inflate totals?','Multiple matching rows create combinations that repeat amounts. State the grain and pre-aggregate each side to the intended join grain.'],
['e4','Why can a foreign key and a unique constraint enforce different requirements?','A foreign key checks a referenced relationship; UNIQUE prevents duplicate key combinations. Valid references do not by themselves prevent duplicate business transactions.'],
['e5','Why does a successful SQLite CAST not prove that imported text was valid?',"SQLite may accept a numeric prefix or convert invalid text to zero: CAST('12x' AS INTEGER) returns 12. Validate the agreed whole format before conversion."]
].map(([id,prompt,answer])=>({id,prompt,answer,part:'D',points:2}));
export const referenceDDL=`CREATE TABLE departments(id INTEGER PRIMARY KEY,name TEXT NOT NULL CHECK(length(trim(name))>0));
CREATE TABLE accounts(code TEXT PRIMARY KEY NOT NULL CHECK(length(trim(code))>0),description TEXT NOT NULL CHECK(length(trim(description))>0));
CREATE TABLE transactions(
 id INTEGER PRIMARY KEY,
 department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
 account_code TEXT NOT NULL REFERENCES accounts(code) ON DELETE RESTRICT,
 posted_at TEXT NOT NULL CHECK(length(trim(posted_at))>0),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer'),
 source_system TEXT NOT NULL CHECK(length(trim(source_system))>0),
 source_key TEXT NOT NULL CHECK(length(trim(source_key))>0),
 UNIQUE(source_system,source_key)
);`;
export const schemaSeed=`INSERT INTO departments VALUES(10,'Clinical'); INSERT INTO accounts VALUES('6000','Expense'); INSERT INTO transactions VALUES(1,10,'6000','2026-01-01',100,'A','a');`;
export const schemaProbes=[
['Accept a new transaction',true,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',-100,'A','b');"],
['Reject a duplicate source-system/key across imports',false,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',100,'A','a');"],
['Allow the same key from another source',true,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',0,'B','a');"],
['Reject an unknown department',false,"INSERT INTO transactions VALUES(2,99,'6000','2026-01-02',100,'A','b');"],
['Reject an unknown account',false,"INSERT INTO transactions VALUES(2,10,'9999','2026-01-02',100,'A','b');"],
['Reject a missing amount',false,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',NULL,'A','b');"],
['Reject a malformed amount',false,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02','bad','A','b');"],
['Reject a fractional cent',false,"INSERT INTO transactions VALUES(2,10,'6000','2026-01-02',1.5,'A','b');"],
['Preserve a referenced account',false,"DELETE FROM accounts WHERE code='6000';"],
['Preserve a referenced department',false,'DELETE FROM departments WHERE id=10;'],
['Reject a blank department name',false,"INSERT INTO departments VALUES(20,'  ');"],
['Reject a missing department name',false,'INSERT INTO departments VALUES(20,NULL);'],
['Reject a blank account description',false,"INSERT INTO accounts VALUES('7000','  ');"],
['Reject a blank account code',false,"INSERT INTO accounts VALUES(' ','Expense');"],
['Reject a missing account description',false,"INSERT INTO accounts VALUES('7000',NULL);"],
...['department_id','account_code','posted_at','source_system','source_key'].map(col=>['Reject missing '+col,false,`INSERT INTO transactions(id,department_id,account_code,posted_at,amount_cents,source_system,source_key) VALUES(2,${col==='department_id'?'NULL':'10'},${col==='account_code'?'NULL':"'6000'"},${col==='posted_at'?'NULL':"'2026-01-02'"},100,${col==='source_system'?'NULL':"'A'"},${col==='source_key'?'NULL':"'b'"});`]),
...['source_system','source_key','posted_at'].map(col=>['Reject blank '+col,false,`INSERT INTO transactions VALUES(2,10,'6000',${col==='posted_at'?"' '":"'2026-01-02'"},100,${col==='source_system'?"' '":"'A'"},${col==='source_key'?"' '":"'b'"});`])
];
const criterion=(id,part,label,max)=>({id,part,label,max});
export const rubric=[
...['Table grain and keys','Relationships and deletion behavior','Mandatory fields and appropriate types','Correctly scoped uniqueness','Demonstrations and explanation'].map((s,i)=>criterion('a'+i,'A',s,4)),
...queries.flatMap(q=>q.id==='q7'?[criterion('q7a','B','Q7: correlated NOT EXISTS approach',2),criterion('q7b','B','Q7: both business-key fields',3),criterion('q7c','B','Q7: complete output',2)]:q.id==='q8'?[criterion('q8a','B','Q8: normalization and missing classification',2),criterion('q8b','B','Q8: complete format validation',3),criterion('q8c','B','Q8: safe conversion and complete output',2)]:[criterion(q.id+'a','B',q.id.toUpperCase()+': correct approach',2),criterion(q.id+'b','B',q.id.toUpperCase()+': joins, filters or grouping',2),criterion(q.id+'c','B',q.id.toUpperCase()+': output and edge behavior'+(q.id==='q4'?' including explanation':q.id==='q6'?' including data-quality observation':''),2)]),
...[[2,'Date-boundary diagnosis'],[2,'Outer-join diagnosis'],[2,'Half-open filter in ON'],[2,'COUNT(l.id)'],[2,'Evidence and verified result']].map(([n,s],i)=>criterion('d1'+i,'C','D1: '+s,n)),
...[[3,'Repeated-budget diagnosis'],[2,'Missing-department diagnosis'],[3,'Pre-aggregation and outer join'],[2,'Verified result']].map(([n,s],i)=>criterion('d2'+i,'C','D2: '+s,n)),
...explanations.flatMap(e=>[criterion(e.id+'a','D',e.id.toUpperCase()+': correct principle',1),criterion(e.id+'b','D',e.id.toUpperCase()+': accurate example or consequence',1)])
];
export const criticalAreas=['Join preservation','Duplicated totals / aggregation','Business-key scope / integrity','Unsafe conversion'];
export const tasks=[...queries,...diagnostics];
