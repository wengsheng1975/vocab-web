/**
 * 大学英语四级 (CET-4) 和六级 (CET-6) 核心词库
 *
 * CET-4: 约 4500 词 — 大学英语基础要求
 * CET-6: 约 5500 词 — 在 CET-4 基础上扩展约 1000 词
 *
 * 词库用于判断用户生词是否"超纲"：
 *   - 目标 CET-4: 不在 CET4 中的词为超纲
 *   - 目标 CET-6: 不在 CET4+CET6 中的词为超纲
 */

// ===== CET-4 核心词汇 =====
const CET4_WORDS = new Set([
  // --- 基础词（确保 be/do/have 等原形及高频基础词覆盖） ---
  'be','do','have','go','say','get','make','know','think','take','come','see','give','find',
  'tell','become','leave','feel','put','bring','begin','keep','hold','write','stand','hear',
  'let','mean','set','meet','run','pay','sit','speak','read','grow','lose','spend','win',
  'build','send','fall','cut','teach','buy','lead','understand','catch','choose','draw','break',
  'drive','sell','show','eat','fly','rise','fight','throw','wear','sing','lie','wake','forget',
  'hide','swim','shoot','steal','shake','blow','strike','bear','spread','hang','seek','sleep',
  'feed','dig','freeze','bite','tear','bend','lend','shine','deal','bind','swear','forgive',
  'weave','withdraw','overcome','undertake','arise',
  'dog','cat','hat','cup','bed','pen','bag','box','bus','map','sun','sea','fish','bird',
  'tree','milk','rice','tea','egg','red','hot','wet','sit','top','stop','drop','ship',
  'shop','thin','step','star','plan','trip','swim','song','king','ring','rock','pick',
  'push','pull','fill','wish','rich','sick','page','store','score','stage','phone','price',
  'state','taste','piece','shape','stone','whole','mouth','horse','dance','north','south',
  'human','woman','person','money','story','point','power','paper','music','river','watch',
  'table','chair','glass','class','black','white','green','brown','young','small','large',
  // --- A ---
  'abandon','ability','able','abnormal','aboard','abolish','abortion','about','above','abroad',
  'absence','absent','absolute','absolutely','absorb','abstract','absurd','abundance','abundant','abuse',
  'academic','academy','accelerate','accent','accept','acceptable','acceptance','access','accessible','accident',
  'accidental','accommodate','accommodation','accompany','accomplish','accomplishment','accord','accordance','according','accordingly',
  'account','accountant','accumulate','accuracy','accurate','accuse','accustom','ache','achieve','achievement',
  'acid','acknowledge','acquaint','acquaintance','acquire','acquisition','acre','across','act','action',
  'activate','active','actively','activity','actor','actress','actual','actually','acute','adapt',
  'adaptation','add','addict','addition','additional','address','adequate','adhere','adjacent','adjective',
  'adjust','adjustment','administer','administration','administrative','administrator','admiration','admire','admission','admit',
  'adolescent','adopt','adult','advance','advanced','advancement','advantage','adventure','adventurous','adverb',
  'advertise','advertisement','advice','advise','adviser','advocate','affair','affect','affection','afford',
  'afraid','african','after','afternoon','afterward','afterwards','again','against','age','aged',
  'agency','agenda','agent','aggressive','ago','agony','agree','agreeable','agreement','agricultural',
  'agriculture','ahead','aid','aim','air','aircraft','airline','airplane','airport','alarm',
  'album','alcohol','alert','alien','alike','alive','all','allege','allergic','alley',
  'alliance','allocate','allow','allowance','ally','almost','alone','along','alongside','alphabet',
  'already','also','alter','alternative','although','altogether','aluminum','always','amateur','amaze',
  'amazing','ambiguous','ambition','ambitious','ambulance','among','amount','ample','amuse','amusement',
  'analyze','analysis','analyst','ancestor','anchor','ancient','angel','anger','angle','angry',
  'animal','ankle','anniversary','announce','announcement','annoy','annual','anonymous','another','answer',
  'anticipate','anxiety','anxious','any','anybody','anyhow','anyone','anything','anyway','anywhere',
  'apart','apartment','ape','apologize','apology','apparent','apparently','appeal','appear','appearance',
  'appetite','apple','appliance','applicable','applicant','application','apply','appoint','appointment','appraisal',
  'appreciate','appreciation','approach','appropriate','approval','approve','approximate','april','arbitrary','architect',
  'architecture','area','arena','argue','argument','arise','arithmetic','arm','army','around',
  'arouse','arrange','arrangement','array','arrest','arrival','arrive','arrogant','arrow','art',
  'article','artificial','artist','artistic','as','ash','ashamed','aside','ask','asleep',
  'aspect','assemble','assembly','assert','assess','assessment','asset','assign','assignment','assist',
  'assistance','assistant','associate','association','assume','assumption','assure','astonish','astronaut','astronomy',
  'at','athlete','athletic','atmosphere','atom','atomic','attach','attachment','attack','attain',
  'attempt','attend','attendance','attention','attitude','attorney','attract','attraction','attractive','attribute',
  'audience','august','aunt','author','authority','automatic','automatically','automobile','autumn','available',
  'avenue','average','avoid','awake','award','aware','awareness','away','awful','awkward',

  // --- B ---
  'baby','bachelor','back','background','backward','bacteria','bad','badge','badly','bag',
  'bake','balance','ball','ban','banana','band','bang','bank','banker','bankrupt',
  'bar','bare','barely','bargain','barrel','barrier','base','baseball','basic','basically',
  'basin','basis','basket','basketball','bat','batch','bath','bathe','bathroom','battery',
  'battle','bay','beach','beam','bean','bear','beard','bearing','beast','beat',
  'beautiful','beauty','because','become','bed','bedroom','beef','beer','before','beg',
  'begin','beginning','behalf','behave','behavior','behind','being','belief','believe','bell',
  'belong','beloved','below','belt','bench','bend','beneath','beneficial','benefit','beside',
  'besides','best','bet','betray','better','between','beyond','bible','bicycle','bid',
  'big','bike','bill','billion','bind','biology','bird','birth','birthday','biscuit',
  'bishop','bit','bite','bitter','black','blade','blame','blank','blanket','blast',
  'blaze','bleed','blend','bless','blind','block','blood','bloody','bloom','blow',
  'blue','board','boast','boat','body','boil','bold','bomb','bond','bone',
  'bonus','book','boom','boost','boot','border','bore','born','borrow','boss',
  'both','bother','bottle','bottom','bounce','bound','boundary','bow','bowl','box',
  'boy','brain','brake','branch','brand','brave','bread','break','breakdown','breakfast',
  'breakthrough','breast','breath','breathe','breed','breeze','brick','bridge','brief','briefly',
  'bright','brilliant','bring','broad','broadcast','brochure','brother','brown','browser','brush',
  'bubble','bucket','budget','bug','build','building','bulk','bullet','bunch','burden',
  'bureau','burn','burst','bury','bus','bush','business','busy','but','butter',
  'button','buy','buyer','by',

  // --- C ---
  'cab','cabin','cabinet','cable','cafe','cage','cake','calculate','calculation','calendar',
  'call','calm','camera','camp','campaign','campus','can','cancel','cancer','candidate',
  'candle','cap','capable','capacity','capital','captain','capture','car','carbon','card',
  'care','career','careful','carefully','careless','cargo','carpenter','carpet','carriage','carrier',
  'carry','cart','case','cash','cast','casual','catalog','catalogue','catch','category',
  'cater','cattle','cause','caution','cautious','cave','cease','ceiling','celebrate','celebration',
  'cell','cent','center','central','century','ceremony','certain','certainly','certificate','chain',
  'chair','chairman','challenge','chamber','champion','championship','chance','change','channel','chapter',
  'character','characteristic','charge','charity','charm','chart','chase','chat','cheap','cheat',
  'check','cheek','cheer','cheerful','cheese','chemical','chemistry','chest','chicken','chief',
  'child','childhood','chip','chocolate','choice','choose','christmas','church','cigarette','cinema',
  'circle','circuit','circular','circulate','circumstance','cite','citizen','city','civil','civilian',
  'civilization','claim','clap','clarify','clash','class','classic','classical','classification','classify',
  'classmate','classroom','clause','clean','clear','clearly','clerk','clever','click','client',
  'cliff','climate','climb','cling','clinic','clinical','clip','clock','clone','close',
  'closely','closet','cloth','clothe','clothes','clothing','cloud','club','clue','cluster',
  'coach','coal','coalition','coast','coat','code','coffee','cognitive','coin','coincide',
  'coincidence','cold','collapse','colleague','collect','collection','collective','college','collision','colonel',
  'colonial','colony','color','colour','column','combat','combination','combine','come','comedy',
  'comfort','comfortable','command','commander','comment','commentary','commercial','commission','commit','commitment',
  'committee','commodity','common','communicate','communication','communist','community','companion','company','comparative',
  'compare','comparison','compel','compensate','compensation','compete','competent','competition','competitive','competitor',
  'complain','complaint','complement','complete','completely','complex','complexity','complicate','complicated','complication',
  'component','compose','composer','composition','comprehensive','comprise','compromise','computer','conceal','concentrate',
  'concentration','concept','concern','concerned','concert','conclude','conclusion','concrete','condemn','condition',
  'conduct','conductor','conference','confidence','confident','confidential','confine','confirm','conflict','confront',
  'confuse','confusion','congress','connect','connection','conscience','conscious','consciousness','consensus','consent',
  'consequence','consequent','consequently','conservation','conservative','consider','considerable','considerably','consideration','consist',
  'consistent','constant','constantly','constitute','constitution','constitutional','construct','construction','consult','consultant',
  'consume','consumer','consumption','contact','contain','container','contemporary','content','contest','context',
  'continent','continual','continue','continuous','contract','contradict','contradiction','contrary','contrast','contribute',
  'contribution','control','controversial','controversy','convenience','convenient','convention','conventional','conversation','conversion',
  'convert','convey','convince','cook','cookie','cool','cooperate','cooperation','cooperative','cope',
  'copy','core','corn','corner','corporate','corporation','correct','correspond','correspondence','correspondent',
  'corresponding','corridor','corrupt','corruption','cost','costly','cottage','cotton','could','council',
  'count','counter','country','countryside','county','couple','courage','courageous','course','court',
  'cousin','cover','coverage','crack','craft','crash','crazy','cream','create','creation',
  'creative','creature','credit','crew','crime','criminal','crisis','criteria','critic','critical',
  'criticism','criticize','crop','cross','crowd','crucial','cruel','crush','cry','crystal',
  'cultivate','cultural','culture','cup','cure','curiosity','curious','currency','current','currently',
  'curriculum','curse','curtain','curve','custom','customer','cut','cycle',

  // --- D ---
  'dad','daily','dairy','damage','damp','dance','danger','dangerous','dare','dark',
  'darkness','data','database','date','daughter','dawn','day','dead','deadline','deadly',
  'deaf','deal','dealer','dear','death','debate','debt','decade','decay','decent',
  'decide','decision','deck','declaration','declare','decline','decorate','decoration','decrease','dedicate',
  'deed','deem','deep','deeply','deer','defeat','defect','defend','defendant','defense',
  'defensive','deficit','define','definite','definitely','definition','degree','delay','delegate','delegation',
  'deliberate','deliberately','delicate','delicious','delight','deliver','delivery','demand','democracy','democratic',
  'demonstrate','demonstration','denial','dense','deny','depart','department','departure','depend','dependent',
  'deposit','depress','depression','deprive','depth','deputy','derive','describe','description','desert',
  'deserve','design','designate','designer','desirable','desire','desk','despair','desperate','desperately',
  'despite','destination','destiny','destroy','destruction','detail','detailed','detect','detective','determination',
  'determine','develop','developer','development','device','devil','devote','dialogue','diamond','diary',
  'dictate','dictionary','die','diet','differ','difference','different','differently','difficult','difficulty',
  'dig','digital','dignity','dilemma','dimension','diminish','dinner','dioxide','dip','diplomat',
  'diplomatic','direct','direction','directly','director','directory','dirty','disability','disabled','disadvantage',
  'disagree','disappear','disappoint','disappointment','disaster','discipline','disclose','discount','discourse','discover',
  'discovery','discrimination','discuss','discussion','disease','dish','dismiss','disorder','display','disposal',
  'dispose','dispute','dissolve','distance','distant','distinct','distinction','distinguish','distribute','distribution',
  'district','disturb','dive','diverse','diversity','divide','division','divorce','do','doctor',
  'doctrine','document','documentary','dollar','domain','domestic','dominant','dominate','donate','donation',
  'door','dose','dot','double','doubt','down','download','downtown','draft','drag',
  'drain','drama','dramatic','dramatically','draw','drawer','drawing','dream','dress','drift',
  'drill','drink','drive','driver','drop','drug','drum','drunk','dry','due',
  'dull','dumb','dump','duration','during','dust','duty','dynamic',

  // --- E ---
  'each','eager','ear','early','earn','earning','earth','ease','easily','east',
  'eastern','easy','eat','echo','economic','economical','economics','economist','economy','edge',
  'edit','edition','editor','educate','education','educational','educator','effect','effective','effectively',
  'efficiency','efficient','effort','egg','eight','either','elaborate','elderly','elect','election',
  'electric','electrical','electricity','electron','electronic','elegant','element','eliminate','elite','else',
  'elsewhere','email','embark','embarrass','embrace','emerge','emergence','emergency','emission','emotion',
  'emotional','emperor','emphasis','emphasize','empire','employ','employee','employer','employment','empower',
  'empty','enable','encounter','encourage','encouragement','end','endless','endorse','endure','enemy',
  'energy','enforce','enforcement','engage','engagement','engine','engineer','engineering','enhance','enjoy',
  'enjoyable','enormous','enough','enrich','enroll','ensure','enter','enterprise','entertainment','enthusiasm',
  'enthusiastic','entire','entirely','entitle','entity','entrance','entrepreneur','entry','envelope','environment',
  'environmental','envy','episode','equal','equality','equally','equation','equip','equipment','equivalent',
  'era','error','escape','especially','essay','essence','essential','essentially','establish','establishment',
  'estate','estimate','evaluate','evaluation','eve','even','evening','event','eventually','ever',
  'every','everybody','everyday','everyone','everything','everywhere','evidence','evident','evil','evolution',
  'evolve','exact','exactly','exaggerate','exam','examination','examine','example','exceed','excellent',
  'except','exception','exceptional','excess','excessive','exchange','excite','excitement','exciting','exclaim',
  'exclude','exclusive','excuse','execute','execution','executive','exercise','exert','exhaust','exhibit',
  'exhibition','exile','exist','existence','existing','exit','exotic','expand','expansion','expect',
  'expectation','expenditure','expense','expensive','experience','experiment','experimental','expert','expertise','explain',
  'explanation','explicit','explode','exploit','exploitation','exploration','explore','explorer','explosion','export',
  'expose','exposure','express','expression','extend','extension','extensive','extent','exterior','external',
  'extra','extract','extraordinary','extreme','extremely','eye',

  // --- F ---
  'fabric','face','facilitate','facility','fact','factor','factory','faculty','fade','fail',
  'failure','fair','fairly','faith','faithful','fall','false','fame','familiar','family',
  'famine','famous','fan','fancy','fantastic','fantasy','far','fare','farm','farmer',
  'fascinate','fashion','fashionable','fast','fasten','fat','fatal','fate','father','fault',
  'favor','favorite','fear','feasible','feast','feature','february','federal','fee','feed',
  'feedback','feel','feeling','fellow','female','fence','festival','fetch','fever','few',
  'fiber','fiction','field','fierce','fifteen','fifth','fifty','fight','fighter','figure',
  'file','fill','film','filter','final','finally','finance','financial','find','finding',
  'fine','finger','finish','fire','firm','first','fish','fit','fitness','five',
  'fix','flag','flame','flash','flat','flavor','flee','flesh','flexible','flight',
  'float','flood','floor','flour','flow','flower','flu','fluent','fluid','fly',
  'focus','fold','folk','follow','following','fond','food','fool','foolish','foot',
  'football','for','forbid','force','forecast','foreign','foreigner','forest','forever','forget',
  'forgive','fork','form','formal','format','formation','former','formerly','formula','forth',
  'fortune','forty','forum','forward','fossil','foster','found','foundation','founder','four',
  'fraction','fragment','frame','framework','free','freedom','freeze','frequency','frequent','frequently',
  'fresh','friction','friday','friend','friendly','friendship','frighten','front','frontier','frost',
  'fruit','frustrate','frustration','fuel','fulfill','full','fully','fun','function','fund',
  'fundamental','funding','funeral','funny','fur','furniture','furthermore','fury','future',

  // --- G ---
  'gain','gallery','game','gang','gap','garage','garbage','garden','garlic','garment',
  'gas','gasoline','gate','gather','gay','gaze','gear','gender','gene','general',
  'generally','generate','generation','generous','genetic','genius','gentle','gentleman','genuine','geography',
  'gesture','get','ghost','giant','gift','gifted','girl','give','glad','glance',
  'glass','global','globe','glory','glove','go','goal','god','gold','golden',
  'golf','gone','good','goods','govern','government','governor','grab','grace','grade',
  'gradual','gradually','graduate','grain','grammar','grand','grandchild','grandfather','grandmother','grandparent',
  'grant','grasp','grass','grateful','grave','gray','great','greatly','green','greet',
  'greeting','grey','grief','grind','grip','grocery','gross','ground','group','grow',
  'growth','guarantee','guard','guess','guest','guide','guideline','guilty','guitar','gun',
  'guy',

  // --- H ---
  'habit','hair','half','hall','halt','hand','handful','handle','handsome','hang',
  'happen','happiness','happy','harbor','hard','hardly','hardship','hardware','harm','harmful',
  'harmony','harsh','harvest','hat','hate','hatred','have','he','head','headline',
  'headquarters','health','healthy','hear','hearing','heart','heat','heaven','heavily','heavy',
  'height','helicopter','hell','hello','help','helpful','hence','her','herb','here',
  'heritage','hero','heroic','hesitate','hide','high','highlight','highly','highway','hill',
  'him','hint','hip','hire','his','historian','historic','historical','history','hit',
  'hobby','hold','holder','hole','holiday','holy','home','homework','honest','honestly',
  'honor','hook','hope','hopeful','horizon','horrible','horror','horse','hospital','host',
  'hostile','hot','hotel','hour','house','household','housing','how','however','huge',
  'human','humble','humor','humorous','hundred','hunger','hungry','hunt','hunter','hurry',
  'hurt','husband','hydrogen',

  // --- I ---
  'ice','idea','ideal','identical','identification','identify','identity','ideology','ignorance','ignore',
  'ill','illegal','illness','illustrate','illustration','image','imaginary','imagination','imagine','immediate',
  'immediately','immense','immigrant','immigration','immune','impact','implement','implementation','implication','implicit',
  'imply','import','importance','important','impose','impossible','impress','impression','impressive','improve',
  'improvement','in','inadequate','incentive','inch','incident','incline','include','income','incorporate',
  'increase','increasingly','incredible','incredibly','indeed','independence','independent','index','indicate','indication',
  'indicator','individual','industrial','industrialize','industry','inevitable','infant','infect','infection','inflation',
  'influence','inform','information','infrastructure','ingredient','inhabitant','inherit','initial','initially','initiative',
  'injection','injure','injury','inner','innocent','innovation','innovative','input','inquiry','insect',
  'insert','inside','insight','insist','inspect','inspection','inspector','inspiration','inspire','install',
  'installation','instance','instant','instantly','instead','institute','institution','institutional','instruction','instructor',
  'instrument','insurance','intellectual','intelligence','intelligent','intend','intense','intensity','intensive','intention',
  'interact','interaction','interest','interested','interesting','interior','internal','international','internet','interpret',
  'interpretation','interval','intervene','intervention','interview','intimate','into','introduce','introduction','invade',
  'invasion','invent','invention','invest','investigate','investigation','investigator','investment','investor','invisible',
  'invitation','invite','involve','involvement','iron','ironic','irregular','irrelevant','island','isolate',
  'isolation','issue','it','item','its','itself',

  // --- J-K ---
  'jacket','jail','jam','january','jaw','jazz','jealous','jet','jewel','jewelry',
  'job','join','joint','joke','journal','journalist','journey','joy','judge','judgment',
  'juice','jump','junction','june','junior','jury','just','justice','justify',
  'keen','keep','key','keyboard','kick','kid','kill','killer','kilogram','kilometer',
  'kind','king','kingdom','kiss','kit','kitchen','knee','knife','knock','know',
  'knowledge',

  // --- L ---
  'lab','label','labor','laboratory','lack','lady','lake','land','landing','landscape',
  'lane','language','lap','large','largely','laser','last','late','lately','later',
  'latest','latter','laugh','laughter','launch','law','lawn','lawsuit','lawyer','lay',
  'layer','layout','lazy','lead','leader','leadership','leading','leaf','league','lean',
  'leap','learn','learning','least','leather','leave','lecture','left','leg','legacy',
  'legal','legend','legendary','legislation','legitimate','leisure','lemon','lend','length','lens',
  'less','lesson','let','letter','level','liberal','liberate','liberty','library','license',
  'lid','lie','life','lifestyle','lifetime','lift','light','like','likelihood','likely',
  'likewise','limb','limit','limitation','limited','line','link','lion','lip','liquid',
  'list','listen','literacy','literally','literary','literature','liter','little','live','lively',
  'liver','living','load','loan','lobby','local','locate','location','lock','lodge',
  'log','logic','logical','lonely','long','look','loose','lord','lose','loss',
  'lost','lot','loud','love','lovely','lover','low','lower','loyal','loyalty',
  'luck','lucky','luggage','lunch','lung','luxury',

  // --- M ---
  'machine','mad','magazine','magic','magnificent','mail','main','mainly','mainstream','maintain',
  'maintenance','major','majority','make','maker','male','mall','man','manage','management',
  'manager','mandate','manifest','manipulate','mankind','manner','mansion','manual','manufacture','manufacturer',
  'manuscript','many','map','march','margin','mark','market','marketing','marriage','marry',
  'mask','mass','massive','master','match','mate','material','math','mathematics','matter',
  'mature','maximum','may','maybe','mayor','me','meal','mean','meaning','meaningful',
  'means','meanwhile','measure','measurement','meat','mechanic','mechanical','mechanism','media','medical',
  'medicine','medium','meet','meeting','member','membership','memo','memorial','memory','mental',
  'mentally','mention','mentor','menu','merchant','mercy','mere','merely','merge','merit',
  'mess','message','metal','method','methodology','middle','might','mild','military','milk',
  'mill','million','mind','mine','mineral','minimum','minister','ministry','minor','minority',
  'minute','miracle','mirror','miss','missile','mission','mistake','mix','mixture','mobile',
  'mode','model','moderate','modern','modest','modify','mom','moment','monday','money',
  'monitor','monkey','month','mood','moon','moral','more','moreover','morning','mortgage',
  'most','mostly','mother','motion','motivate','motivation','motor','mount','mountain','mouse',
  'mouth','move','movement','movie','much','multiple','murder','muscle','museum','music',
  'musical','musician','must','mutual','my','mystery','myth',

  // --- N ---
  'nail','naked','name','narrative','narrow','nation','national','natural','naturally','nature',
  'naval','navigate','navy','near','nearby','nearly','neat','necessarily','necessary','necessity',
  'neck','need','needle','negative','neglect','negotiate','negotiation','neighbor','neighborhood','neither',
  'nerve','nervous','nest','net','network','neutral','never','nevertheless','new','newly',
  'news','newspaper','next','nice','night','nightmare','nine','no','noble','nod',
  'noise','none','nonetheless','nonsense','nor','norm','normal','normally','north','northern',
  'nose','not','notable','note','nothing','notice','notion','novel','novelist','now',
  'nowhere','nuclear','number','numerous','nurse','nut','nutrition',

  // --- O ---
  'object','objection','objective','obligation','observation','observe','observer','obstacle','obtain','obvious',
  'obviously','occasion','occasional','occasionally','occupation','occupy','occur','occurrence','ocean','october',
  'odd','odds','of','off','offend','offense','offensive','offer','office','officer',
  'official','offset','often','oh','oil','ok','okay','old','olympic','on',
  'once','one','ongoing','onion','online','only','onto','open','opening','operate',
  'operation','operator','opinion','opponent','opportunity','oppose','opposite','opposition','opt','option',
  'or','orange','orbit','order','ordinary','organ','organic','organism','organization','organize',
  'orientation','origin','original','originally','other','otherwise','ought','our','ourselves','out',
  'outcome','outdoor','outer','output','outside','outstanding','overcome','overlook','overseas','owe',
  'own','owner','ownership','oxygen',

  // --- P ---
  'pace','pack','package','page','pain','painful','paint','painter','painting','pair',
  'palace','pale','palm','pan','panel','panic','paper','parade','paragraph','parallel',
  'parcel','parent','park','parliament','part','partial','partially','participant','participate','participation',
  'particular','particularly','partly','partner','partnership','party','pass','passage','passenger','passion',
  'passionate','passive','passport','past','path','patience','patient','pattern','pause','pay',
  'payment','peace','peaceful','peak','peasant','peer','pen','penalty','pension','people',
  'per','perceive','percent','percentage','perception','perfect','perfectly','perform','performance','perhaps',
  'period','permanent','permission','permit','persist','persistent','person','personal','personality','personally',
  'personnel','perspective','persuade','pet','phase','phenomenon','philosophy','phone','photo','photograph',
  'photographer','photography','phrase','physical','physically','physician','physics','piano','pick','picture',
  'pie','piece','pile','pilot','pin','pink','pioneer','pipe','pitch','place',
  'plain','plan','plane','planet','planning','plant','plastic','plate','platform','play',
  'player','playground','plead','pleasant','please','pleasure','plenty','plot','plug','plus',
  'pocket','poem','poet','poetry','point','poison','police','policeman','policy','polite',
  'political','politically','politician','politics','poll','pollution','pond','pool','poor','pop',
  'popular','popularity','population','port','portrait','portray','pose','position','positive','possess',
  'possession','possibility','possible','possibly','post','pot','potato','potential','potentially','pound',
  'pour','poverty','powder','power','powerful','practical','practice','praise','pray','prayer',
  'precious','precise','precisely','predict','prediction','prefer','preference','pregnant','prejudice','preliminary',
  'premier','premise','premium','preparation','prepare','presence','present','presentation','preserve','presidency',
  'president','presidential','press','pressure','presumably','pretend','pretty','prevail','prevent','prevention',
  'previous','previously','price','pride','priest','primarily','primary','prime','prince','princess',
  'principal','principle','print','printer','prior','priority','prison','prisoner','privacy','private',
  'privately','privilege','prize','probably','probe','problem','procedure','proceed','process','processor',
  'produce','producer','product','production','productive','productivity','profession','professional','professor','profile',
  'profit','profitable','program','programme','progress','project','prominent','promise','promote','promotion',
  'prompt','proof','proper','properly','property','proportion','proposal','propose','proposition','prospect',
  'prosperity','protect','protection','protein','protest','proud','prove','provide','provider','province',
  'provision','provoke','psychological','psychologist','psychology','pub','public','publication','publicity','publicly',
  'publish','publisher','pull','punch','punish','punishment','pupil','purchase','pure','purple',
  'purpose','pursue','pursuit','push','put','puzzle',

  // --- Q-R ---
  'qualify','quality','quantity','quarter','queen','question','quick','quickly','quiet','quietly',
  'quit','quite','quote','race','racial','racism','radical','radio','rage','raid',
  'rail','railroad','railway','rain','raise','range','rank','rapid','rapidly','rare',
  'rarely','rat','rate','rather','ratio','raw','ray','reach','react','reaction',
  'read','reader','readily','reading','ready','real','realistic','reality','realize','really',
  'realm','rear','reason','reasonable','reasonably','rebel','rebellion','recall','receive','recent',
  'recently','reception','recipe','recipient','recognition','recognize','recommend','recommendation','record','recording',
  'recover','recovery','recruit','red','reduce','reduction','refer','reference','reflect','reflection',
  'reform','refugee','refuse','regard','regarding','regime','region','regional','register','regret',
  'regular','regularly','regulate','regulation','regulatory','reinforce','reject','relate','relation','relationship',
  'relative','relatively','relax','release','relevant','relief','relieve','religion','religious','reluctant',
  'rely','remain','remaining','remark','remarkable','remedy','remember','remind','remote','removal',
  'remove','rent','repair','repeat','repeatedly','replace','replacement','reply','report','reporter',
  'represent','representation','representative','reproduce','republic','republican','reputation','request','require','requirement',
  'rescue','research','researcher','resemble','reservation','reserve','residence','resident','residential','resign',
  'resist','resistance','resolution','resolve','resort','resource','respect','respectively','respond','response',
  'responsibility','responsible','rest','restaurant','restore','restriction','result','retail','retain','retire',
  'retirement','retreat','retrieve','return','reveal','revenue','reverse','review','revolution','revolutionary',
  'reward','rhythm','rice','rich','rid','ride','ridiculous','rifle','right','rigid',
  'ring','riot','rise','risk','rival','river','road','robot','rock','role',
  'roll','romantic','roof','room','root','rope','rose','rough','roughly','round',
  'route','routine','row','royal','rub','ruin','rule','ruler','rumor','run',
  'rural','rush',

  // --- S ---
  'sacred','sacrifice','sad','safe','safety','sail','sake','salary','sale','salt',
  'same','sample','sanction','sand','satellite','satisfaction','satisfy','saturday','save','saving',
  'say','scale','scandal','scene','schedule','scheme','scholar','scholarship','school','science',
  'scientific','scientist','scope','score','screen','script','sea','seal','search','season',
  'seat','second','secondary','secret','secretary','section','sector','secure','security','see',
  'seed','seek','seem','segment','seize','select','selection','self','sell','senate',
  'senator','send','senior','sense','sensitive','sensitivity','sentence','separate','separately','separation',
  'september','sequence','series','serious','seriously','servant','serve','service','session','set',
  'setting','settle','settlement','seven','several','severe','sex','sexual','shade','shadow',
  'shake','shall','shame','shape','share','sharp','shatter','shed','sheep','sheer',
  'sheet','shelf','shell','shelter','shift','shine','ship','shirt','shock','shoe',
  'shoot','shop','shopping','shore','short','shortage','shortly','shot','should','shoulder',
  'shout','show','shower','shut','shuttle','shy','sick','side','sigh','sight',
  'sign','signal','signature','significance','significant','significantly','silence','silent','silk','silly',
  'silver','similar','similarity','similarly','simple','simplify','simply','simultaneous','simultaneously','since',
  'sing','singer','single','sink','sir','sister','sit','site','situation','six',
  'size','ski','skill','skilled','skin','sky','slave','slavery','sleep','slice',
  'slide','slight','slightly','slim','slip','slow','slowly','small','smart','smell',
  'smile','smoke','smooth','snap','snow','so','soccer','social','socialist','society',
  'soft','software','soil','solar','soldier','sole','solely','solid','solution','solve',
  'some','somebody','someday','somehow','someone','something','sometimes','somewhat','somewhere','son',
  'song','soon','sophisticated','sorry','sort','soul','sound','source','south','southern',
  'space','span','spare','spark','speak','speaker','special','specialist','specialize','specially',
  'species','specific','specifically','spectacular','spectrum','speech','speed','spell','spend','spending',
  'sphere','spin','spirit','spiritual','spite','split','spokesman','sponsor','sport','spot',
  'spray','spread','spring','spy','squad','square','squeeze','stability','stable','stadium',
  'staff','stage','stair','stake','stand','standard','standing','star','stare','start',
  'state','statement','station','statistics','statue','status','statute','stay','steady','steal',
  'steam','steel','steep','steer','stem','step','stereotype','stick','stiff','still',
  'stimulate','stir','stock','stomach','stone','stop','storage','store','storm','story',
  'straight','strain','strange','stranger','strategic','strategy','stream','street','strength','strengthen',
  'stress','stretch','strict','strictly','strike','string','strip','strive','stroke','strong',
  'strongly','structure','struggle','student','studio','study','stuff','stupid','style','subject',
  'submit','subsequent','subsequently','substance','substantial','substantially','substitute','subtle','suburb','succeed',
  'success','successful','successfully','such','sudden','suddenly','sue','suffer','sufficient','sugar',
  'suggest','suggestion','suicide','suit','suitable','suite','sum','summary','summer','summit',
  'sun','sunday','super','superb','superior','supplement','supply','support','supporter','suppose',
  'supposed','suppress','sure','surely','surface','surgery','surplus','surprise','surprised','surprising',
  'surprisingly','surrender','surround','surrounding','survey','survival','survive','survivor','suspect','suspend',
  'suspicion','suspicious','sustain','sustainable','swallow','swear','sweet','swim','swing','switch',
  'symbol','sympathy','symptom','syndrome','system','systematic',

  // --- T ---
  'table','tackle','tail','take','tale','talent','talented','talk','tall','tank',
  'tap','tape','target','task','taste','tax','taxpayer','tea','teach','teacher',
  'teaching','team','tear','technical','technically','technique','technological','technology','telephone','television',
  'tell','temperature','temple','temporary','ten','tenant','tend','tendency','tender','tension',
  'tent','term','terminal','terms','terrible','territory','terror','terrorism','terrorist','test',
  'testify','testimony','testing','text','textbook','than','thank','thanks','that','the',
  'theater','theatre','theme','themselves','then','theory','therapy','there','thereafter','thereby',
  'therefore','thick','thief','thin','thing','think','thinking','third','thirteen','thirty',
  'this','thorough','thoroughly','those','though','thought','thousand','threat','threaten','three',
  'throat','through','throughout','throw','thus','ticket','tide','tie','tight','tightly',
  'till','time','tin','tiny','tip','tire','tired','tissue','title','to',
  'tobacco','today','toe','together','toilet','tolerance','tolerate','tomorrow','tone','tongue',
  'tonight','too','tool','tooth','top','topic','total','totally','touch','tough',
  'tour','tourism','tourist','tournament','toward','towards','tower','town','toy','trace',
  'track','trade','tradition','traditional','traffic','tragedy','trail','train','trainer','training',
  'trait','transfer','transform','transformation','transit','transition','translate','translation','transmission','transmit',
  'transparent','transport','transportation','trap','travel','treasure','treasury','treat','treatment','treaty',
  'tree','tremendous','trend','trial','tribe','trick','trigger','trillion','trim','trip',
  'triumph','troop','tropical','trouble','truck','true','truly','trust','truth','try',
  'tube','tuesday','tune','tunnel','turn','twelve','twenty','twice','twin','twist',
  'two','type','typical','typically',

  // --- U-V ---
  'ugly','ultimate','ultimately','unable','uncle','undergo','undergraduate','underlying','undermine','understand',
  'understanding','undertake','unemployment','unfair','unfortunately','unhappy','uniform','union','unique','unit',
  'unite','united','unity','universal','universe','university','unknown','unless','unlike','unlikely',
  'until','unusual','up','update','upon','upper','upset','urban','urge','urgent',
  'us','use','used','useful','user','usual','usually','utility','utilize',
  'vacation','vague','valid','valley','valuable','value','van','variable','variation','variety',
  'various','vary','vast','vegetable','vehicle','venture','version','versus','very','vessel',
  'veteran','via','victim','victory','video','view','viewer','village','violate','violation',
  'violence','violent','virtual','virtually','virtue','visible','vision','visit','visitor','visual',
  'vital','vocabulary','voice','volume','voluntary','volunteer','vote','voter','vulnerable',

  // --- W-Z ---
  'wage','wait','wake','walk','wall','wander','want','war','warm','warn',
  'warning','wash','waste','watch','water','wave','way','we','weak','weakness',
  'wealth','wealthy','weapon','wear','weather','web','website','wedding','wednesday','week',
  'weekend','weekly','weigh','weight','welcome','welfare','well','west','western','wet',
  'what','whatever','wheat','wheel','when','whenever','where','whereas','wherever','whether',
  'which','while','whisper','white','who','whoever','whole','whom','whose','why',
  'wide','widely','widespread','wife','wild','wildlife','will','willing','win','wind',
  'window','wine','wing','winner','winter','wire','wisdom','wise','wish','with',
  'withdraw','withdrawal','within','without','witness','woman','wonder','wonderful','wood','wooden',
  'wool','word','work','worker','working','workplace','workshop','world','worldwide','worried',
  'worry','worse','worship','worst','worth','worthy','would','wound','wrap','write',
  'writer','writing','wrong',
  'yard','yeah','year','yell','yellow','yes','yesterday','yet','yield','you',
  'young','youngster','your','yours','yourself','youth','zone',
]);

