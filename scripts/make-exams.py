# Generates src/exams/*.json pattern configs (run once; the JSON files are the source of truth afterwards).
import json, copy, os
D = '/workspace/ka/src/exams'
VER = '2026.10'
NOTE = 'Pattern from the latest public official notice we know of (checked Oct 2026). Patterns change: confirm with the official notice before your exam.'
def S(name, type, count, marks, neg=0, style='', **kw):
    d = dict(name=name, type=type, count=count, marks=marks, negative=neg, style=style); d.update(kw); return d
def T(subject, *names):
    return [dict(subject=subject, name=n, weight=max(2, 10 - i)) for i, n in enumerate(names)]
def P(id, name, full, by, group, dur, subjects, sections, topics, src, notes='', diff=(30, 50, 20), traps=(), sectional=None):
    total = round(sum(s['count'] * s['marks'] for s in sections), 2)
    p = dict(schema='ka-exam-profile', schemaVersion=1, id=id, kind='builtin', profileVersion=VER, name=name + '-style', fullName=full, conductedBy=by, group=group,
             coverage=dict(note=NOTE), pattern=dict(durationMin=dur, totalMarks=total, subjects=subjects, sections=sections, notes=notes),
             difficulty=dict(easy=diff[0], medium=diff[1], hard=diff[2], basis='Typical mix; not measured from papers.'),
             topics=topics, traps=list(traps), sources=[dict(kind='official', title=src[0], url=src[1])],
             assumptions=['Questions are AI-generated in the style of this exam, plus anything you import. Not official papers.'])
    if sectional: p['pattern']['sectionalMin'] = sectional
    json.dump(p, open(f'{D}/{id}.json', 'w'), indent=2, ensure_ascii=False); return p

# Existing hand-researched profiles: add the -style label and a group.
for f, g in [('jee-main', 'Engineering'), ('jee-advanced', 'Engineering'), ('neet-ug', 'Medical'), ('gate', 'Engineering'), ('cat', 'Management'), ('upsc-prelims', 'Civil services'), ('cbse-12', 'School boards')]:
    p = json.load(open(f'{D}/{f}.json'))
    if not p['name'].endswith('-style'): p['name'] += '-style'
    p['group'] = g
    json.dump(p, open(f'{D}/{f}.json', 'w'), indent=2, ensure_ascii=False)

P('cuet-ug', 'CUET UG', 'Common University Entrance Test (UG) – one domain subject test', 'National Testing Agency (NTA)', 'University entrance', 60, ['Domain subject'],
  [S('Domain subject – MCQ', 'mcq', 50, 5, 1, 'single correct of 4; all 50 compulsory')],
  T('General Test', 'General knowledge and current affairs', 'Numerical ability', 'Logical and analytical reasoning', 'Quantitative reasoning') + T('Language', 'Reading comprehension', 'Vocabulary', 'Grammar'),
  ('CUET (UG) official website – NTA', 'https://cuet.nta.nic.in/'), 'Each subject test: 50 compulsory questions in 60 minutes; +5 correct, −1 wrong. Pick your own domain subject in the builder topics.')

