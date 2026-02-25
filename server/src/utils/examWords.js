/**
 * 扩展考试词表（可持续扩展）
 * 说明：
 * - 这些词作为 CET-6 之上的补充词，用于区分 TEM/TOEFL/IELTS/剑桥通用英语目标等级。
 * - 若后续拿到更完整官方词表，可直接在此文件扩充或替换。
 */

function toWordSet(words) {
  return new Set(
    (Array.isArray(words) ? words : [])
      .map((w) => String(w || '').toLowerCase().trim())
      .filter(Boolean)
  );
}

const TEM4_CORE_WORDS = toWordSet([
  'accumulate', 'adaptability', 'adjacent', 'adverse', 'advocacy', 'align', 'arbitrary', 'assumption',
  'authentic', 'automate', 'bias', 'coherent', 'coincide', 'complement', 'comprise', 'conceive',
  'confer', 'configure', 'consensus', 'consecutive', 'constrain', 'contemporary', 'convey', 'criterion',
  'crucial', 'cumulative', 'deduce', 'deficiency', 'dilemma', 'discrete', 'diverse', 'domestic',
  'dynamic', 'eliminate', 'empirical', 'equate', 'equilibrium', 'explicit', 'fluctuate', 'framework',
  'fundamental', 'hierarchy', 'hypothesis', 'implement', 'implication', 'incentive', 'incidence', 'indicator',
  'inevitable', 'infrastructure', 'inhibit', 'innovative', 'integrate', 'intermediate', 'interval', 'intrinsic',
  'invoke', 'isolate', 'justify', 'legitimate', 'manipulate', 'marginal', 'mediate', 'methodology',
  'minimize', 'modify', 'monitor', 'objective', 'offset', 'paradigm', 'parameter', 'persistent',
  'precedent', 'preliminary', 'presume', 'protocol', 'rationale', 'reinforce', 'regulate', 'respective',
  'restrain', 'rigid', 'simulate', 'sustain', 'theoretical', 'transform', 'trigger', 'ultimate',
  'underlying', 'utilize', 'validate', 'variation', 'viable',
]);