// ===== CET-6 额外词汇（不在 CET-4 中的高频六级词） =====
const CET6_EXTRA_WORDS = new Set([
  // --- A ---
  'abound','abrupt','abstain','acclaim','accumulation','acquit','acronym','adamant','adept','adjoin',
  'adorn','advent','adversary','adverse','adversity','affiliate','affirm','afflict','affluent','aggravate',
  'agitate','agonize','ailment','akin','alias','alienate','alignment','allegation','allot','allude',
  'allure','alteration','alternate','amalgamate','ambiguity','amen','amend','amiable','ammunition','amnesty',
  'analogy','anarchy','anatomy','anguish','animate','annex','annotate','anomaly','antagonist','anthology',
  'anthropology','antiquated','antique','apartheid','apathetic','apex','appease','append','applaud','appraise',
  'apprehend','apprentice','apt','aquatic','arbitrary','archbishop','ardent','arduous','arid','armor',
  'articulate','artifact','ascend','ascertain','aspire','assail','assault','assent','assertion','assimilate',
  'astound','asylum','atrocity','attain','attic','auction','audacious','audit','augment','authentic',
  'authoritative','autonomous','autonomy','avalanche','avert','avid',

  // --- B ---
  'backlash','baffle','bail','bait','balcony','ballot','bandwidth','bankroll','barren','barricade',
  'batter','bazaar','beckon','befall','befriend','benevolent','benign','besiege','bestow','betterment',
  'bewilder','bias','bicker','bilingual','biography','bizarre','blackmail','blasphemy','bleak','blemish',
  'blockade','blossom','blunder','blunt','blur','boast','bog','bolster','bombardment','bondage',
  'bonfire','botanical','bountiful','boycott','bracket','breach','breadth','breakout','brew','brink',
  'bristle','brittle','broaden','brood','browse','bruise','brutal','budge','buffer','bulge',
  'bulletin','bully','bumpy','bureaucracy','bureaucratic','burgeon','burial','bustle',

  // --- C ---
  'calamity','caliber','calorie','camouflage','candid','canopy','captive','captivity','caravan','cardinal',
  'caretaker','carve','cascade','casualty','catalyst','catastrophe','categorical','cavity','cede','cemetery',
  'census','ceramic','chancellor','chaos','charisma','charitable','charter','cherish','chronic','chronicle',
  'chunk','circuitous','circumscribe','circumvent','civic','clamp','clandestine','clarity','cleanse','clergy',
  'climax','clip','closure','clutter','coalition','coarse','cocktail','coerce','coercion','cognition',
  'coherent','cohesion','collaborate','collaboration','collateral','collide','colloquial','commemorate','commence','commend',
  'commentary','commissioner','commonplace','communal','communion','commute','compact','compartment','compassion','compatible',
  'compendium','compile','complacent','complement','compliance','compliant','compliment','comply','compulsory','concede',
  'conceive','concurrent','condemn','condense','condolence','conducive','confederation','confer','confess','confession',
  'confide','configuration','confinement','confluence','conform','conformity','congregation','conjunction','conscience','conscientious',
  'consecutive','conspicuous','conspiracy','conspire','constrain','constraint','consul','consummate','contagious','contaminate',
  'contemplate','contempt','contend','contentious','contingency','contraband','contraction','contractor','convergence','conversion',
  'conviction','convict','convoy','copyright','cordial','cornerstone','coronary','corporal','corpus','correlate',
  'corrode','cosmopolitan','counsel','counterfeit','counterpart','coup','covenant','coverage','covert','cozy',
  'crater','credential','creed','crescent','cripple','critique','crust','culminate','cumulative','curb',
  'custody','cynical',

  // --- D ---
  'dagger','dazzle','debris','debut','decadent','deception','decree','default','deem','defiance',
  'defiant','deficiency','deficit','defy','degenerate','degradation','degrade','deity','delegate','delusion',
  'demolish','denomination','denounce','depict','deplete','deploy','deportation','depose','depreciate','deprivation',
  'derelict','deride','descend','descendant','deserted','despatch','destitute','detach','detain','detention',
  'deter','deteriorate','detrimental','devastate','deviate','deviation','devise','devout','diagnose','diagnosis',
  'dictator','diffuse','diligent','dilute','dingy','dioxin','dire','discard','discern','discharge',
  'disciple','disclaimer','discord','discrepancy','discretion','discriminate','disdain','disillusion','disintegrate','dismantle',
  'dismay','dispatch','dispel','disperse','displacement','disposition','disproportionate','disregard','disrupt','dissent',
  'dissipate','dissolution','dissolve','dissuade','distinctive','distort','distortion','distract','distress','diverge',
  'divert','doctrine','dogma','doldrums','dominance','donate','doom','dormant','dose','downfall',
  'downturn','draft','drastic','drawback','dread','drought','dubious','dump','durable','dwelling',
  'dwindle','dysfunction',

  // --- E ---
  'earmark','eavesdrop','eccentric','eclipse','ecological','ecology','ecosystem','edict','edifice','editorial',
  'efficacy','ego','eject','elaborate','electrode','elevate','elicit','eligible','eloquent','elude',
  'elusive','emancipate','embargo','embed','emblem','embody','embryo','emigrate','eminence','eminent',
  'empathy','empirical','emulate','enact','enclave','encompass','endow','endowment','enigma','enlighten',
  'ensue','entail','entrepreneur','enumerate','envision','epidemic','epitome','epoch','equate','equilibrium',
  'equity','eradicate','erect','erode','erosion','erratic','escalate','escort','espionage','esteem',
  'eternal','ethic','ethical','etiquette','evacuate','evade','evangelical','evaporate','evasion','evict',
  'evoke','exacerbate','exalt','excerpt','excursion','exemplary','exemplify','exempt','exemption','exhort',
  'exodus','expedient','expedition','expel','expendable','explicit','exposition','extort','extract','extravagant',
  'exuberant',

  // --- F ---
  'fabricate','facet','faction','fallacy','famine','fanatic','farce','fascism','fatigue','fauna',
  'feat','feeble','ferocious','fertile','fervent','fetus','feud','fiasco','fidelity','fiscal',
  'fixture','flair','flaw','fledgling','flicker','flock','flora','flourish','fluctuate','fluency',
  'flux','folklore','foment','foothold','forefront','forensic','foresight','forge','formidable','formulate',
  'forthcoming','fortify','fortress','foster','fragile','fragment','fraternity','fraud','frenzy','frivolous',
  'frugal','fugitive','fulcrum','fumble','futile',

  // --- G ---
  'gasp','gazette','genocide','genre','genuine','glacier','glamour','glare','gleam','glitch',
  'glitter','gloomy','glossary','gorge','gorgeous','governance','gracious','granite','gratitude','grave',
  'gravel','gravity','graze','gregarious','grieve','grim','groove','grope','grotesque','grudge',
  'gruesome','guerrilla','gullible','gust','gut',

  // --- H ---
  'habitat','hail','hallmark','hamper','handicap','harassment','hardline','haven','havoc','hazard',
  'hazardous','headlong','heap','heartfelt','heed','hefty','heir','hemisphere','herald','heresy',
  'heritage','hierarchy','hike','hinder','hindrance','hinge','hoard','hoax','hollow','homage',
  'homogeneous','hospitality','hostage','hover','huddle','humane','humanitarian','humidity','humiliate','hustle',
  'hybrid','hygiene','hypothesis',

  // --- I ---
  'iceberg','icon','ideological','ignite','illuminate','illusion','immerse','imminent','impair','impartial',
  'impeach','impede','impediment','imperative','imperial','impetus','implant','implausible','implore','imposing',
  'impoverish','imprint','improvise','impunity','inaugural','incapable','incarcerate','incidence','incite','inclination',
  'inclusive','incompatible','inconsistency','inconvenience','increment','incur','indictment','indifferent','indigenous','indignant',
  'indispensable','induce','indulge','inert','infamous','inference','infertile','inflict','influx','ingenious',
  'inhibit','initiate','innate','inoculate','insatiable','inscribe','insomnia','instinct','instrumental','insurgent',
  'integral','integrate','integrity','intercept','interim','intermediary','intermittent','interrogate','interstate','intricate',
  'intrinsic','intrude','intuition','inventory','invoke','irate','irony','irrigate',

  // --- J-K ---
  'jargon','jeopardize','jeopardy','jubilant','judiciary','jurisdiction','juxtapose',
  'keynote','kindle','kinship',

  // --- L ---
  'labyrinth','laden','lag','lament','landmark','lapse','latent','lateral','latitude','lavish',
  'lawsuit','layman','lease','legacy','legislation','legislator','legislature','legitimate','lenient','lethal',
  'leverage','levy','liable','liaison','libel','lifelong','ligament','liken','limerick','lineage',
  'linger','litigation','livelihood','loathe','lobby','locale','locomotive','lofty','longitude','loom',
  'loophole','lore','lucrative','luminous','lurk',

  // --- M ---
  'magnify','magnitude','maiden','majestic','malfunction','malice','malicious','malpractice','mandate','maneuver',
  'mania','manifesto','manipulative','marathon','marginal','maritime','massacre','maternal','maven','mediate',
  'medieval','meditate','memoir','menace','mentor','merchandise','merge','meticulous','metropolis','microcosm',
  'migrate','milestone','militia','millennium','mimic','miniature','ministerial','mischief','misconception','misdemeanor',
  'mishap','missile','missionary','mobilize','mockery','molecule','momentum','monastery','monopoly','morale',
  'moratorium','morbid','mortgage','mourn','municipal','muster','mutation','myriad',

  // --- N ---
  'naive','nanny','narcotic','navigate','negotiate','neurological','neutralize','niche','nimble','nocturnal',
  'nominal','nominate','nonfiction','nostalgia','noteworthy','notification','notorious','novice','nuance','nucleus',
  'nurture',

  // --- O ---
  'oath','obituary','oblige','obscene','obscure','obsess','obsolete','obstruct','omen','omit',
  'onset','onslaught','opaque','optimistic','opulent','oracle','ordeal','ordinance','originate','ornament',
  'orthodox','ostensible','oust','outbreak','outburst','outcry','outlaw','outrage','outright','outset',
  'outsmart','outweigh','overhaul','overlap','oversee','oversight','overthrow','overturn','overwhelm','overwhelming',

  // --- P ---
  'pacify','pact','pamphlet','panorama','paradigm','paradox','paramount','pardon','parish','parliament',
  'parole','partisan','pathology','patriarch','patriot','patriotic','patrol','patron','patronage','pave',
  'peculiar','pedagogy','pedestal','pedigree','penalty','pending','penetrate','peninsula','penitentiary','perceive',
  'peril','peripheral','permeate','permissible','perpetual','perpetuate','perplex','persecute','persevere','persona',
  'pervasive','pessimistic','petition','petty','pharmaceutical','philanthropy','pillar','pinnacle','pivotal','placate',
  'plague','plaintiff','plausible','plead','pledge','plenary','pluck','plummet','plunge','plural',
  'polarize','polemical','polish','polynomial','ponder','populous','portfolio','posterity','postulate','potent',
  'practitioner','pragmatic','precaution','precede','precedent','precipitation','preclude','preconception','predecessor','predicament',
  'predominant','preempt','premise','preoccupy','prerequisite','prerogative','prescribe','preside','prestige','prestigious',
  'presume','presumption','prevalent','prey','pristine','privatize','probe','procession','proclaim','procurement',
  'prodigy','profound','profoundly','prohibition','prolific','prolong','prominence','promulgate','prone','propaganda',
  'propel','prophecy','proportional','prosecute','prospective','protagonist','protocol','provenance','proverb','provincial',
  'provisional','proximity','prudent','publicize','punctual','punitive','purge','purport',

  // --- Q-R ---
  'quarantine','quota','quotation',
  'racism','racist','rally','ramification','rampant','ransom','rationale','ravage','realm',
  'reap','reassure','rebuke','recede','recession','recipient','reciprocal','reckless','reckon','reconcile',
  'reconciliation','reconnaissance','referendum','refine','refuge','refute','regime','rehabilitate','rehearsal','reign',
  'reimburse','relentless','relinquish','reluctance','reminiscent','remittance','remnant','renaissance','render','renew',
  'renounce','renovation','renowned','repeal','repel','repercussion','repertoire','replenish','replica','repression',
  'reproach','repudiate','reputable','resentment','residue','resilient','resort','restrain','resumption','retaliate',
  'retention','reticent','retort','retrospect','reunion','revelation','revenue','reverberate','revere','rhetoric',
  'righteous','rigorous','ritual','robust','roster','rotate','rudimentary','rupture','rustic',

  // --- S ---
  'sabbatical','sacred','safeguard','saga','sanitary','sanity','saturate','savvy','scaffold','scam',
  'scandal','scant','scarce','scarcity','scenic','sceptical','scrutiny','secular','sediment','segregate',
  'seminar','sensation','sentiment','serial','sermon','setback','sever','shabby','shrewd','siege',
  'simulate','simultaneous','sinister','skeptic','skull','slack','slaughter','slogan','sluggish','smear',
  'snare','soar','sober','solidarity','solitary','solitude','somber','sophisticated','sovereign','sovereignty',
  'sparse','spawn','specification','specimen','spectacle','speculation','spiral','splendid','spontaneous','sporadic',
  'spotlight','sprint','spur','squadron','squander','stagger','stagnant','stagnate','stalk','stammer',
  'stampede','stance','standpoint','staple','stark','statesman','statute','steadfast','stereotype','sterling',
  'stern','steward','stigma','stimulus','stint','stipulate','stockholder','stout','strand','strangle',
  'strata','strife','stringent','stunning','stunt','subdue','subjective','sublime','subordinate','subscribe',
  'subsidy','substantiate','subtle','subversive','succession','successor','succumb','sue','suffice','summon',
  'superfluous','superintendent','supersede','superstition','supplement','supremacy','surge','surmount','surplus','surrogate',
  'surveillance','susceptible','sustainability','swamp','sway','symmetry','syndrome','syntax',

  // --- T ---
  'taboo','tactic','taint','tangible','tariff','tarnish','tease','tedious','temperament','tempo',
  'tenacious','tenure','terminal','terminate','terrain','testament','texture','theatrical','therapeutic','thesis',
  'threshold','thrive','throttle','tilt','timber','timid','token','toll','topple','torment',
  'torrential','totalitarian','toxic','trademark','trajectory','trample','transaction','transcript','transient','transistor',
  'transplant','trauma','traverse','treason','treatise','trek','tremor','tribunal','tribute','trickle',
  'trigger','trivial','trophy','turbulence','turmoil','turnout','tutor','tyranny',

  // --- U-Z ---
  'ubiquitous','ultimatum','unanimous','uncover','underestimate','underlie','underway','undo','unearth','unilateral',
  'unprecedented','unravel','unveil','upbeat','upbringing','upheaval','uphold','upkeep','upright','uproar',
  'uproot','upsurge','usher','utmost','utter','utterance',
  'vaccinate','validate','vanish','vanguard','vanity','vegetation','vein','velocity','vendor','vengeance',
  'verify','versatile','veto','viable','vibrant','vicinity','vigorous','villain','vindicate','vintage',
  'violate','virgin','virtual','visa','void','volatile','voluntary','vouch','vow',
  'wade','waive','ward','warrant','wary','watershed','weave','wedge','weird','whatsoever',
  'whim','wholesale','wholesome','wield','wilderness','wilt','withhold','withstand','worship','wrath',
  'wreck','wrestle','wrinkle',
  'yearn','zeal','zealous','zenith',
]);