gate = json.load(open(f'{D}/gate.json'))
GA = T('General Aptitude', 'Verbal ability', 'Quantitative aptitude', 'Analytical aptitude', 'Spatial aptitude')
for code, branch, topics in [
    ('cse', 'Computer Science and IT', T('Computer Science', 'Data structures and algorithms', 'Operating systems', 'Databases', 'Computer networks', 'Theory of computation', 'Compiler design', 'Digital logic', 'Computer organisation and architecture', 'Programming in C') + T('Engineering Mathematics', 'Discrete mathematics', 'Linear algebra', 'Probability')),
    ('ece', 'Electronics and Communication', T('Electronics', 'Networks, signals and systems', 'Electronic devices', 'Analog circuits', 'Digital circuits', 'Control systems', 'Communications', 'Electromagnetics') + T('Engineering Mathematics', 'Linear algebra', 'Calculus', 'Probability')),
    ('ee', 'Electrical Engineering', T('Electrical', 'Electric circuits', 'Electrical machines', 'Power systems', 'Control systems', 'Power electronics', 'Signals and systems', 'Measurements') + T('Engineering Mathematics', 'Linear algebra', 'Calculus', 'Differential equations')),
    ('me', 'Mechanical Engineering', T('Mechanical', 'Engineering mechanics', 'Strength of materials', 'Theory of machines', 'Thermodynamics', 'Fluid mechanics', 'Heat transfer', 'Manufacturing', 'Industrial engineering') + T('Engineering Mathematics', 'Linear algebra', 'Calculus', 'Numerical methods')),
    ('ce', 'Civil Engineering', T('Civil', 'Structural analysis', 'Geotechnical engineering', 'Fluid mechanics and hydraulics', 'Environmental engineering', 'Transportation engineering', 'Surveying', 'RCC and steel design') + T('Engineering Mathematics', 'Linear algebra', 'Calculus', 'Probability')),
    ('da', 'Data Science and AI', T('Data Science and AI', 'Probability and statistics', 'Linear algebra', 'Calculus and optimisation', 'Programming, data structures and algorithms', 'Database management and warehousing', 'Machine learning', 'Artificial intelligence')),
]:
    p = copy.deepcopy(gate); p.update(id=f'gate-{code}', name=f'GATE {code.upper()}-style', fullName=f'Graduate Aptitude Test in Engineering – {branch}', group='Engineering', topics=GA + topics)
    p.pop('topicsBasis', None); p['assumptions'] = ['Same section pattern as every GATE paper; topics are the published syllabus areas for this branch.']
    json.dump(p, open(f'{D}/gate-{code}.json', 'w'), indent=2, ensure_ascii=False)

P('upsc-csat', 'UPSC Prelims CSAT', 'UPSC Civil Services Preliminary – General Studies Paper II (CSAT)', 'Union Public Service Commission', 'Civil services', 120, ['Comprehension', 'Reasoning', 'Basic numeracy'],
  [S('CSAT – MCQ', 'mcq', 80, 2.5, 0.83, 'single correct of 4; one-third negative')],
  T('CSAT', 'Reading comprehension', 'Interpersonal and communication skills', 'Logical reasoning and analytical ability', 'Decision making and problem solving', 'General mental ability', 'Basic numeracy (Class X level)', 'Data interpretation'),
  ('UPSC – active examinations (CSE notice and scheme)', 'https://upsc.gov.in/examinations/active-exams'), 'Qualifying paper: 33% needed. 80 questions × 2.5 marks; one-third negative marking.', traps=['Qualifying only — but failing it voids your GS score.'])

def four(sub):  # SSC style 4×25
    return [S(n, 'mcq', 25, 2, 0.5, 'single correct of 4') for n in sub]
SSC = ['General Intelligence and Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension']
SSCT = T('Reasoning', 'Analogy and classification', 'Coding–decoding', 'Series', 'Puzzles and seating') + T('Quant', 'Percentages and ratio', 'Profit and loss', 'Algebra', 'Geometry and mensuration', 'Trigonometry', 'Data interpretation') + T('English', 'Reading comprehension', 'Error spotting', 'Synonyms and antonyms', 'Idioms', 'Cloze test') + T('General Awareness', 'History', 'Polity', 'Geography', 'Economy', 'General science', 'Current affairs')
P('ssc-cgl', 'SSC CGL Tier 1', 'Staff Selection Commission Combined Graduate Level – Tier I', 'Staff Selection Commission', 'Government jobs', 60, SSC, four(SSC), SSCT, ('Staff Selection Commission', 'https://ssc.gov.in/'), '100 questions, 200 marks, 60 minutes; −0.5 per wrong answer.')
P('ssc-chsl', 'SSC CHSL Tier 1', 'Staff Selection Commission Combined Higher Secondary Level – Tier I', 'Staff Selection Commission', 'Government jobs', 60, SSC, four(['English Language', 'General Intelligence', 'Quantitative Aptitude (Basic Arithmetic)', 'General Awareness']), SSCT, ('Staff Selection Commission', 'https://ssc.gov.in/'), '100 questions, 200 marks, 60 minutes; −0.5 per wrong answer.')