// 依据《普通高中英语课程标准（2017年版2020年修订）》词汇要求整理的全国卷核心词。
// 该词集用于“高考英语全国卷”目标等级的超纲判断（作为高频核心层）。
const GAOKAO_NATIONAL_CORE_WORDS = toWordSet([
  'ability', 'able', 'abroad', 'absence', 'absent', 'absorb', 'abstract', 'abundant', 'abuse', 'academic',
  'accent', 'accept', 'access', 'accommodate', 'accompany', 'accomplish', 'account', 'accurate', 'achieve', 'acknowledge',
  'acquire', 'adapt', 'addition', 'adequate', 'adjust', 'admire', 'admission', 'adopt', 'advance', 'advantage',
  'adventure', 'advertise', 'advice', 'affair', 'affect', 'afford', 'agency', 'agriculture', 'ahead', 'aid',
  'aim', 'aircraft', 'airline', 'alarm', 'album', 'allowance', 'alternative', 'amaze', 'ambition', 'among',
  'amount', 'analysis', 'ancient', 'anniversary', 'announce', 'annual', 'anxiety', 'anxious', 'apologize', 'apparent',
  'appeal', 'appearance', 'appetite', 'application', 'appointment', 'appreciate', 'approach', 'appropriate', 'approval', 'approve',
  'architecture', 'argument', 'arrange', 'arrival', 'article', 'artificial', 'aspect', 'assess', 'assignment', 'assist',
  'associate', 'assume', 'assumption', 'assure', 'athlete', 'atmosphere', 'attach', 'attempt', 'attend', 'attention',
  'attitude', 'attract', 'audience', 'authority', 'available', 'average', 'avoid', 'awareness', 'background', 'balance',
  'barrier', 'baseball', 'basis', 'battery', 'behave', 'behavior', 'belief', 'benefit', 'beyond', 'biology',
  'blame', 'board', 'boast', 'bond', 'boundary', 'branch', 'brief', 'broadcast', 'budget', 'burden',
  'campaign', 'candidate', 'capacity', 'capture', 'career', 'category', 'celebration', 'challenge', 'champion', 'characteristic',
  'charity', 'chemical', 'climate', 'clue', 'coach', 'coast', 'coincidence', 'collapse', 'colleague', 'collective',
  'comfort', 'command', 'comment', 'commercial', 'commit', 'commitment', 'committee', 'communication', 'community', 'companion',
  'compare', 'competition', 'complain', 'complaint', 'complex', 'component', 'compose', 'composition', 'comprehensive', 'concentrate',
  'concept', 'conclude', 'conclusion', 'condition', 'conduct', 'conference', 'confidence', 'conflict', 'congratulation', 'connection',
  'consequence', 'conservation', 'considerable', 'constant', 'construction', 'consult', 'consumer', 'contact', 'container', 'contemporary',
  'content', 'context', 'contribute', 'contribution', 'controversial', 'convenience', 'conventional', 'cooperate', 'cooperation', 'core',
  'corporate', 'correspond', 'crash', 'creativity', 'credit', 'crisis', 'critic', 'critical', 'curiosity', 'curriculum',
  'deadline', 'debate', 'decade', 'declare', 'decline', 'decorate', 'decrease', 'defeat', 'defend', 'definition',
  'delay', 'delight', 'delivery', 'demand', 'demonstrate', 'departure', 'deposit', 'depression', 'desert', 'desire',
  'desperate', 'destination', 'determine', 'development', 'devote', 'dilemma', 'dimension', 'diploma', 'disability', 'discipline',
  'discount', 'discovery', 'discrimination', 'display', 'disposal', 'distant', 'distinguish', 'diversity', 'domestic', 'donate',
  'download', 'draft', 'drama', 'dramatic', 'economic', 'economy', 'edition', 'educator', 'effective', 'efficient',
  'eliminate', 'embarrass', 'emerge', 'emergency', 'emission', 'emotion', 'emphasize', 'employment', 'enable', 'encounter',
  'encourage', 'endangered', 'energy', 'engage', 'engineering', 'enhance', 'enormous', 'enquiry', 'ensure', 'enterprise',
  'enthusiasm', 'entrance', 'environmental', 'episode', 'equal', 'equipment', 'equivalent', 'essential', 'establish', 'evaluate',
  'eventually', 'evidence', 'evolution', 'evolve', 'examine', 'exception', 'exchange', 'exhaust', 'exhibit', 'existence',
  'expand', 'expectation', 'expense', 'expert', 'exploration', 'explore', 'exposure', 'extend', 'extent', 'extreme',
  'facility', 'factor', 'failure', 'familiar', 'fancy', 'fascinating', 'feature', 'federal', 'feedback', 'fiction',
  'figure', 'finance', 'flexible', 'flood', 'focus', 'forbid', 'foreign', 'formal', 'format', 'former',
  'fortune', 'foundation', 'freedom', 'frequency', 'frustration', 'function', 'fundamental', 'furniture', 'gallery', 'garbage',
  'generation', 'generous', 'geography', 'gesture', 'global', 'glory', 'goal', 'govern', 'government', 'graduation',
  'grateful', 'guidance', 'habit', 'harvest', 'headline', 'healthcare', 'hesitate', 'historic', 'honour', 'hostess',
  'household', 'humour', 'identify', 'identity', 'ignore', 'illegal', 'imagination', 'immediate', 'immigrant', 'impact',
  'impression', 'improve', 'incident', 'income', 'independent', 'index', 'indicate', 'individual', 'industry', 'influence',
  'informal', 'initial', 'injure', 'inquiry', 'inspire', 'instant', 'instead', 'instruction', 'instrument', 'insurance',
  'intelligent', 'intention', 'interaction', 'international', 'internet', 'interpret', 'interview', 'introduce', 'invest', 'involve',
  'issue', 'journal', 'journalist', 'judgement', 'justice', 'keyboard', 'knowledge', 'landscape', 'language', 'latest',
  'launch', 'league', 'legal', 'leisure', 'length', 'literature', 'livelihood', 'location', 'logic', 'majority',
  'manual', 'manufacture', 'masterpiece', 'material', 'meanwhile', 'measure', 'mechanic', 'media', 'medical', 'memory',
  'mental', 'method', 'milestone', 'minority', 'miracle', 'mobile', 'modern', 'modest', 'monitor', 'motivation',
  'multiple', 'mystery', 'narrative', 'native', 'negative', 'network', 'nutrition', 'objective', 'observation', 'occupation',
  'official', 'operation', 'opponent', 'opportunity', 'optional', 'ordinary', 'organize', 'origin', 'outcome', 'outdoor',
  'output', 'overall', 'ownership', 'participant', 'particular', 'partnership', 'passage', 'passion', 'patience', 'pattern',
  'percentage', 'perform', 'period', 'permission', 'personality', 'persuade', 'phenomenon', 'philosophy', 'physical', 'planet',
  'platform', 'plenty', 'policy', 'political', 'pollution', 'population', 'positive', 'potential', 'powerful', 'practical',
  'practice', 'precious', 'precise', 'predict', 'preference', 'prepare', 'presence', 'preserve', 'pressure', 'principle',
  'priority', 'procedure', 'process', 'profession', 'progress', 'project', 'promise', 'promote', 'proper', 'property',
  'prospect', 'protect', 'protest', 'provide', 'psychology', 'public', 'publish', 'punctual', 'purpose', 'quality',
  'quantity', 'questionnaire', 'radical', 'range', 'rapid', 'rarely', 'reaction', 'realistic', 'reality', 'reasonable',
  'recognition', 'recommend', 'recover', 'recycle', 'reduce', 'reference', 'reflect', 'reform', 'refuse', 'region',
  'register', 'regular', 'regulation', 'relationship', 'release', 'relevant', 'relief', 'remarkable', 'remote', 'remove',
  'replace', 'representative', 'request', 'requirement', 'rescue', 'researcher', 'resource', 'respectful', 'respond', 'responsibility',
  'restore', 'restrict', 'result', 'retire', 'revolution', 'reward', 'rhythm', 'risk', 'routine', 'satisfy',
  'schedule', 'score', 'screen', 'search', 'secondary', 'secretary', 'sector', 'security', 'selection', 'senior',
  'sensitive', 'separate', 'series', 'settlement', 'severe', 'shelter', 'shift', 'significance', 'similarity', 'sincere',
  'site', 'situation', 'skillful', 'software', 'source', 'specialist', 'species', 'specific', 'standard', 'statement',
  'statistic', 'status', 'strategy', 'strength', 'struggle', 'style', 'subject', 'submit', 'substance', 'successfully',
  'suffer', 'sufficient', 'suggestion', 'summary', 'supply', 'supportive', 'surface', 'survival', 'sustainable', 'symbol',
  'systematic', 'talent', 'target', 'technical', 'technique', 'technology', 'tendency', 'theory', 'therefore', 'threat',
  'thus', 'topic', 'tradition', 'traffic', 'transform', 'transition', 'transport', 'trend', 'typical', 'ultimate',
  'unaware', 'uncertain', 'understanding', 'unfortunately', 'uniform', 'unique', 'universe', 'update', 'urban', 'urgent',
  'vacant', 'value', 'variation', 'variety', 'vehicle', 'version', 'victim', 'violence', 'virtual', 'vision',
  'vital', 'vocabulary', 'volunteer', 'welfare', 'wildlife', 'willingness', 'wisdom', 'witness', 'workshop', 'worldwide',
  'youth',
]);