// ===== 合并查找集合 =====
const CET6_ALL = new Set([...CET4_WORDS, ...CET6_EXTRA_WORDS]);

// ===== 词形还原（Lemmatization）=====
// 不规则变形映射表：变形 → { lemma: 原形, form: 词形说明 }
const IRREGULAR_MAP = new Map([
  // be
  ['am',{lemma:'be',form:'第一人称单数现在式'}],['is',{lemma:'be',form:'第三人称单数现在式'}],
  ['are',{lemma:'be',form:'复数现在式'}],['was',{lemma:'be',form:'过去式(单数)'}],
  ['were',{lemma:'be',form:'过去式(复数)'}],['been',{lemma:'be',form:'过去分词'}],['being',{lemma:'be',form:'现在分词'}],
  // have
  ['had',{lemma:'have',form:'过去式/过去分词'}],['has',{lemma:'have',form:'第三人称单数'}],['having',{lemma:'have',form:'现在分词'}],
  // do
  ['did',{lemma:'do',form:'过去式'}],['does',{lemma:'do',form:'第三人称单数'}],['doing',{lemma:'do',form:'现在分词'}],['done',{lemma:'do',form:'过去分词'}],
  // go
  ['went',{lemma:'go',form:'过去式'}],['gone',{lemma:'go',form:'过去分词'}],['goes',{lemma:'go',form:'第三人称单数'}],['going',{lemma:'go',form:'现在分词'}],
  // say
  ['said',{lemma:'say',form:'过去式/过去分词'}],['says',{lemma:'say',form:'第三人称单数'}],['saying',{lemma:'say',form:'现在分词'}],
  // get
  ['got',{lemma:'get',form:'过去式'}],['gotten',{lemma:'get',form:'过去分词'}],['gets',{lemma:'get',form:'第三人称单数'}],['getting',{lemma:'get',form:'现在分词'}],
  // make
  ['made',{lemma:'make',form:'过去式/过去分词'}],['makes',{lemma:'make',form:'第三人称单数'}],['making',{lemma:'make',form:'现在分词'}],
  // know
  ['knew',{lemma:'know',form:'过去式'}],['known',{lemma:'know',form:'过去分词'}],['knows',{lemma:'know',form:'第三人称单数'}],['knowing',{lemma:'know',form:'现在分词'}],
  // think
  ['thought',{lemma:'think',form:'过去式/过去分词'}],['thinks',{lemma:'think',form:'第三人称单数'}],['thinking',{lemma:'think',form:'现在分词'}],
  // take
  ['took',{lemma:'take',form:'过去式'}],['taken',{lemma:'take',form:'过去分词'}],['takes',{lemma:'take',form:'第三人称单数'}],['taking',{lemma:'take',form:'现在分词'}],
  // come
  ['came',{lemma:'come',form:'过去式'}],['comes',{lemma:'come',form:'第三人称单数'}],['coming',{lemma:'come',form:'现在分词'}],
  // see
  ['saw',{lemma:'see',form:'过去式'}],['seen',{lemma:'see',form:'过去分词'}],['sees',{lemma:'see',form:'第三人称单数'}],['seeing',{lemma:'see',form:'现在分词'}],
  // give
  ['gave',{lemma:'give',form:'过去式'}],['given',{lemma:'give',form:'过去分词'}],['gives',{lemma:'give',form:'第三人称单数'}],['giving',{lemma:'give',form:'现在分词'}],
  // find
  ['found',{lemma:'find',form:'过去式/过去分词'}],['finds',{lemma:'find',form:'第三人称单数'}],['finding',{lemma:'find',form:'现在分词'}],
  // tell
  ['told',{lemma:'tell',form:'过去式/过去分词'}],['tells',{lemma:'tell',form:'第三人称单数'}],['telling',{lemma:'tell',form:'现在分词'}],
  // become
  ['became',{lemma:'become',form:'过去式'}],['becomes',{lemma:'become',form:'第三人称单数'}],['becoming',{lemma:'become',form:'现在分词'}],
  // leave
  ['left',{lemma:'leave',form:'过去式/过去分词'}],['leaving',{lemma:'leave',form:'现在分词'}],
  // feel
  ['felt',{lemma:'feel',form:'过去式/过去分词'}],['feels',{lemma:'feel',form:'第三人称单数'}],['feeling',{lemma:'feel',form:'现在分词'}],
  // put
  ['puts',{lemma:'put',form:'第三人称单数'}],['putting',{lemma:'put',form:'现在分词'}],
  // bring
  ['brought',{lemma:'bring',form:'过去式/过去分词'}],['brings',{lemma:'bring',form:'第三人称单数'}],['bringing',{lemma:'bring',form:'现在分词'}],
  // begin
  ['began',{lemma:'begin',form:'过去式'}],['begun',{lemma:'begin',form:'过去分词'}],['begins',{lemma:'begin',form:'第三人称单数'}],['beginning',{lemma:'begin',form:'现在分词'}],
  // keep
  ['kept',{lemma:'keep',form:'过去式/过去分词'}],['keeps',{lemma:'keep',form:'第三人称单数'}],['keeping',{lemma:'keep',form:'现在分词'}],
  // hold
  ['held',{lemma:'hold',form:'过去式/过去分词'}],['holds',{lemma:'hold',form:'第三人称单数'}],['holding',{lemma:'hold',form:'现在分词'}],
  // write
  ['wrote',{lemma:'write',form:'过去式'}],['written',{lemma:'write',form:'过去分词'}],['writes',{lemma:'write',form:'第三人称单数'}],['writing',{lemma:'write',form:'现在分词'}],
  // stand
  ['stood',{lemma:'stand',form:'过去式/过去分词'}],['stands',{lemma:'stand',form:'第三人称单数'}],['standing',{lemma:'stand',form:'现在分词'}],
  // hear
  ['heard',{lemma:'hear',form:'过去式/过去分词'}],['hears',{lemma:'hear',form:'第三人称单数'}],['hearing',{lemma:'hear',form:'现在分词'}],
  // let
  ['lets',{lemma:'let',form:'第三人称单数'}],['letting',{lemma:'let',form:'现在分词'}],
  // mean
  ['meant',{lemma:'mean',form:'过去式/过去分词'}],['means',{lemma:'mean',form:'第三人称单数'}],['meaning',{lemma:'mean',form:'现在分词/名词'}],
  // set
  ['sets',{lemma:'set',form:'第三人称单数'}],['setting',{lemma:'set',form:'现在分词'}],
  // meet
  ['met',{lemma:'meet',form:'过去式/过去分词'}],['meets',{lemma:'meet',form:'第三人称单数'}],['meeting',{lemma:'meet',form:'现在分词/名词'}],
  // run
  ['ran',{lemma:'run',form:'过去式'}],['runs',{lemma:'run',form:'第三人称单数'}],['running',{lemma:'run',form:'现在分词'}],
  // pay
  ['paid',{lemma:'pay',form:'过去式/过去分词'}],['pays',{lemma:'pay',form:'第三人称单数'}],['paying',{lemma:'pay',form:'现在分词'}],
  // sit
  ['sat',{lemma:'sit',form:'过去式/过去分词'}],['sits',{lemma:'sit',form:'第三人称单数'}],['sitting',{lemma:'sit',form:'现在分词'}],
  // speak
  ['spoke',{lemma:'speak',form:'过去式'}],['spoken',{lemma:'speak',form:'过去分词'}],['speaks',{lemma:'speak',form:'第三人称单数'}],['speaking',{lemma:'speak',form:'现在分词'}],
  // read
  ['reads',{lemma:'read',form:'第三人称单数'}],['reading',{lemma:'read',form:'现在分词/名词'}],
  // grow
  ['grew',{lemma:'grow',form:'过去式'}],['grown',{lemma:'grow',form:'过去分词'}],['grows',{lemma:'grow',form:'第三人称单数'}],['growing',{lemma:'grow',form:'现在分词'}],
  // lose
  ['lost',{lemma:'lose',form:'过去式/过去分词'}],['loses',{lemma:'lose',form:'第三人称单数'}],['losing',{lemma:'lose',form:'现在分词'}],
  // spend
  ['spent',{lemma:'spend',form:'过去式/过去分词'}],['spends',{lemma:'spend',form:'第三人称单数'}],['spending',{lemma:'spend',form:'现在分词'}],
  // win
  ['won',{lemma:'win',form:'过去式/过去分词'}],['wins',{lemma:'win',form:'第三人称单数'}],['winning',{lemma:'win',form:'现在分词'}],
  // build
  ['built',{lemma:'build',form:'过去式/过去分词'}],['builds',{lemma:'build',form:'第三人称单数'}],['building',{lemma:'build',form:'现在分词/名词'}],
  // send
  ['sent',{lemma:'send',form:'过去式/过去分词'}],['sends',{lemma:'send',form:'第三人称单数'}],['sending',{lemma:'send',form:'现在分词'}],
  // fall
  ['fell',{lemma:'fall',form:'过去式'}],['fallen',{lemma:'fall',form:'过去分词'}],['falls',{lemma:'fall',form:'第三人称单数'}],['falling',{lemma:'fall',form:'现在分词'}],
  // cut
  ['cuts',{lemma:'cut',form:'第三人称单数'}],['cutting',{lemma:'cut',form:'现在分词'}],
  // teach
  ['taught',{lemma:'teach',form:'过去式/过去分词'}],['teaches',{lemma:'teach',form:'第三人称单数'}],['teaching',{lemma:'teach',form:'现在分词/名词'}],
  // buy
  ['bought',{lemma:'buy',form:'过去式/过去分词'}],['buys',{lemma:'buy',form:'第三人称单数'}],['buying',{lemma:'buy',form:'现在分词'}],
  // lead
  ['led',{lemma:'lead',form:'过去式/过去分词'}],['leads',{lemma:'lead',form:'第三人称单数'}],['leading',{lemma:'lead',form:'现在分词'}],
  // understand
  ['understood',{lemma:'understand',form:'过去式/过去分词'}],['understands',{lemma:'understand',form:'第三人称单数'}],['understanding',{lemma:'understand',form:'现在分词/名词'}],
  // catch
  ['caught',{lemma:'catch',form:'过去式/过去分词'}],['catches',{lemma:'catch',form:'第三人称单数'}],['catching',{lemma:'catch',form:'现在分词'}],
  // choose
  ['chose',{lemma:'choose',form:'过去式'}],['chosen',{lemma:'choose',form:'过去分词'}],['chooses',{lemma:'choose',form:'第三人称单数'}],['choosing',{lemma:'choose',form:'现在分词'}],
  // draw
  ['drew',{lemma:'draw',form:'过去式'}],['drawn',{lemma:'draw',form:'过去分词'}],['draws',{lemma:'draw',form:'第三人称单数'}],['drawing',{lemma:'draw',form:'现在分词/名词'}],
  // break
  ['broke',{lemma:'break',form:'过去式'}],['broken',{lemma:'break',form:'过去分词'}],['breaks',{lemma:'break',form:'第三人称单数'}],['breaking',{lemma:'break',form:'现在分词'}],
  // drive
  ['drove',{lemma:'drive',form:'过去式'}],['driven',{lemma:'drive',form:'过去分词'}],['drives',{lemma:'drive',form:'第三人称单数'}],['driving',{lemma:'drive',form:'现在分词'}],
  // sell
  ['sold',{lemma:'sell',form:'过去式/过去分词'}],['sells',{lemma:'sell',form:'第三人称单数'}],['selling',{lemma:'sell',form:'现在分词'}],
  // show
  ['showed',{lemma:'show',form:'过去式'}],['shown',{lemma:'show',form:'过去分词'}],['shows',{lemma:'show',form:'第三人称单数'}],['showing',{lemma:'show',form:'现在分词'}],
  // eat
  ['ate',{lemma:'eat',form:'过去式'}],['eaten',{lemma:'eat',form:'过去分词'}],['eats',{lemma:'eat',form:'第三人称单数'}],['eating',{lemma:'eat',form:'现在分词'}],
  // fly
  ['flew',{lemma:'fly',form:'过去式'}],['flown',{lemma:'fly',form:'过去分词'}],['flies',{lemma:'fly',form:'第三人称单数'}],['flying',{lemma:'fly',form:'现在分词'}],
  // rise
  ['rose',{lemma:'rise',form:'过去式'}],['risen',{lemma:'rise',form:'过去分词'}],['rises',{lemma:'rise',form:'第三人称单数'}],['rising',{lemma:'rise',form:'现在分词'}],
  // fight
  ['fought',{lemma:'fight',form:'过去式/过去分词'}],['fights',{lemma:'fight',form:'第三人称单数'}],['fighting',{lemma:'fight',form:'现在分词'}],
  // throw
  ['threw',{lemma:'throw',form:'过去式'}],['thrown',{lemma:'throw',form:'过去分词'}],['throws',{lemma:'throw',form:'第三人称单数'}],['throwing',{lemma:'throw',form:'现在分词'}],
  // wear
  ['wore',{lemma:'wear',form:'过去式'}],['worn',{lemma:'wear',form:'过去分词'}],['wears',{lemma:'wear',form:'第三人称单数'}],['wearing',{lemma:'wear',form:'现在分词'}],
  // sing
  ['sang',{lemma:'sing',form:'过去式'}],['sung',{lemma:'sing',form:'过去分词'}],['sings',{lemma:'sing',form:'第三人称单数'}],['singing',{lemma:'sing',form:'现在分词'}],
  // lie (躺)
  ['lay',{lemma:'lie',form:'过去式'}],['lain',{lemma:'lie',form:'过去分词'}],['lies',{lemma:'lie',form:'第三人称单数'}],['lying',{lemma:'lie',form:'现在分词'}],
  // wake
  ['woke',{lemma:'wake',form:'过去式'}],['woken',{lemma:'wake',form:'过去分词'}],['wakes',{lemma:'wake',form:'第三人称单数'}],['waking',{lemma:'wake',form:'现在分词'}],
  // forget
  ['forgot',{lemma:'forget',form:'过去式'}],['forgotten',{lemma:'forget',form:'过去分词'}],['forgets',{lemma:'forget',form:'第三人称单数'}],['forgetting',{lemma:'forget',form:'现在分词'}],
  // hide
  ['hid',{lemma:'hide',form:'过去式'}],['hidden',{lemma:'hide',form:'过去分词'}],['hides',{lemma:'hide',form:'第三人称单数'}],['hiding',{lemma:'hide',form:'现在分词'}],
  // swim
  ['swam',{lemma:'swim',form:'过去式'}],['swum',{lemma:'swim',form:'过去分词'}],['swims',{lemma:'swim',form:'第三人称单数'}],['swimming',{lemma:'swim',form:'现在分词'}],
  // shoot
  ['shot',{lemma:'shoot',form:'过去式/过去分词'}],['shoots',{lemma:'shoot',form:'第三人称单数'}],['shooting',{lemma:'shoot',form:'现在分词'}],
  // steal
  ['stole',{lemma:'steal',form:'过去式'}],['stolen',{lemma:'steal',form:'过去分词'}],['steals',{lemma:'steal',form:'第三人称单数'}],['stealing',{lemma:'steal',form:'现在分词'}],
  // shake
  ['shook',{lemma:'shake',form:'过去式'}],['shaken',{lemma:'shake',form:'过去分词'}],['shakes',{lemma:'shake',form:'第三人称单数'}],['shaking',{lemma:'shake',form:'现在分词'}],
  // blow
  ['blew',{lemma:'blow',form:'过去式'}],['blown',{lemma:'blow',form:'过去分词'}],['blows',{lemma:'blow',form:'第三人称单数'}],['blowing',{lemma:'blow',form:'现在分词'}],
  // strike
  ['struck',{lemma:'strike',form:'过去式/过去分词'}],['strikes',{lemma:'strike',form:'第三人称单数'}],['striking',{lemma:'strike',form:'现在分词'}],
  // bear
  ['bore',{lemma:'bear',form:'过去式'}],['borne',{lemma:'bear',form:'过去分词'}],['bears',{lemma:'bear',form:'第三人称单数'}],['bearing',{lemma:'bear',form:'现在分词'}],
  // spread
  ['spreads',{lemma:'spread',form:'第三人称单数'}],['spreading',{lemma:'spread',form:'现在分词'}],
  // hang
  ['hung',{lemma:'hang',form:'过去式/过去分词'}],['hangs',{lemma:'hang',form:'第三人称单数'}],['hanging',{lemma:'hang',form:'现在分词'}],
  // seek
  ['sought',{lemma:'seek',form:'过去式/过去分词'}],['seeks',{lemma:'seek',form:'第三人称单数'}],['seeking',{lemma:'seek',form:'现在分词'}],
  // sleep
  ['slept',{lemma:'sleep',form:'过去式/过去分词'}],['sleeps',{lemma:'sleep',form:'第三人称单数'}],['sleeping',{lemma:'sleep',form:'现在分词'}],
  // feed
  ['fed',{lemma:'feed',form:'过去式/过去分词'}],['feeds',{lemma:'feed',form:'第三人称单数'}],['feeding',{lemma:'feed',form:'现在分词'}],
  // dig
  ['dug',{lemma:'dig',form:'过去式/过去分词'}],['digs',{lemma:'dig',form:'第三人称单数'}],['digging',{lemma:'dig',form:'现在分词'}],
  // freeze
  ['froze',{lemma:'freeze',form:'过去式'}],['frozen',{lemma:'freeze',form:'过去分词'}],['freezes',{lemma:'freeze',form:'第三人称单数'}],['freezing',{lemma:'freeze',form:'现在分词'}],
  // bite
  ['bit',{lemma:'bite',form:'过去式'}],['bitten',{lemma:'bite',form:'过去分词'}],['bites',{lemma:'bite',form:'第三人称单数'}],['biting',{lemma:'bite',form:'现在分词'}],
  // tear
  ['tore',{lemma:'tear',form:'过去式'}],['torn',{lemma:'tear',form:'过去分词'}],['tears',{lemma:'tear',form:'第三人称单数'}],['tearing',{lemma:'tear',form:'现在分词'}],
  // bend
  ['bent',{lemma:'bend',form:'过去式/过去分词'}],['bends',{lemma:'bend',form:'第三人称单数'}],['bending',{lemma:'bend',form:'现在分词'}],
  // lend
  ['lent',{lemma:'lend',form:'过去式/过去分词'}],['lends',{lemma:'lend',form:'第三人称单数'}],['lending',{lemma:'lend',form:'现在分词'}],
  // shine
  ['shone',{lemma:'shine',form:'过去式/过去分词'}],['shines',{lemma:'shine',form:'第三人称单数'}],['shining',{lemma:'shine',form:'现在分词'}],
  // deal
  ['dealt',{lemma:'deal',form:'过去式/过去分词'}],['deals',{lemma:'deal',form:'第三人称单数'}],['dealing',{lemma:'deal',form:'现在分词'}],
  // bind
  ['bound',{lemma:'bind',form:'过去式/过去分词'}],['binds',{lemma:'bind',form:'第三人称单数'}],['binding',{lemma:'bind',form:'现在分词'}],
  // swear
  ['swore',{lemma:'swear',form:'过去式'}],['sworn',{lemma:'swear',form:'过去分词'}],['swears',{lemma:'swear',form:'第三人称单数'}],['swearing',{lemma:'swear',form:'现在分词'}],
  // forgive
  ['forgave',{lemma:'forgive',form:'过去式'}],['forgiven',{lemma:'forgive',form:'过去分词'}],['forgives',{lemma:'forgive',form:'第三人称单数'}],['forgiving',{lemma:'forgive',form:'现在分词'}],
  // weave
  ['wove',{lemma:'weave',form:'过去式'}],['woven',{lemma:'weave',form:'过去分词'}],['weaves',{lemma:'weave',form:'第三人称单数'}],['weaving',{lemma:'weave',form:'现在分词'}],
  // withdraw
  ['withdrew',{lemma:'withdraw',form:'过去式'}],['withdrawn',{lemma:'withdraw',form:'过去分词'}],['withdraws',{lemma:'withdraw',form:'第三人称单数'}],['withdrawing',{lemma:'withdraw',form:'现在分词'}],
  // overcome
  ['overcame',{lemma:'overcome',form:'过去式'}],['overcomes',{lemma:'overcome',form:'第三人称单数'}],['overcoming',{lemma:'overcome',form:'现在分词'}],
  // undertake
  ['undertook',{lemma:'undertake',form:'过去式'}],['undertaken',{lemma:'undertake',form:'过去分词'}],['undertakes',{lemma:'undertake',form:'第三人称单数'}],['undertaking',{lemma:'undertake',form:'现在分词'}],
  // arise
  ['arose',{lemma:'arise',form:'过去式'}],['arisen',{lemma:'arise',form:'过去分词'}],['arises',{lemma:'arise',form:'第三人称单数'}],['arising',{lemma:'arise',form:'现在分词'}],

  // 常见不规则名词复数
  ['children',{lemma:'child',form:'复数'}],['men',{lemma:'man',form:'复数'}],['women',{lemma:'woman',form:'复数'}],['people',{lemma:'person',form:'复数'}],
  ['mice',{lemma:'mouse',form:'复数'}],['teeth',{lemma:'tooth',form:'复数'}],['feet',{lemma:'foot',form:'复数'}],['geese',{lemma:'goose',form:'复数'}],
  ['oxen',{lemma:'ox',form:'复数'}],['knives',{lemma:'knife',form:'复数'}],['wives',{lemma:'wife',form:'复数'}],['lives',{lemma:'life',form:'复数'}],
  ['leaves',{lemma:'leaf',form:'复数'}],['selves',{lemma:'self',form:'复数'}],['halves',{lemma:'half',form:'复数'}],['wolves',{lemma:'wolf',form:'复数'}],
  ['thieves',{lemma:'thief',form:'复数'}],['shelves',{lemma:'shelf',form:'复数'}],['loaves',{lemma:'loaf',form:'复数'}],['calves',{lemma:'calf',form:'复数'}],

  // 常见不规则形容词比较级/最高级
  ['better',{lemma:'good',form:'比较级'}],['best',{lemma:'good',form:'最高级'}],
  ['worse',{lemma:'bad',form:'比较级'}],['worst',{lemma:'bad',form:'最高级'}],
  ['more',{lemma:'much',form:'比较级'}],['most',{lemma:'much',form:'最高级'}],
  ['less',{lemma:'little',form:'比较级'}],['least',{lemma:'little',form:'最高级'}],
  ['further',{lemma:'far',form:'比较级'}],['furthest',{lemma:'far',form:'最高级'}],['farther',{lemma:'far',form:'比较级'}],['farthest',{lemma:'far',form:'最高级'}],
  ['elder',{lemma:'old',form:'比较级'}],['eldest',{lemma:'old',form:'最高级'}],
]);