BANKT = T('Reasoning', 'Puzzles and seating arrangement', 'Syllogism', 'Inequality', 'Blood relations', 'Coding–decoding', 'Direction sense') + T('Quant', 'Simplification and approximation', 'Number series', 'Data interpretation', 'Quadratic equations', 'Arithmetic word problems') + T('English', 'Reading comprehension', 'Cloze test', 'Error detection', 'Para jumbles', 'Fillers')
def bank(id, name, full, by, url, quant='Quantitative Aptitude'):
    P(id, name, full, by, 'Banking', 60, ['English Language', quant, 'Reasoning Ability'],
      [S('English Language', 'mcq', 30, 1, 0.25, '20-minute sectional timer'), S(quant, 'mcq', 35, 1, 0.25, '20-minute sectional timer'), S('Reasoning Ability', 'mcq', 35, 1, 0.25, '20-minute sectional timer')],
      BANKT, (by + ' – careers', url), 'Preliminary exam: 100 questions, 100 marks, 60 minutes with 20-minute sectional timing; −0.25 per wrong answer.', sectional=[20, 20, 20])
bank('ibps-po', 'IBPS PO Prelims', 'IBPS Probationary Officer – Preliminary', 'Institute of Banking Personnel Selection', 'https://www.ibps.in/')
bank('sbi-po', 'SBI PO Prelims', 'SBI Probationary Officer – Preliminary', 'State Bank of India', 'https://sbi.co.in/web/careers')
bank('ibps-clerk', 'IBPS Clerk Prelims', 'IBPS Clerk – Preliminary', 'Institute of Banking Personnel Selection', 'https://www.ibps.in/', 'Numerical Ability')
bank('sbi-clerk', 'SBI Clerk Prelims', 'SBI Junior Associate (Clerk) – Preliminary', 'State Bank of India', 'https://sbi.co.in/web/careers', 'Numerical Ability')

P('rrb-ntpc', 'RRB NTPC CBT 1', 'Railway Recruitment Boards – Non-Technical Popular Categories, first-stage CBT', 'Railway Recruitment Boards', 'Government jobs', 90, ['General Awareness', 'Mathematics', 'General Intelligence and Reasoning'],
  [S('General Awareness', 'mcq', 40, 1, 0.33), S('Mathematics', 'mcq', 30, 1, 0.33), S('General Intelligence and Reasoning', 'mcq', 30, 1, 0.33)],
  T('General Awareness', 'Current affairs', 'Indian history and culture', 'Geography', 'Polity', 'General science', 'Railways and economy') + T('Mathematics', 'Number system', 'Percentages, ratio and averages', 'Time and work', 'Mensuration', 'Simple and compound interest') + T('Reasoning', 'Analogies', 'Series', 'Coding–decoding', 'Venn diagrams', 'Puzzles'),
  ('Indian Railways – recruitment', 'https://indianrailways.gov.in/'), '100 questions in 90 minutes; −1/3 per wrong answer.')

P('nda-maths', 'NDA Mathematics', 'National Defence Academy & Naval Academy – Paper I (Mathematics)', 'Union Public Service Commission', 'Defence', 150, ['Mathematics'],
  [S('Mathematics – MCQ', 'mcq', 120, 2.5, 0.83, 'single correct of 4; one-third negative')],
  T('Mathematics', 'Algebra', 'Matrices and determinants', 'Trigonometry', 'Analytical geometry (2D and 3D)', 'Differential calculus', 'Integral calculus and differential equations', 'Vectors', 'Statistics and probability'),
  ('UPSC – active examinations (NDA & NA notice)', 'https://upsc.gov.in/examinations/active-exams'), '120 questions × 2.5 marks = 300, 150 minutes.')
