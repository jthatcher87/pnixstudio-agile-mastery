export const referenceDDL=`CREATE TABLE classes (
  class_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0)
);
CREATE TABLE voters (
  voter_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0)
);
CREATE TABLE elections (
  election_id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(class_id),
  title TEXT NOT NULL CHECK(length(trim(title)) > 0)
);
CREATE TABLE eligibility (
  election_id INTEGER NOT NULL REFERENCES elections(election_id),
  voter_id INTEGER NOT NULL REFERENCES voters(voter_id),
  PRIMARY KEY (election_id, voter_id)
);
CREATE TABLE candidates (
  election_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  voter_id INTEGER NOT NULL,
  PRIMARY KEY (election_id, candidate_id),
  UNIQUE (election_id, voter_id),
  FOREIGN KEY (election_id, voter_id)
    REFERENCES eligibility(election_id, voter_id)
);
CREATE TABLE votes (
  election_id INTEGER NOT NULL,
  voter_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  PRIMARY KEY (election_id, voter_id),
  FOREIGN KEY (election_id, voter_id)
    REFERENCES eligibility(election_id, voter_id),
  FOREIGN KEY (election_id, candidate_id)
    REFERENCES candidates(election_id, candidate_id)
);`;
export const seed=`INSERT INTO classes(class_id,name) VALUES(10,'Class A'),(20,'Class B'),(30,'Class C');
INSERT INTO voters(voter_id,name) VALUES(1,'Avery'),(2,'Blair'),(3,'Casey'),(4,'Drew'),(5,'Evan'),(6,'Finley'),(7,'Gray'),(8,'Harper'),(9,'Iris'),(10,'Jules');
INSERT INTO elections(election_id,class_id,title) VALUES(100,10,'Autumn president'),(101,10,'Spring president'),(200,20,'Autumn president'),(300,30,'Autumn president');
INSERT INTO eligibility(election_id,voter_id) VALUES(100,1),(100,2),(100,3),(100,4),(100,5),(101,1),(101,2),(101,3),(101,4),(101,5),(200,6),(200,7),(200,8),(300,9),(300,10);
INSERT INTO candidates(election_id,candidate_id,voter_id) VALUES(100,1,1),(100,2,2),(100,3,3),(101,1,2),(101,2,3),(200,1,6),(200,2,7),(200,7,8),(300,1,9);
INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,1,1),(100,2,1),(100,3,2),(101,1,2),(200,6,1),(200,7,2);`;
export const queryTables=`CREATE TABLE practice_scores(id INTEGER PRIMARY KEY,election_id INTEGER,points INTEGER);
INSERT INTO practice_scores VALUES(1,100,10),(2,100,20),(3,100,NULL),(4,200,0),(5,200,NULL),(6,300,5);
CREATE TABLE raw_vote_import(id INTEGER PRIMARY KEY,raw_voter_id TEXT,raw_points TEXT);
INSERT INTO raw_vote_import VALUES(1,'1','10'),(2,'2',''),(3,'3',NULL),(4,'4','12x'),(5,'5',' 007 '),(6,'bad','0'),(7,'6','-3'),(8,'7','votes: 18'),(9,'8','votes: 12x'),(10,'9','abc42');`;
export const extra=`INSERT INTO voters(voter_id,name) VALUES(11,'Kai');
INSERT INTO eligibility(election_id,voter_id) VALUES(100,11);
INSERT INTO candidates(election_id,candidate_id,voter_id) VALUES(100,4,4);
INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,4,2);
INSERT INTO elections(election_id,class_id,title) VALUES(400,30,'Special election');
INSERT INTO practice_scores VALUES(7,100,30),(8,200,NULL);
INSERT INTO raw_vote_import VALUES(11,'10','  '),(12,'11','votes: 000025'),(13,'12','1000000'),(14,'13','votes: ');`;
export const schemaText=`classes(class_id INTEGER PRIMARY KEY, name TEXT)
voters(voter_id INTEGER PRIMARY KEY, name TEXT)
elections(election_id INTEGER PRIMARY KEY, class_id INTEGER, title TEXT)
eligibility(election_id INTEGER, voter_id INTEGER)
  composite primary key: election_id + voter_id
candidates(election_id INTEGER, candidate_id INTEGER, voter_id INTEGER)
  composite primary key: election_id + candidate_id
  unique: election_id + voter_id
votes(election_id INTEGER, voter_id INTEGER, candidate_id INTEGER)
  composite primary key: election_id + voter_id

eligibility references elections and voters.
candidates(election_id,voter_id) references eligibility.
votes(election_id,voter_id) references eligibility.
votes(election_id,candidate_id) references candidates.

election 100: Class A autumn · election 101: Class A spring
election 200: Class B autumn · election 300: Class C autumn
Eligibility is the authoritative, pre-approved election roster.
Candidate IDs are scoped to an election. Self-voting is allowed.
A voter may vote once in each election for which they are eligible.

Additional query-practice tables (not part of your DDL lab):
practice_scores(id INTEGER, election_id INTEGER, points INTEGER NULL)
raw_vote_import(id INTEGER, raw_voter_id TEXT, raw_points TEXT)
Points are practice data, not vote weights: each ballot counts once.
Inspect any table with SELECT * FROM table_name;`;
export const ddlStarter=`-- Build the six election tables using CREATE statements only.
-- Use the exact table/column names in the contract.
-- Decide primary keys, NOT NULL, UNIQUE, CHECK and composite FKs.
-- Foreign-key enforcement is enabled by the runner.

CREATE TABLE classes (
  class_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- Add voters, elections, eligibility, candidates and votes.
`;
export const contract={classes:['class_id','name'],voters:['voter_id','name'],elections:['election_id','class_id','title'],eligibility:['election_id','voter_id'],candidates:['election_id','candidate_id','voter_id'],votes:['election_id','voter_id','candidate_id']};
export const fkContract={elections:[['classes',['class_id:class_id']]],eligibility:[['elections',['election_id:election_id']],['voters',['voter_id:voter_id']]],candidates:[['eligibility',['election_id:election_id','voter_id:voter_id']]],votes:[['eligibility',['election_id:election_id','voter_id:voter_id']],['candidates',['election_id:election_id','candidate_id:candidate_id']]]};
export const probes=[
['Allow a first vote by an eligible voter',true,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,4,1);'],
['Allow the same voter to vote in another eligible election',true,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(101,2,1);'],
['Allow candidate IDs to be reused in different elections',true,'INSERT INTO candidates(election_id,candidate_id,voter_id) VALUES(300,2,10);'],
['Reject a second vote in the same election',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,1,2);'],
['Reject an ineligible voter',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,8,1);'],
['Reject a candidate that exists only in a different election',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,4,7);'],
['Reject an unknown candidate',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,4,999);'],
['Reject NULL election_id in a ballot',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(NULL,4,1);'],
['Reject NULL voter_id in a ballot',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,NULL,1);'],
['Reject NULL candidate_id in a ballot',false,'INSERT INTO votes(election_id,voter_id,candidate_id) VALUES(100,4,NULL);'],
['Reject a candidate who is not eligible in that election',false,'INSERT INTO candidates(election_id,candidate_id,voter_id) VALUES(100,9,8);'],
['Reject the same person nominated twice in one election',false,'INSERT INTO candidates(election_id,candidate_id,voter_id) VALUES(100,9,1);'],
['Reject eligibility for an unknown voter',false,'INSERT INTO eligibility(election_id,voter_id) VALUES(100,999);'],
['Reject eligibility for an unknown election',false,'INSERT INTO eligibility(election_id,voter_id) VALUES(999,4);'],
['Reject an election for an unknown class',false,"INSERT INTO elections(election_id,class_id,title) VALUES(999,99,'Invalid class');"],
['Reject duplicate eligibility',false,'INSERT INTO eligibility(election_id,voter_id) VALUES(100,1);'],
['Reject a duplicate class key',false,"INSERT INTO classes(class_id,name) VALUES(10,'Duplicate');"],
['Reject a duplicate voter key',false,"INSERT INTO voters(voter_id,name) VALUES(1,'Duplicate');"],
['Reject a NULL voter name',false,'INSERT INTO voters(voter_id,name) VALUES(99,NULL);'],
['Reject a blank voter name',false,"INSERT INTO voters(voter_id,name) VALUES(99,'   ');"],
['Reject a blank class name',false,"INSERT INTO classes(class_id,name) VALUES(99,'   ');"],
['Reject a blank election title',false,"INSERT INTO elections(election_id,class_id,title) VALUES(999,10,'   ');"],
['Preserve referenced eligibility when deletion is attempted',false,'DELETE FROM eligibility WHERE election_id=100 AND voter_id=1;']
];
const q=(id,title,topic,prompt,starter,answer,explanation)=>({id,title,topic,prompt,starter,answer,explanation,kind:'query',ordered:false});
export const tasks=[
q('roster','Build the candidate roster','INNER JOIN','For election 100, return election_id, candidate_id and voter name AS candidate. Use the candidate-to-voter relationship. Row order does not matter.','SELECT c.election_id, c.candidate_id, v.name AS candidate\nFROM candidates c\nJOIN voters v ON ;',"SELECT c.election_id,c.candidate_id,v.name AS candidate FROM candidates c JOIN voters v ON v.voter_id=c.voter_id WHERE c.election_id=100;",'INNER JOIN returns candidates with a matching voter. The foreign key and roster rules define which rows should exist.'),
q('zero','Keep candidates with no votes','LEFT JOIN / COUNT','For every candidate in election 100, return candidate_id and COUNT(v.voter_id) AS vote_count, including zero-vote candidates. Row order does not matter.','SELECT c.candidate_id, COUNT(v.voter_id) AS vote_count\nFROM candidates c\nLEFT JOIN votes v ON v.candidate_id=c.candidate_id\nWHERE c.election_id=100\nGROUP BY c.candidate_id;',"SELECT c.candidate_id,COUNT(v.voter_id) AS vote_count FROM candidates c LEFT JOIN votes v ON v.election_id=c.election_id AND v.candidate_id=c.candidate_id WHERE c.election_id=100 GROUP BY c.candidate_id;",'Join on election_id AND candidate_id. Candidate IDs repeat across elections. COUNT(v.voter_id) skips the NULL placeholder row; COUNT(*) would count it.'),
q('placement','Put the filter in the right place','ON versus WHERE','Return every election_id and COUNT(v.voter_id) AS candidate_one_votes for votes cast for candidate_id 1 only. Include elections with zero such votes. Row order does not matter.','SELECT e.election_id, COUNT(v.voter_id) AS candidate_one_votes\nFROM elections e\nLEFT JOIN votes v ON v.election_id=e.election_id\nWHERE v.candidate_id=1\nGROUP BY e.election_id;',"SELECT e.election_id,COUNT(v.voter_id) AS candidate_one_votes FROM elections e LEFT JOIN votes v ON v.election_id=e.election_id AND v.candidate_id=1 GROUP BY e.election_id;",'A right-side condition in WHERE removes unmatched rows. Put the candidate condition in ON to preserve every election.'),
q('having','Filter election summaries','GROUP BY / HAVING','Return election_id and COUNT(*) AS ballots_cast for elections with at least two ballots. Row order does not matter.','SELECT election_id, COUNT(*) AS ballots_cast\nFROM votes\nGROUP BY election_id;',"SELECT election_id,COUNT(*) AS ballots_cast FROM votes GROUP BY election_id HAVING COUNT(*)>=2;",'WHERE filters input rows; HAVING filters grouped counts. Group all selected non-aggregate expressions for portable SQL.'),
q('aggregates','Explain NULL-aware aggregates','SUM / AVG / COUNT','From practice_scores, return election_id, COUNT(*) AS rows_seen, COUNT(points) AS scored_rows, SUM(points) AS total_points, AVG(points) AS average_points for each election. Row order does not matter.','SELECT election_id, COUNT(*) AS rows_seen\nFROM practice_scores\nGROUP BY election_id;',"SELECT election_id,COUNT(*) AS rows_seen,COUNT(points) AS scored_rows,SUM(points) AS total_points,AVG(points) AS average_points FROM practice_scores GROUP BY election_id;",'COUNT(*) counts all rows. COUNT(points), SUM(points), and AVG(points) ignore NULL points. Zero is a real observed value, not missing data.'),
q('turnout','Calculate turnout without multiplying rows','Pre-aggregation','Return every election_id, eligible_voters, ballots_cast and turnout_pct. Count eligibility and ballots independently; turnout_pct = ballots / eligible * 100 rounded to 2 decimals, or NULL when eligible count is zero. Row order does not matter.','WITH eligible AS (\n  SELECT election_id, COUNT(*) AS eligible_voters\n  FROM eligibility GROUP BY election_id\n)\n-- Aggregate votes separately, then join to elections.\nSELECT * FROM eligible;',"WITH r AS (SELECT election_id,COUNT(*) AS eligible_voters FROM eligibility GROUP BY election_id), b AS (SELECT election_id,COUNT(*) AS ballots_cast FROM votes GROUP BY election_id) SELECT e.election_id,COALESCE(r.eligible_voters,0) AS eligible_voters,COALESCE(b.ballots_cast,0) AS ballots_cast,ROUND(100.0*COALESCE(b.ballots_cast,0)/NULLIF(COALESCE(r.eligible_voters,0),0),2) AS turnout_pct FROM elections e LEFT JOIN r ON r.election_id=e.election_id LEFT JOIN b ON b.election_id=e.election_id;",'Joining two detail sets directly can multiply counts. Aggregate each to one row per election first, preserve empty elections, and protect zero denominators.'),
q('ties','Return all tied leaders','CTEs / subqueries','Return election_id, candidate_id and vote_count for each candidate tied for the highest positive vote count in their election. Do not declare a winner when an election has zero ballots. Row order does not matter.','WITH tally AS (\n  SELECT c.election_id,c.candidate_id,COUNT(v.voter_id) AS vote_count\n  FROM candidates c LEFT JOIN votes v\n    ON v.election_id=c.election_id AND v.candidate_id=c.candidate_id\n  GROUP BY c.election_id,c.candidate_id\n)\nSELECT * FROM tally;',"WITH tally AS (SELECT c.election_id,c.candidate_id,COUNT(v.voter_id) AS vote_count FROM candidates c LEFT JOIN votes v ON v.election_id=c.election_id AND v.candidate_id=c.candidate_id GROUP BY c.election_id,c.candidate_id) SELECT t.election_id,t.candidate_id,t.vote_count FROM tally t WHERE t.vote_count>0 AND t.vote_count=(SELECT MAX(x.vote_count) FROM tally x WHERE x.election_id=t.election_id);",'TOP 1 or LIMIT 1 without a tie policy silently drops tied candidates. The task returns tied leaders; the election’s tie-resolution policy is a separate requirement.'),
q('nonvoters','Find eligible people who have not voted','NOT EXISTS','For election 100, return voter_id and name for eligible voters with no ballot in that election. Row order does not matter.','SELECT v.voter_id,v.name\nFROM eligibility e JOIN voters v ON v.voter_id=e.voter_id\nWHERE e.election_id=100;',"SELECT v.voter_id,v.name FROM eligibility e JOIN voters v ON v.voter_id=e.voter_id WHERE e.election_id=100 AND NOT EXISTS(SELECT 1 FROM votes b WHERE b.election_id=e.election_id AND b.voter_id=e.voter_id);",'Correlate both election and voter. NOT EXISTS avoids the NULL-related traps of NOT IN on a nullable subquery.'),
q('blanks','Separate missing from invalid values','NULL / blank strings','From raw_vote_import, return id and raw_points where raw_points is NULL, empty, or spaces only. Do not include nonblank malformed text. Row order does not matter.','SELECT id,raw_points FROM raw_vote_import\nWHERE raw_points = NULL;',"SELECT id,raw_points FROM raw_vote_import WHERE NULLIF(TRIM(raw_points),'') IS NULL;",'IS NULL tests missing values. NULLIF(TRIM(value),\'\') normalizes empty or space-only strings to NULL. The lab treats spaces as whitespace; other whitespace requires an explicit rule.'),
q('conversion','Parse only the agreed numeric format','Cleaning / safe conversion','Return id and normalized_points for every raw_vote_import row. Trim spaces; optionally remove one leading lowercase votes: prefix and trim again. Accept only 1–6 ASCII digits; otherwise return NULL. Cast accepted text to INTEGER (keep zero). Do not pull arbitrary digits from unrelated text. Row order does not matter.','WITH cleaned AS (\n  SELECT id,TRIM(raw_points) AS value FROM raw_vote_import\n)\nSELECT id,value FROM cleaned;',"WITH a AS (SELECT id,TRIM(raw_points) AS value FROM raw_vote_import), b AS (SELECT id,CASE WHEN SUBSTR(value,1,6)='votes:' THEN TRIM(SUBSTR(value,7)) ELSE value END AS value FROM a) SELECT id,CASE WHEN LENGTH(value) BETWEEN 1 AND 6 AND value NOT GLOB '*[^0-9]*' THEN CAST(value AS INTEGER) ELSE NULL END AS normalized_points FROM b;",'SQLite CAST can accept a numeric prefix or turn invalid text into zero. Validate the agreed format before conversion. Arbitrary digit stripping can change meaning; reject unrecognized formats for review.')
];
export const order=['FROM / ON / JOIN','WHERE','GROUP BY','HAVING','SELECT','DISTINCT','ORDER BY','LIMIT'];
export const schemaRubric=['Clarify the election scope, roster source, candidate eligibility, self-voting, repeat elections, ties and ballot privacy before choosing keys.','Use primary keys for identity, composite keys for election-scoped relationships, NOT NULL for mandatory fields and UNIQUE constraints for election-scoped rules.','Enforce one ballot per (election_id, voter_id) in the database; a preliminary SELECT check alone is unsafe under concurrent requests.','Reference candidate and voter eligibility within the same election. Explain why a foreign key on candidate_id alone is insufficient when candidate IDs repeat.','Demonstrate a valid first vote, a legal vote in a different election, and rejected duplicate, ineligible, cross-election and NULL ballots.','Explain that uniqueness prevents duplicate stored ballots under these assumptions, not impersonation or every form of fraud. Authentication, verified roster provisioning, deadlines, auditability and secret-ballot design need additional controls.'];
export const mockPrompts=[
['Design aloud','Explain your six tables and their relationships before showing DDL. What assumptions would you ask the interviewer to confirm?'],
['Defend the voting rule','Why is UNIQUE(voter_id) wrong for repeat elections? Why is an application-level check before INSERT insufficient?'],
['Demonstrate the constraints','Show one legal first vote, one rejected second vote in the same election and one legal vote by that person in another eligible election.'],
['Reason about outer joins','Why does putting a candidate condition in WHERE remove some rows from a LEFT JOIN? Explain with a zero-vote election.'],
['Explain aggregates','Describe COUNT(*), COUNT(column), SUM and AVG with NULL and zero. When do you use HAVING rather than WHERE?'],
['Diagnose dirty data','What would you do with NULL, blanks, 12x, votes: 18 and an out-of-range numeric string? Explain validation and SQL dialect differences.'],
['Discuss limits','How would you handle ties, election deadlines, roster changes and secret ballots? Distinguish the lab’s implemented rules from requirements needing a different design.']
];