/**
 * 获取单词的词形分析信息（结合词库验证）
 * @returns {{ lemma: string|null, form: string|null }}
 *   lemma: 原形（null 表示本身即原形或无法识别）
 *   form:  词形说明
 */
function getWordMorphInfo(word) {
  const w = word.toLowerCase().trim();

  // 1. 不规则映射（精确匹配，最高优先级）
  if (IRREGULAR_MAP.has(w)) {
    const info = IRREGULAR_MAP.get(w);
    return { lemma: info.lemma, form: info.form };
  }

  // 2. 如果本身就在词库中，视为原形
  if (CET6_ALL.has(w) || CET4_WORDS.has(w)) {
    return { lemma: null, form: null };
  }

  // 3. 规则变形推导：生成候选 { lemma, form } 列表，选第一个在词库中的
  const candidates = getRegularCandidates(w);
  for (const c of candidates) {
    if (CET4_WORDS.has(c.lemma) || CET6_ALL.has(c.lemma)) {
      return c;
    }
  }

  // 4. 都不在词库中，返回最可能的候选（仍然提供词形信息）
  if (candidates.length > 0) {
    return candidates[0];
  }

  return { lemma: null, form: null };
}

/**
 * 生成规则变形的候选原形列表，按可能性排序
 * 每个候选: { lemma: string, form: string }
 */