P('nda-gat', 'NDA General Ability', 'National Defence Academy & Naval Academy – Paper II (General Ability Test)', 'Union Public Service Commission', 'Defence', 150, ['English', 'General Knowledge'],
  [S('Part A – English', 'mcq', 50, 4, 1.33), S('Part B – General Knowledge', 'mcq', 100, 4, 1.33)],
  T('English', 'Grammar and usage', 'Vocabulary', 'Comprehension') + T('General Knowledge', 'Physics', 'Chemistry', 'General science', 'History and freedom movement', 'Geography', 'Current events'),
  ('UPSC – active examinations (NDA & NA notice)', 'https://upsc.gov.in/examinations/active-exams'), '150 questions × 4 marks = 600, 150 minutes; one-third negative.')

P('clat-ug', 'CLAT UG', 'Common Law Admission Test (UG)', 'Consortium of National Law Universities', 'Law', 120, ['English', 'Current Affairs and GK', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'],
  [S('English Language', 'mcq', 24, 1, 0.25, 'passage based'), S('Current Affairs incl. GK', 'mcq', 28, 1, 0.25, 'passage based'), S('Legal Reasoning', 'mcq', 32, 1, 0.25, 'passage based; principle → facts'), S('Logical Reasoning', 'mcq', 24, 1, 0.25, 'passage based'), S('Quantitative Techniques', 'mcq', 12, 1, 0.25, 'data sets and graphs')],
  T('Legal Reasoning', 'Law of torts', 'Contract law', 'Criminal law', 'Constitutional law', 'Legal principles applied to facts') + T('Logical Reasoning', 'Arguments, premises and conclusions', 'Inferences', 'Analogies') + T('English', 'Passage comprehension', 'Vocabulary in context'),
  ('Consortium of NLUs – CLAT', 'https://consortiumofnlus.ac.in/'), '120 passage-based questions, 120 minutes; −0.25 per wrong answer. Section split is approximate.', traps=['Apply only the principle given in the passage, not real-world law.'])

P('bitsat', 'BITSAT', 'BITS Admission Test', 'BITS Pilani', 'Engineering', 180, ['Physics', 'Chemistry', 'English Proficiency', 'Logical Reasoning', 'Mathematics'],
  [S('Physics', 'mcq', 30, 3, 1), S('Chemistry', 'mcq', 30, 3, 1), S('English Proficiency', 'mcq', 10, 3, 1), S('Logical Reasoning', 'mcq', 20, 3, 1), S('Mathematics', 'mcq', 40, 3, 1)],
  T('Physics', 'Mechanics', 'Electromagnetism', 'Optics', 'Modern physics', 'Thermodynamics') + T('Chemistry', 'Physical chemistry', 'Organic chemistry', 'Inorganic chemistry') + T('Mathematics', 'Calculus', 'Algebra', 'Coordinate geometry', 'Vectors and 3D', 'Probability'),
  ('BITS admissions', 'https://www.bitsadmission.com/'), '130 questions, 390 marks, 180 minutes; +3/−1. Finish all 130 early to unlock 12 bonus questions (not modelled here).', diff=(35, 50, 15), traps=['Speed matters: about 80 seconds per question.'])

P('neet-pg', 'NEET PG', 'National Eligibility cum Entrance Test (Postgraduate)', 'National Board of Examinations in Medical Sciences', 'Medical', 210, ['Pre-clinical', 'Para-clinical', 'Clinical'],
  [S('Single best answer – MCQ', 'mcq', 200, 4, 1, 'clinical vignettes and one-liners; single correct of 4')],
  T('Pre-clinical', 'Anatomy', 'Physiology', 'Biochemistry') + T('Para-clinical', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic medicine', 'Community medicine') + T('Clinical', 'General medicine', 'General surgery', 'Obstetrics and gynaecology', 'Paediatrics', 'Ophthalmology', 'ENT', 'Orthopaedics', 'Dermatology', 'Psychiatry', 'Anaesthesia', 'Radiology'),
  ('National Board of Examinations in Medical Sciences', 'https://natboard.edu.in/'), '200 MCQs, 210 minutes in timed sections; +4/−1.')

P('sat', 'SAT', 'SAT (digital) – generic practice in the style of', 'College Board', 'International', 134, ['Reading and Writing', 'Math'],
  [S('Reading and Writing', 'mcq', 54, 1, 0, 'short passages, one question each'), S('Math – multiple choice', 'mcq', 33, 1, 0), S('Math – student-produced response', 'numerical', 11, 1, 0, answerFormat='decimal')],
  T('Reading and Writing', 'Craft and structure', 'Information and ideas', 'Standard English conventions', 'Expression of ideas') + T('Math', 'Algebra', 'Advanced math', 'Problem solving and data analysis', 'Geometry and trigonometry'),
  ('College Board – SAT Suite', 'https://satsuite.collegeboard.org/'), 'Real SAT scores 400–1600 with adaptive modules; here every question is 1 mark, no negative marking.')
P('gre', 'GRE', 'GRE General Test – generic practice in the style of', 'ETS', 'International', 118, ['Analytical Writing', 'Verbal Reasoning', 'Quantitative Reasoning'],
  [S('Analytical Writing – Analyse an Issue', 'written', 1, 6, 0, 'essay scored 0–6'), S('Verbal Reasoning', 'mcq', 27, 1, 0, 'text completion, sentence equivalence, reading'), S('Quantitative Reasoning – MCQ', 'mcq', 21, 1, 0, 'includes quantitative comparison'), S('Quantitative Reasoning – numeric entry', 'numerical', 6, 1, 0, answerFormat='decimal')],
  T('Verbal', 'Text completion', 'Sentence equivalence', 'Reading comprehension') + T('Quant', 'Arithmetic', 'Algebra', 'Geometry', 'Data analysis'),
  ('ETS – GRE General Test', 'https://www.ets.org/gre.html'), 'Real GRE scores 130–170 per section; here 1 mark each plus a 6-point essay.')
P('gmat', 'GMAT', 'GMAT Focus Edition – generic practice in the style of', 'GMAC', 'International', 135, ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'],
  [S('Quantitative Reasoning', 'mcq', 21, 1, 0), S('Verbal Reasoning', 'mcq', 23, 1, 0, 'critical reasoning and reading'), S('Data Insights', 'mcq', 20, 1, 0, 'data sufficiency, table and graphics analysis')],
  T('Quant', 'Arithmetic', 'Algebra', 'Word problems') + T('Verbal', 'Critical reasoning', 'Reading comprehension') + T('Data Insights', 'Data sufficiency', 'Multi-source reasoning', 'Table analysis', 'Graphics interpretation'),
  ('GMAC – GMAT exam', 'https://www.mba.com/'), 'Real GMAT is adaptive and scored 205–805; here 1 mark each, 45 minutes per section.')
P('ielts', 'IELTS Academic (Reading + Writing)', 'IELTS Academic Reading and Writing – generic practice in the style of', 'IELTS partners', 'International', 120, ['Reading', 'Writing'],
  [S('Reading – 3 passages', 'mcq', 40, 1, 0, 'true/false/not given, matching, completion as choices'), S('Writing Task 1 – describe a visual', 'written', 1, 9, 0, 'at least 150 words; band 0–9'), S('Writing Task 2 – essay', 'written', 1, 9, 0, 'at least 250 words; band 0–9')],
  T('Reading', 'Skimming and scanning', 'True / False / Not Given', 'Matching headings', 'Sentence completion') + T('Writing', 'Describing charts and processes', 'Opinion and discussion essays', 'Coherence and cohesion', 'Lexical resource', 'Grammatical range'),
  ('IELTS official site', 'https://ielts.org/'), 'Reading 60 min + Writing 60 min. Listening and Speaking are not modelled. Real results are bands 0–9.')
print(len(os.listdir(D)), 'profiles')