const TEM8_CORE_WORDS = toWordSet([
  'aberration', 'abide', 'abstain', 'acquiesce', 'ameliorate', 'anomaly', 'antagonize', 'aptitude',
  'arrogance', 'articulate', 'assertive', 'audacious', 'belligerent', 'benevolent', 'candid', 'catalyst',
  'clandestine', 'coercive', 'cohesive', 'commence', 'compensate', 'comprehensive', 'conceal', 'concession',
  'condense', 'connotation', 'conspicuous', 'contend', 'contradictory', 'converge', 'corroborate', 'credibility',
  'degrade', 'deliberate', 'denounce', 'deprive', 'deteriorate', 'detrimental', 'diminish', 'discern',
  'discrepancy', 'disperse', 'disposition', 'distort', 'divergent', 'eloquent', 'encompass', 'endeavor',
  'endure', 'entail', 'ephemeral', 'equivocal', 'eradicate', 'escalate', 'evoke', 'exemplify',
  'exhaustive', 'explicitly', 'facilitate', 'feasible', 'forgo', 'formidable', 'friction', 'genuine',
  'hamper', 'hostile', 'imminent', 'impartial', 'implicit', 'impose', 'incompatible', 'incongruous',
  'indispensable', 'inequality', 'inflict', 'innate', 'integrity', 'intervene', 'intricate', 'intuitive',
  'jeopardize', 'lucid', 'meticulous', 'mitigate', 'notwithstanding', 'obsolete', 'ostensibly', 'pervasive',
  'plausible', 'predominant', 'profound', 'propagate', 'provoke', 'redundant', 'reformulate', 'reconcile',
  'refute', 'resilient', 'rigorous', 'substantiate', 'succinct', 'suppress', 'tentative', 'ubiquitous',
  'undermine', 'unprecedented', 'versatile', 'withstand',
]);