function getRegularCandidates(w) {
  const results = [];

  // -ied → -y: studied → study
  if (w.endsWith('ied') && w.length > 4) {
    results.push({ lemma: w.slice(0, -3) + 'y', form: '过去式/过去分词' });
  }

  // -ing: making → make, running → run, playing → play
  if (w.endsWith('ing') && w.length > 4) {
    const base = w.slice(0, -3);
    // 双写: running → run
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      results.push({ lemma: base.slice(0, -1), form: '现在分词' });
    }
    results.push({ lemma: base + 'e', form: '现在分词' });  // making → make
    results.push({ lemma: base, form: '现在分词' });         // playing → play (will be play + ing → playing)
  }

  // -ed: loved → love, played → play, stopped → stop
  if (w.endsWith('ed') && w.length > 3 && !w.endsWith('eed')) {
    const base = w.slice(0, -2);
    // 双写: stopped → stop
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      results.push({ lemma: base.slice(0, -1), form: '过去式/过去分词' });
    }
    results.push({ lemma: w.slice(0, -1), form: '过去式/过去分词' });  // loved → love (去 d)
    results.push({ lemma: base, form: '过去式/过去分词' });            // played → play (去 ed)
  }

  // -ies → -y: studies → study
  if (w.endsWith('ies') && w.length > 4) {
    results.push({ lemma: w.slice(0, -3) + 'y', form: '第三人称单数/复数' });
  }

  // -es: boxes → box, watches → watch
  if ((w.endsWith('ses') || w.endsWith('xes') || w.endsWith('zes') || w.endsWith('ches') || w.endsWith('shes')) && w.length > 4) {
    results.push({ lemma: w.slice(0, -2), form: '第三人称单数/复数' });
  }

  // -ier → -y: happier → happy
  if (w.endsWith('ier') && w.length > 4) {
    results.push({ lemma: w.slice(0, -3) + 'y', form: '比较级' });
  }
  // -iest → -y: happiest → happy
  if (w.endsWith('iest') && w.length > 5) {
    results.push({ lemma: w.slice(0, -4) + 'y', form: '最高级' });
  }

  // -er: taller → tall, bigger → big, larger → large
  if (w.endsWith('er') && w.length > 3 && !w.endsWith('eer') && !w.endsWith('ier')) {
    const base = w.slice(0, -2);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      results.push({ lemma: base.slice(0, -1), form: '比较级' });
    }
    results.push({ lemma: w.slice(0, -1), form: '比较级' });  // larger → large
    results.push({ lemma: base, form: '比较级' });             // taller → tall
  }

  // -est: tallest → tall, biggest → big
  if (w.endsWith('est') && w.length > 4 && !w.endsWith('iest')) {
    const base = w.slice(0, -3);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      results.push({ lemma: base.slice(0, -1), form: '最高级' });
    }
    results.push({ lemma: w.slice(0, -2), form: '最高级' });  // largest → large
    results.push({ lemma: base, form: '最高级' });             // tallest → tall
  }

  // -ily → -y: happily → happy
  if (w.endsWith('ily') && w.length > 4) {
    results.push({ lemma: w.slice(0, -3) + 'y', form: '副词' });
  }
  // -ly: quickly → quick
  if (w.endsWith('ly') && w.length > 3 && !w.endsWith('ily')) {
    results.push({ lemma: w.slice(0, -2), form: '副词' });
  }

  // -iness → -y: happiness → happy
  if (w.endsWith('iness') && w.length > 6) {
    results.push({ lemma: w.slice(0, -5) + 'y', form: '名词' });
  }
  // -ness: darkness → dark
  if (w.endsWith('ness') && w.length > 5) {
    results.push({ lemma: w.slice(0, -4), form: '名词' });
  }

  // -ment: achievement → achieve
  if (w.endsWith('ment') && w.length > 5) {
    results.push({ lemma: w.slice(0, -4), form: '名词' });
  }

  // -s (一般复数/第三人称): dogs → dog
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && w.length > 2) {
    results.push({ lemma: w.slice(0, -1), form: '复数/第三人称单数' });
  }

  return results.filter(c => c.lemma && c.lemma.length >= 2);
}