const TOEFL_CORE_WORDS = toWordSet([
  'abundant', 'accommodate', 'adjacent', 'aggregate', 'allocate', 'alteration', 'analogy', 'annual', 'anticipate',
  'arbitrary', 'assess', 'attribute', 'capability', 'cease', 'circumstance', 'clarify', 'coherent', 'collapse',
  'compile', 'complementary', 'complexity', 'component', 'compound', 'comprehensive', 'conceive', 'confer',
  'consequently', 'considerable', 'constitute', 'constrain', 'contemporary', 'contradict', 'convert', 'core',
  'correspond', 'criteria', 'crucial', 'decade', 'decline', 'deduce', 'definite', 'demonstrate', 'derive',
  'detect', 'deviate', 'dimension', 'diminish', 'discrete', 'display', 'dominate', 'duration', 'dynamic',
  'economy', 'eliminate', 'emerge', 'empirical', 'enhance', 'enormous', 'equivalent', 'erode', 'establish',
  'evident', 'exclude', 'explicit', 'expose', 'facilitate', 'factor', 'feature', 'fluctuate', 'format',
  'fund', 'fundamental', 'generate', 'global', 'hypothesis', 'identical', 'illustrate', 'impact', 'impose',
  'incentive', 'incidence', 'incorporate', 'index', 'indicate', 'induce', 'inhibit', 'initial', 'innovate',
  'instance', 'integrate', 'intense', 'interval', 'intrinsic', 'investigate', 'isolate', 'justify', 'layer',
  'logic', 'maintain', 'major', 'maximum', 'mechanism', 'methodology', 'minimum', 'modify', 'monitor',
  'neglect', 'notion', 'objective', 'obtain', 'offset', 'option', 'outcome', 'overall', 'parameter',
  'phase', 'phenomenon', 'policy', 'potential', 'precise', 'predict', 'preliminary', 'presume', 'priority',
  'proportion', 'protocol', 'publish', 'rationale', 'recover', 'refine', 'regime', 'region', 'regulate',
  'reinforce', 'remove', 'require', 'resolve', 'resource', 'restore', 'restrict', 'retain', 'reveal',
  'rigid', 'role', 'scenario', 'sector', 'select', 'sequence', 'shift', 'significant', 'simulate',
  'source', 'specific', 'stability', 'statistic', 'strategy', 'structure', 'substitute', 'sufficient',
  'sum', 'summary', 'sustain', 'temporary', 'theory', 'thereby', 'threshold', 'trace', 'transfer',
  'transform', 'transition', 'trend', 'ultimate', 'undergo', 'uniform', 'valid', 'variation', 'vehicle',
  'version', 'via', 'visible', 'volume',
]);

const IELTS_CORE_WORDS = toWordSet([
  'accessibility', 'addiction', 'adolescent', 'affordable', 'agriculture', 'airborne', 'allocation', 'alternative',
  'ambition', 'anxiety', 'appliance', 'applicant', 'artificial', 'assessment', 'atmospheric', 'awareness',
  'biodiversity', 'budget', 'burden', 'campaign', 'capacity', 'carbon', 'career', 'childcare', 'chronic',
  'citizenship', 'climate', 'collaboration', 'commute', 'compensation', 'congestion', 'conservation', 'consumerism',
  'contamination', 'convenience', 'cooperation', 'corporate', 'creativity', 'crime', 'cultivation', 'curriculum',
  'debt', 'demographic', 'depression', 'deprivation', 'detergent', 'disability', 'discrimination', 'disposal',
  'distance', 'diversity', 'domestic', 'economic', 'ecosystem', 'efficiency', 'elderly', 'emission',
  'empathy', 'employment', 'encourage', 'endangered', 'energy', 'entertainment', 'entrepreneur', 'equality',
  'erosion', 'essential', 'ethics', 'exhaust', 'expenditure', 'facility', 'fertility', 'finance',
  'flexibility', 'fossil', 'funding', 'gender', 'globalization', 'governance', 'greenhouse', 'habitat',
  'healthcare', 'homelessness', 'housing', 'hygiene', 'illiteracy', 'immigration', 'incentive', 'inclusive',
  'industrialization', 'inequality', 'inflation', 'infrastructure', 'innovation', 'insecurity', 'insurance',
  'interaction', 'landfill', 'legislation', 'lifestyle', 'literacy', 'livelihood', 'manufacturing', 'migration',
  'mobility', 'motivation', 'multicultural', 'nutrition', 'obesity', 'occupation', 'organic', 'overcrowded',
  'ownership', 'parenting', 'partnership', 'pollution', 'poverty', 'productivity', 'protection', 'publicity',
  'qualification', 'recycling', 'regulation', 'reliability', 'renewable', 'residence', 'responsibility', 'sanitation',
  'sedentary', 'security', 'shortage', 'sponsorship', 'standardization', 'subsidy', 'sustainability', 'taxation',
  'technology', 'tourism', 'transportation', 'unemployment', 'urbanization', 'vaccination', 'volunteer', 'welfare',
  'wellbeing', 'workload',
]);

const CAMBRIDGE_CORE_WORDS = toWordSet([
  'accuracy', 'adaptability', 'agreement', 'analysis', 'approach', 'argument', 'assertion', 'attitude',
  'background', 'benchmark', 'broaden', 'challenge', 'clarity', 'cohesion', 'collocation', 'commentary',
  'communication', 'competence', 'comprehension', 'conclusion', 'confidence', 'conflict', 'consistency', 'context',
  'contrast', 'convincing', 'cooperate', 'critical', 'debate', 'demonstration', 'description', 'detail',
  'development', 'device', 'diagnose', 'dialogue', 'distinct', 'diversity', 'draft', 'elaborate',
  'emphasis', 'engagement', 'evidence', 'evaluation', 'explanation', 'expression', 'fluency', 'format',
  'function', 'genre', 'global', 'guideline', 'highlight', 'identity', 'improvement', 'inference',
  'insight', 'interaction', 'interpretation', 'justification', 'keynote', 'language', 'layout', 'listener',
  'literal', 'logic', 'mainstream', 'mastery', 'meaningful', 'message', 'multilingual', 'negotiation',
  'nuance', 'objective', 'opinion', 'organize', 'outcome', 'overview', 'paragraph', 'paraphrase',
  'perspective', 'phrase', 'plenary', 'precision', 'presentation', 'progress', 'proofread', 'proposal',
  'purpose', 'quotation', 'reader', 'reasoning', 'register', 'relevance', 'response', 'reviewer',
  'rhetoric', 'seminar', 'sequence', 'signpost', 'speaker', 'spontaneous', 'statement', 'structure',
  'style', 'summary', 'supporting', 'synthesis', 'task', 'technique', 'thesis', 'tone',
  'transition', 'variation', 'vocabulary',
]);

const EXAM_PROFILE_WORDS = {
  gaokao_national: GAOKAO_NATIONAL_CORE_WORDS,
  tem4: TEM4_CORE_WORDS,
  tem8: TEM8_CORE_WORDS,
  toefl: TOEFL_CORE_WORDS,
  ielts: IELTS_CORE_WORDS,
  cambridge: CAMBRIDGE_CORE_WORDS,
};

module.exports = {
  EXAM_PROFILE_WORDS,
  GAOKAO_NATIONAL_CORE_WORDS,
  TEM4_CORE_WORDS,
  TEM8_CORE_WORDS,
  TOEFL_CORE_WORDS,
  IELTS_CORE_WORDS,
  CAMBRIDGE_CORE_WORDS,
};