/**
 * 将单词还原为可能的原形（词干/词元）
 * 按优先级尝试：不规则表 → 规则去后缀
 * @returns {string[]} 候选原形列表（含原词）
 */
function getLemmas(word) {
  const w = word.toLowerCase().trim();
  if (w.length < 2) return [w];

  const candidates = new Set([w]);

  // 1. 不规则映射
  if (IRREGULAR_MAP.has(w)) {
    candidates.add(IRREGULAR_MAP.get(w).lemma);
  }

  // 2. 规则变形还原
  // -ing: running→run, making→make, playing→play
  if (w.endsWith('ing') && w.length > 4) {
    const base = w.slice(0, -3);
    candidates.add(base);             // running → runn → run (will be caught by double letter)
    candidates.add(base + 'e');       // making → mak + e → make
    // 双写辅音: running → run
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.add(base.slice(0, -1));
    }
  }

  // -ed: played→play, loved→love, stopped→stop
  if (w.endsWith('ed') && w.length > 3) {
    const base = w.slice(0, -2);
    candidates.add(base);             // played → play... no, played → play + ed
    candidates.add(w.slice(0, -1));   // loved → love (remove d)
    // 双写: stopped → stop
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.add(base.slice(0, -1));
    }
  }
  // -ied: studied→study
  if (w.endsWith('ied') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');
  }

  // -s / -es: dogs→dog, boxes→box, babies→baby, goes→go
  if (w.endsWith('ies') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');   // babies → baby
  } else if (w.endsWith('ses') || w.endsWith('xes') || w.endsWith('zes') || w.endsWith('ches') || w.endsWith('shes')) {
    candidates.add(w.slice(0, -2));          // boxes → box, watches → watch
  } else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 2) {
    candidates.add(w.slice(0, -1));          // dogs → dog
  }

  // -er / -est: bigger→big, happier→happy, larger→large
  if (w.endsWith('er') && w.length > 3) {
    candidates.add(w.slice(0, -2));          // taller → tall
    candidates.add(w.slice(0, -1));          // larger → large (remove r)
    const base = w.slice(0, -2);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.add(base.slice(0, -1));     // bigger → big
    }
  }
  if (w.endsWith('ier') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');   // happier → happy
  }
  if (w.endsWith('est') && w.length > 4) {
    candidates.add(w.slice(0, -3));          // tallest → tall
    candidates.add(w.slice(0, -2));          // largest → large... no
    const base = w.slice(0, -3);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.add(base.slice(0, -1));     // biggest → big
    }
  }
  if (w.endsWith('iest') && w.length > 5) {
    candidates.add(w.slice(0, -4) + 'y');   // happiest → happy
  }

  // -ly: quickly→quick, happily→happy, possibly→possible
  if (w.endsWith('ly') && w.length > 3) {
    candidates.add(w.slice(0, -2));          // quickly → quick
  }
  if (w.endsWith('ily') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');   // happily → happy
  }

  // -tion / -sion → -t / -s / -te: production→produce (limited, just add base)
  // -ment: achievement→achieve
  if (w.endsWith('ment') && w.length > 5) {
    candidates.add(w.slice(0, -4));          // achievement → achieve... not exact but worth trying
  }

  // -ness: happiness→happy, darkness→dark
  if (w.endsWith('ness') && w.length > 5) {
    candidates.add(w.slice(0, -4));
  }
  if (w.endsWith('iness') && w.length > 6) {
    candidates.add(w.slice(0, -5) + 'y');   // happiness → happy
  }

  return [...candidates].filter(c => c.length >= 2);
}

/**
 * 检查单词（含词形变化）是否在给定词集中
 */
function isWordInSet(word, wordSet) {
  const lemmas = getLemmas(word);
  return lemmas.some(l => wordSet.has(l));
}

/**
 * 获取单词所属的 CET 等级（支持词形还原）
 * @returns {'cet4'|'cet6'|'beyond'}
 */
function getWordCETLevel(word) {
  const w = word.toLowerCase().trim();
  if (isWordInSet(w, CET4_WORDS)) return 'cet4';
  if (isWordInSet(w, CET6_EXTRA_WORDS)) return 'cet6';
  return 'beyond';
}

/**
 * 判断单词是否超出用户设定的目标等级（支持词形还原）
 * @param {string} word
 * @param {'cet4'|'cet6'|'none'} targetLevel
 * @returns {boolean} true 表示超纲
 */
function isOutOfScope(word, targetLevel) {
  if (!targetLevel || targetLevel === 'none') return false;
  const w = word.toLowerCase().trim();
  if (targetLevel === 'cet4') return !isWordInSet(w, CET4_WORDS);
  if (targetLevel === 'cet6') return !isWordInSet(w, CET6_ALL);
  return false;
}

/**
 * 批量检查一组单词中的超纲词
 * @param {string[]} words
 * @param {'cet4'|'cet6'|'none'} targetLevel
 * @returns {Set<string>} 超纲词集合
 */
function getOutOfScopeWords(words, targetLevel) {
  if (!targetLevel || targetLevel === 'none') return new Set();
  const result = new Set();
  for (const word of words) {
    if (isOutOfScope(word, targetLevel)) {
      result.add(word.toLowerCase().trim());
    }
  }
  return result;
}

module.exports = {
  CET4_WORDS,
  CET6_EXTRA_WORDS,
  CET6_ALL,
  getWordCETLevel,
  getWordMorphInfo,
  isOutOfScope,
  getOutOfScopeWords,
};
