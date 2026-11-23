/* =========================================================
   御前女官 · 三十日翻案录
   单页文字游戏 / 原生 JS / 无依赖
   ========================================================= */

'use strict';

(() => {
  const MAX_DAY = 30;
  const SAVE_KEY = 'yuqian_nv_guan_save_v1';
  const GALLERY_KEY = 'yuqian_nv_guan_endings_v1';

  const RANKS = [
    { name: '抄录女史', salary: 5, note: '典簿司最末一等，抄书、校字、守值房。' },
    { name: '掌籍女史', salary: 8, note: '掌一库文书，能调旧档，也能带两个书吏。' },
    { name: '典簿司掌事', salary: 12, note: '掌司之下，典簿司的文书都要过你的手。' },
    { name: '御前女官', salary: 20, note: '御前奏对，掌一司印信。' }
  ];

  const CLUES = {
    script: {
      label: '罪籍画押',
      title: '断笔',
      sub: '罪籍上的画押，少了一笔',
      text: '罪籍末尾的“因”字，最后一笔是断的。姐姐写这个字从来连笔。她说断笔像刀口，不吉利。这不是她画的押。',
      source: '查档·罪籍（才学 30）'
    },
    time: {
      label: '提审时辰',
      title: '她不在堂上',
      sub: '提审簿与狱门簿对不上',
      text: '提审簿记：亥时三刻，沈兰因上堂画押。狱门簿记：同一时刻，沈氏未出狱门。她根本没有上过堂。',
      source: '查档·提审簿（人望 25，或老周关系 2）'
    },
    ledger: {
      label: '军粮损耗',
      title: '新墨',
      sub: '三千石损耗，墨色比正文新',
      text: '军粮册上“损耗三千石”一行，墨色浮在纸面，比正文新。户部回执却写“足额运抵”。这本账，是后来改的。',
      source: '查档·军粮册（才学 45）'
    },
    silver: {
      label: '汇通号',
      title: '同一笔钱',
      sub: '修河银与军粮款同一天入账',
      text: '汇通号的票根上，修河银八千两与军粮款在同一天入账，经手人写的是“曹府管事”。曹弼管着户部粮仓。',
      source: '查档·汇通号（手段 30，或陆知微关系 3）'
    },
    letter: {
      label: '旧档夹页',
      title: '姐姐的半页纸',
      sub: '《河工志》夹层里的字',
      text: '《河工志》夹层里藏着半页纸，是姐姐的字：“粮未失，粮在曹家仓。郑铨分三成。若我有事，找顾司籍。”',
      source: '查档·旧档库（信任 50，或顾清和关系 4）'
    },
    witness: {
      label: '通州车马',
      title: '换粮的人',
      sub: '车夫看见粮袋在码头被换',
      text: '通州车夫说，粮袋在码头被换过。新袋底下印着“曹”字仓号。他不敢画押，只肯口述。',
      source: '查档·通州车马簿（人望 40，或裴小满关系 3）'
    }
  };

  const CLUE_IDS = ['script', 'time', 'ledger', 'silver', 'letter', 'witness'];

  const ARCHIVES = [
    {
      id: 'script',
      name: '罪籍',
      desc: '姐姐的画押，就在最后一页。',
      reqText: '才学 30',
      req: (s) => s.stats.talent >= 30,
      fatigue: 10,
      risk: 2
    },
    {
      id: 'time',
      name: '提审簿',
      desc: '上堂的时辰，与狱门簿对一对。',
      reqText: '人望 25 / 老周 2',
      req: (s) => s.stats.popularity >= 25 || s.relations.zhou >= 2,
      fatigue: 10,
      risk: 4
    },
    {
      id: 'ledger',
      name: '军粮册',
      desc: '三千石损耗，墨色不太对。',
      reqText: '才学 45',
      req: (s) => s.stats.talent >= 45,
      fatigue: 14,
      risk: 5
    },
    {
      id: 'silver',
      name: '汇通号票根',
      desc: '钱从哪里来，又到哪里去。',
      reqText: '手段 30 / 陆知微 3',
      req: (s) => s.stats.scheme >= 30 || s.relations.lu >= 3,
      fatigue: 12,
      risk: 7
    },
    {
      id: 'letter',
      name: '旧档库',
      desc: '姐姐藏东西的地方。',
      reqText: '信任 50 / 顾清和 4',
      req: (s) => s.stats.trust >= 50 || s.relations.gu >= 4,
      fatigue: 14,
      risk: 8
    },
    {
      id: 'witness',
      name: '通州车马簿',
      desc: '那批粮，在码头换过袋子。',
      reqText: '人望 40 / 裴小满 3',
      req: (s) => s.stats.popularity >= 40 || s.relations.pei >= 3,
      fatigue: 12,
      risk: 6
    }
  ];

  const SOCIALS = {
    gu: {
      name: '顾清和',
      role: '典簿司掌司',
      desc: '你的上官。她曾保过姐姐，也亲手签了姐姐的贬书。',
      effect: '信任 +4 · 人望 +1',
      lines: [
        '顾清和没有抬头，只把一盏冷茶推到你面前。“你姐姐当年，也坐这个位置。”',
        '你在值房外等到亥时。顾清和出来时，只说了一句：“别查得太快。”',
        '顾清和翻着你誊的折子，忽然问：“你觉得，军粮是谁动的？”她没有等你答。'
      ]
    },
    pei: {
      name: '裴小满',
      role: '典簿司书吏',
      desc: '十九岁，话多，父亲在通州仓做过吏。她怕事，但不坏。',
      effect: '人望 +5 · 心情 +2',
      lines: [
        '裴小满把半块桂花糕塞给你，小声说：“我爹以前在通州仓。他说，粮袋换过，就不干净了。”',
        '裴小满替你挡了掌籍女史的一顿骂，转头冲你笑：“你欠我一顿酒。”',
        '你和裴小满蹲在廊下分一碗热汤。她说她想攒钱赎身，出去开个书铺。'
      ]
    },
    lu: {
      name: '陆知微',
      role: '刑部主事',
      desc: '二十六岁，谨慎，和曹弼有旧怨。他帮你，但不会替你出头。',
      effect: '手段 +4 · 才学 +1',
      lines: [
        '陆知微在宫门外递给你一张纸条：“汇通号，八月十七，曹。”他说完就走。',
        '陆知微教你认票号的暗记：“看角上的朱点。三颗，是官银；一颗，是私账。”',
        '陆知微听完你的推断，沉默很久：“你姐姐比你稳。可惜稳的人，先死。”'
      ]
    },
    zhou: {
      name: '老周',
      role: '刑部狱卒',
      desc: '五十岁，受过姐姐一碗药。他不敢作证，但肯递话。',
      effect: '人望 +2 · 心情 +1',
      lines: [
        '老周把一壶浊酒推给你：“你姐姐在里头，没喊过冤。她只让我告诉你，查粮。”',
        '老周说，姐姐那夜被提审，可狱门没开。“我守的门。我认得她的脚步声。”',
        '老周把一小块炭塞给你：“她画的押，是别人按着她的手画的。我看见了。”'
      ]
    }
  };

  const WORK_LINES = [
    [
      '你在西廊抄了一日《河工志》副本。墨冻得发涩，指尖裂了口子。',
      '你替掌籍女史校了三卷粮册，把错漏一一贴在签上。值房里只剩你一盏灯。',
      '你守了一夜值房。更鼓敲过三遍，档案库的方向一直有脚步声。',
      '你把旧档按年月重新排了一遍。灰尘呛得你咳嗽，但有几卷账册的位置不对。',
      '你替顾清和誊清一份奏稿。写到“军粮”二字时，她停笔看了你一眼。'
    ],
    [
      '你掌了一库文书，底下两个书吏等你分派。你第一次觉得，权力是有重量的。',
      '你校完一册军粮回执，发现户部的印章比正文晚了三天。你记在心里。',
      '你带人清点档案库，故意把最里面那排柜子留到最后。',
      '你替顾清和挡了一桩麻烦：刑部来调卷，你让他们按规矩等了三日。',
      '你在掌籍册上写下自己的名字。笔尖顿了一下，还是落下去了。'
    ],
    [
      '你主持了一日的誊录。四个书吏站在你面前，等你分派。你忽然想起姐姐当年也是这样。',
      '你把军粮案的卷宗单独锁进一间库房，钥匙挂在腰间，走一步响一声。',
      '你在掌司值房坐了一日。来递话的人很多，没有一个人提姐姐的名字。',
      '你签了一份驳回刑部调卷的呈文。签完手在抖，但字很稳。',
      '你第一次以掌事身份进御前奏对。隔着屏风，你听见有人念出“沈兰因”三个字。'
    ]
  ];

  const STUDY_LINES = [
    '你借来《大胤律·职官》与《刑案则例》，就着一盏小灯读到亥时。',
    '你练了一夜小楷，临的是姐姐留下的旧帖。写到“因”字时，笔尖停了很久。',
    '你去司经局蹭了一堂讲律。老学士说：“案卷会骗人，墨不会。”',
    '你把军粮转运的旧例抄了一遍，才发现“损耗”二字，从来不是一个人能定的。',
    '你对着灯看水印。看得久了，纸上的纤维像一张网。'
  ];

  const REST_LINES = [
    '你难得歇了一日。值房外的银杏落了一地，没人来叫你。',
    '你睡到日上三竿，梦里全是翻纸的声音。醒来时，枕边有一小块桂花糕。',
    '你坐在廊下晒了一会儿太阳。宫里的人走来走去，没人多看你一眼。',
    '你烧了一壶热水，把冻裂的手泡了很久。今天不想案子。',
    '你早早吹了灯。黑暗里，你听见档案库的门响了一下，又归于安静。'
  ];

  const DAY_DATES = [
    '十月初七', '十月初八', '十月初九', '十月初十', '十月十一',
    '十月十二', '十月十三', '十月十四', '十月十五', '十月十六',
    '十月十七', '十月十八', '十月十九', '十月二十', '十月廿一',
    '十月廿二', '十月廿三', '十月廿四', '十月廿五', '十月廿六',
    '十月廿七', '十月廿八', '十月廿九', '十月三十', '十一月初一',
    '十一月初二', '十一月初三', '十一月初四', '十一月初五', '十一月初六'
  ];

  const DAY_FLAVOR = [
    '霜降第三天，宫墙下的银杏开始黄了。你第一次走进御前典簿司，鞋底沾着露水。',
    '值房的窗纸破了一角。风从那里进来，吹得案上的罪籍自己翻了一页。',
    '天阴。档案库里有霉味，混着旧墨和冷灰的气息。',
    '宫里传膳的钟敲过两遍。你才想起自己一日没吃东西。',
    '下了一场小雨。宫道上的砖洗得发亮，像刚磨过的墨。',
    '顾清和一日没有出值房。门口送进去的茶，原样端了出来。',
    '裴小满偷偷告诉你：刑部今日又提了一个仓吏，没审就放了。',
    '风大。档案库的窗子关不严，纸页响了一夜。',
    '你在宫门外看见一辆青布马车。车帘上绣着一个“曹”字。',
    '第九日。还有二十一天。你开始记得住值房里每一块砖的裂纹。',
    '掌籍女史把一摞旧档推给你，说：“这些没用了，烧了吧。”你没烧。',
    '今日是宫里发冬衣的日子。你领到一件半旧的棉袍，袖口磨得发白。',
    '陆知微托人带话：曹弼最近常去汇通号，每次都不走正门。',
    '老周说，姐姐在狱里病了。不重，但一直咳。',
    '你梦见姐姐站在档案库最深的那排柜子前，回头对你说：别查我，查粮。',
    '冬至将近。宫里开始挂红。那些红，和你没有关系。',
    '顾清和忽然问你：“如果翻案要拿一个人去换，你换不换？”',
    '裴小满生日。她偷偷在值房煮了一碗面，分了你半碗。',
    '刑部来调卷。带头的官员看了你一眼，像在看一个死人。',
    '你在旧档里翻到姐姐的字。只有一行：“青梧还小，别让她进宫。”',
    '第二十一日。你的名字终于被人叫对了：沈掌事。',
    '曹弼的轿子今日从典簿司门前过。帘子掀了一角。',
    '档案库漏雨。你带人搬了一夜卷宗，最里面那箱《河工志》却不见了。',
    '你去狱里看姐姐。隔着栅栏，她只说了一句：“别变成他们。”',
    '第二十五日。宫里开始传秋决的名单。',
    '你在值房坐到天亮。案上摆着六份卷宗，像六块石头。',
    '顾清和把她的印信放在你面前，说：“想清楚了。”',
    '裴小满替你打听好了：三司会审在明日午后，郑铨会到场。',
    '第二十九日。你把该烧的都烧了，该留的都留了。',
    '十一月初六。天还没亮，宫门外已经有人在扫雪。'
  ];

  const ENDINGS = {
    clear_leave: {
      kicker: '上上签',
      title: '翻案 · 离宫',
      sub: '你救了她，也放过了自己。',
      body: [
        '三司会审那日，你把六份卷宗一件一件摆上公案。断笔的画押，对不上的时辰，新墨的损耗，汇通号的票根，车夫的口供，还有姐姐藏在《河工志》里的半页纸。',
        '曹弼先是否认，后来开始推诿。郑铨坐在上首，一直没有说话。直到你把那半页纸念出来，他才抬眼看你。那一眼很长，像在记住你的脸。',
        '案子翻了。姐姐从狱里出来时，瘦得只剩一把骨头。她没有哭，只抬手把你鬓边的碎发别到耳后。',
        '御前女官的位置空了出来。顾清和问你愿不愿意接。你看着案上那方印，想起姐姐说的“别变成他们”。',
        '你辞了官，带姐姐离开京城。你们在城南开了一间小书塾，教女孩识字、抄书、打算盘。有人问你从前做什么，你只说：抄过几年档案。'
      ],
      last: '那支御笔，你留在了典簿司的案上。笔很轻，轻得像从来没有握过。'
    },
    clear_stay: {
      kicker: '上签',
      title: '掌印',
      sub: '你赢了，也成了规矩的一部分。',
      body: [
        '三司会审那日，你把证据一件一件摆上公案。曹弼被当场拿下，郑铨被勒令闭门待勘。姐姐从狱里出来时，天已经黑了。',
        '你没有跟她走。御前女官的位置空着，顾清和把印信推到你面前，说：“你比我有用。”',
        '你接了印。第一件事，是把军粮账册的旧例重抄一遍，所有损耗都要有第二个人画押。第二件事，是把姐姐的名字从罪籍上划掉。',
        '后来你升了掌印。典簿司的文书都要过你的手，连郑铨见你也要先递帖子。你成了这宫里少数能说“不”的人。',
        '姐姐离开京城那天，你没有去送。她托人带来一封信，只有一行字：青梧，别变成他们。',
        '你把信锁进最深的柜子。每年冬至，你会打开一次，看完再锁上。'
      ],
      last: '你保住了她，也保住了自己。只是有时候，你分不清这两件事是不是同一件。'
    },
    deal: {
      kicker: '下签',
      title: '投靠',
      sub: '你保住了她的命，也保住了自己的位置。',
      body: [
        '你在会审前一夜去了郑铨的府邸。门房没有问你名字，直接把你领进书房。',
        '郑铨听完你的条件，笑了一下：“沈女史，你比你姐姐聪明。”',
        '第二日，三司会审如期举行。你只呈上了两份无关紧要的旧档。曹弼被罚俸，姐姐改判流放三千里。',
        '你升了掌籍，后来又升了掌事。郑铨没有亏待你。宫里的人都说，沈家二姑娘是个识时务的。',
        '姐姐离京那日，你去送了。她戴着枷，看了你很久，最后只说：“回去吧。”',
        '你站在城门口，直到囚车看不见。风很大，你把领口拢紧，转身回了宫。'
      ],
      last: '你保住了她的命。只是每年冬至，你都会梦见那半页纸，在火里烧不干净。'
    },
    seal: {
      kicker: '下下签',
      title: '封存',
      sub: '钥匙在你手里，你从来没有再打开。',
      body: [
        '会审前一夜，你把六份卷宗搬到值房，一份一份投进火盆。',
        '纸烧得很慢。你看见姐姐的字在火里卷起来，像一只不肯飞走的鸟。',
        '第二日，三司会审维持原判。姐姐没有等到冬至。',
        '你升了掌籍。顾清和没有问你为什么，只把你的名字写进册子，笔尖顿了很久。',
        '后来你管了档案库。姐姐的卷宗被锁进最里面那排柜子，编号“承平二十七年·军粮案·沈氏”。',
        '钥匙一直挂在你腰间。你每天带着它走过长廊，听见它响，却从来没有打开过那扇门。'
      ],
      last: '你活了下来。只是从那以后，你再也没有抄过“因”字。'
    },
    executed: {
      kicker: '终局',
      title: '秋决',
      sub: '你没能救她。',
      body: [
        '十一月初六，天阴。秋决的名单贴在宫门外，沈兰因三个字排在第三个。',
        '你站在人群里，手里攥着几页没有递出去的纸。纸上是你看过的疑点，零碎、单薄，救不了一个人。',
        '囚车从你面前过。姐姐看见了你，摇了摇头。她没有喊冤，也没有哭。',
        '午时三刻，鼓响。你闭上眼睛，听见人群散去的脚步声。',
        '后来你被遣出典簿司。收拾东西时，你在姐姐的旧案里找到一支笔。笔杆上刻着一个小小的“兰”字。',
        '你带着那支笔回了家。再也没有进过宫。'
      ],
      last: '你活了下来，可她没能。'
    },
    dismissed: {
      kicker: '终局',
      title: '革职',
      sub: '你连她的卷宗都没能再看一眼。',
      body: [
        '你的考功没有过。掌司在册子上批了四个字：不堪任用。',
        '你被收回腰牌，赶出典簿司。值房里的东西不多，一支笔，两件旧衣，半块没吃完的糕。',
        '你托人去刑部打听姐姐的消息，没有人肯收你的钱。',
        '十一月初六，秋决如期。你没有去刑场。你坐在城南的客栈里，听了一下午的雨。',
        '后来你听说，顾清和替姐姐收了尸。你去谢她，她不见。',
        '你在城外的乱葬岗找到一座新坟，没有碑。你蹲下来，把一支笔埋在土里。'
      ],
      last: '你连她的名字都没能保住。'
    },
    silenced: {
      kicker: '终局',
      title: '灭口',
      sub: '最后看见的，是档案库的灯。',
      body: [
        '你查得太深了。深到有人开始害怕。',
        '那夜你从档案库出来，廊下没有灯。你听见身后有脚步声，很轻，像纸落在地上。',
        '你来不及回头。一只手捂住你的口鼻，另一只手按住你的肩。帕子上有一股甜腻的香气。',
        '你最后看见的，是档案库窗纸上的一点灯光。那盏灯是你自己点的，还没有灭。',
        '第二日，典簿司报了一个“暴病”。顾清和来看过你，站了很久，没有说话。',
        '姐姐在狱中等到冬至。她没有等到你。'
      ],
      last: '你成了卷宗里的一行小字：沈青梧，暴病，年十八。'
    },
    ill: {
      kicker: '终局',
      title: '灯枯',
      sub: '你倒在案上，墨迹未干。',
      body: [
        '你已经不记得自己多少天没有好好睡过。',
        '先是手抖，后来是发热，再后来，你看着案上的字，认不出它们的意思。',
        '那夜你伏在案上，想歇一会儿。案头还摊着军粮册，墨迹没有干。',
        '裴小满第二日来叫你，推开门，看见你趴在案上，手里还攥着笔。',
        '你被抬回住处。太医来看过，说是劳瘵，要静养。可你没有三十天。',
        '十一月初六，你从昏迷中醒来。窗外有人在扫雪。你不知道姐姐怎么样了。'
      ],
      last: '你把自己也写进了案子，只是没有人来翻。'
    },
    forgery: {
      kicker: '终局',
      title: '反坐',
      sub: '你伪造的那一页，成了钉死她的最后一颗钉子。',
      body: [
        '你仿了一份提审手令。笔迹、印色、纸张，你练了很久，本以为天衣无缝。',
        '可你忘了，典簿司的旧档都有水印。对着灯一看，你那张纸太新了。',
        '刑部的人来得很快。他们没有审你，只把那张纸和姐姐的罪籍放在一起。',
        '“沈青梧，伪造官文书，意图干扰秋审。”',
        '姐姐在狱里听说了这件事。她托老周带出一句话：你怎么这么傻。',
        '十一月初六，秋决名单上多了一个名字。不是你的。你被押在刑场外，听完了那三声鼓。'
      ],
      last: '你想救她，最后却亲手把她送上了刑场。'
    }
  };

  let state = null;
  let gameScreen = 'start';
  let modalQueue = [];
  let modalBusy = false;
  let modalClosing = false;
  let toastTimer = null;

  const $app = () => document.getElementById('app');
  const $modal = () => document.getElementById('modal-root');
  const $toast = () => document.getElementById('toast');

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const chance = (p) => Math.random() < p;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function newGame(name) {
    return {
      version: 1,
      name: name || '沈青梧',
      day: 1,
      rank: 0,
      silver: 20,
      stats: {
        talent: 22,
        popularity: 12,
        trust: 18,
        reputation: 50,
        scheme: 8,
        fatigue: 8,
        mood: 48,
        risk: 0
      },
      clues: {
        script: false,
        time: false,
        ledger: false,
        silver: false,
        letter: false,
        witness: false
      },
      relations: { gu: 1, pei: 0, lu: 0, zhou: 0 },
      flags: {
        introSeen: false,
        forged: false,
        warned: false,
        metZheng: false,
        finalChoice: ''
      },
      seenEvents: [],
      log: [],
      ended: false,
      ending: null
    };
  }

  function applyMods(mods) {
    if (!state || !mods) return;
    const keys = ['talent', 'popularity', 'trust', 'reputation', 'scheme', 'fatigue', 'mood', 'risk'];
    keys.forEach((key) => {
      if (typeof mods[key] === 'number') {
        state.stats[key] = clamp(state.stats[key] + mods[key], 0, 100);
      }
    });
    if (typeof mods.silver === 'number') {
      state.silver = Math.max(0, state.silver + mods.silver);
    }
    if (mods.rel) {
      Object.keys(mods.rel).forEach((key) => {
        if (state.relations[key] === undefined) state.relations[key] = 0;
        state.relations[key] = clamp(state.relations[key] + mods.rel[key], 0, 5);
      });
    }
  }

  function addLog(text, type) {
    if (!state) return;
    state.log.push({ day: state.day, text, type: type || '' });
    if (state.log.length > 90) state.log.shift();
  }

  function clueCount() {
    if (!state) return 0;
    return CLUE_IDS.filter((id) => state.clues[id]).length;
  }

  function addClue(id) {
    if (!state || state.clues[id]) return false;
    state.clues[id] = true;
    addLog(CLUES[id].text, 'clue');
    showToast('查得线索：' + CLUES[id].title);
    return true;
  }

  function efficiency() {
    if (!state) return 1;
    let e = 1;
    if (state.stats.fatigue >= 75) e *= 0.5;
    if (state.stats.mood < 30) e *= 0.8;
    return e;
  }

  function workTrustGain(bonus) {
    return Math.max(2, Math.round((4 + state.rank + bonus) * efficiency()));
  }

  function studyTalentGain() {
    return Math.max(2, Math.round((5 + (state.stats.mood >= 60 ? 1 : 0)) * efficiency()));
  }

  /* ---------------- 存档 ---------------- */

  function save() {
    if (!state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        state
      }));
    } catch (e) {
      /* 隐私模式下忽略 */
    }
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      const data = payload && payload.state ? payload.state : payload;
      if (!data || !data.stats) return null;
      const base = newGame(data.name);
      const merged = Object.assign({}, base, data, {
        stats: Object.assign({}, base.stats, data.stats || {}),
        clues: Object.assign({}, base.clues, data.clues || {}),
        relations: Object.assign({}, base.relations, data.relations || {}),
        flags: Object.assign({}, base.flags, data.flags || {}),
        seenEvents: Array.isArray(data.seenEvents) ? data.seenEvents : [],
        log: Array.isArray(data.log) ? data.log : []
      });
      merged.day = clamp(Number(merged.day) || 1, 1, MAX_DAY);
      merged.rank = clamp(Number(merged.rank) || 0, 0, RANKS.length - 1);
      merged.silver = Math.max(0, Number(merged.silver) || 0);
      return merged;
    } catch (e) {
      return null;
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function getGallery() {
    try {
      const raw = localStorage.getItem(GALLERY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((id) => ENDINGS[id]) : [];
    } catch (e) {
      return [];
    }
  }

  function addGallery(id) {
    try {
      const arr = getGallery();
      if (!arr.includes(id)) {
        arr.push(id);
        localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
      }
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------------- 提示 ---------------- */

  function showToast(text) {
    const el = $toast();
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------------- 弹窗 ---------------- */

  function queueModal(modal) {
    modalQueue.push(modal);
    if (!modalBusy && !modalClosing) showNextModal();
  }

  function pumpModals() {
    if (!modalBusy && !modalClosing && modalQueue.length) showNextModal();
  }

  function showNextModal() {
    if (modalBusy || modalClosing) return;
    const modal = modalQueue.shift();
    if (!modal) return;
    modalBusy = true;
    const root = $modal();
    const bodyHtml = modal.html || (Array.isArray(modal.body) ? modal.body : String(modal.body || '').split(/\n\n+/))
      .filter(Boolean)
      .map((p) => '<p>' + p + '</p>')
      .join('');
    const choices = modal.choices && modal.choices.length ? modal.choices : [{ label: '合上' }];
    root.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(modal.title || '')}">
        <div class="modal-kicker">${escapeHtml(modal.kicker || '值房夜话')}</div>
        <h2>${escapeHtml(modal.title || '')}</h2>
        ${bodyHtml}
        ${modal.note ? `<div class="modal-note">${modal.note}</div>` : ''}
        <div class="modal-choices"></div>
      </div>
    `;
    const box = root.querySelector('.modal-choices');
    choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn' + (choice.disabled ? ' disabled' : '');
      btn.disabled = !!choice.disabled;
      btn.innerHTML = `
        <span>${escapeHtml(choice.label)}
          ${choice.sub ? `<small>${escapeHtml(choice.sub)}</small>` : ''}
        </span>
        <span class="choice-arrow">→</span>
      `;
      btn.addEventListener('click', () => {
        if (choice.disabled) return;
        const action = choice.action;
        closeModal(action);
      });
      box.appendChild(btn);
    });
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(callback) {
    if (!modalBusy) {
      if (callback) callback();
      pumpModals();
      return;
    }
    modalBusy = false;
    modalClosing = true;
    const root = $modal();
    root.classList.remove('open');
    root.innerHTML = '';
    document.body.style.overflow = '';
    setTimeout(() => {
      modalClosing = false;
      if (callback) callback();
      pumpModals();
    }, 110);
  }

  function clearModal() {
    modalQueue = [];
    modalBusy = false;
    modalClosing = false;
    const root = $modal();
    if (root) {
      root.classList.remove('open');
      root.innerHTML = '';
    }
    document.body.style.overflow = '';
  }

  /* ---------------- 渲染入口 ---------------- */

  function render() {
    if (gameScreen === 'start') renderStart();
    else if (gameScreen === 'game') renderGame();
    else if (gameScreen === 'ending') renderEnding();
  }

  function renderStart() {
    const saved = loadSave();
    const gallery = getGallery();
    const showContinue = saved && !saved.ended;
    $app().innerHTML = `
      <main class="start">
        <section class="start-left">
          <div>
            <div class="kicker">大胤 · 承平二十七年 · 十月</div>
            <div class="title-wrap">
              <h1 class="start-title">御前女官</h1>
              <div class="title-seal"><span>三十日</span><span>翻案</span></div>
            </div>
            <p class="start-sub">
              北境军粮案发。你的姐姐沈兰因以私改账册、盗卖官粮下狱，三日后秋决。<br>
              她托人带出一句话：<strong>我没有上堂，也没有画押。</strong><br>
              典簿司掌司给了你三十天，和一支姐姐用过的笔。
            </p>
          </div>
          <p class="start-foot">无恋爱线 · 单局约 20–30 分钟</p>
        </section>
        <section class="start-right">
          <div class="start-card">
            <div class="card-kicker">三十日翻案录</div>
            <h2>你只有三十天。</h2>
            <p>查清军粮案，救出姐姐。或者，替她死。</p>
            <p>每天只能做一件事。当值、查档、学艺、走动、布局、歇息。每一个选择都会留下痕迹。</p>
            <label class="name-field">
              <span>你的名字</span>
              <input id="player-name" maxlength="8" value="${showContinue ? escapeHtml(saved.name) : '沈青梧'}" autocomplete="off" spellcheck="false">
            </label>
            <button class="btn-primary" data-action="start">${showContinue ? '重开一局' : '接过那支笔'} <span class="arrow">→</span></button>
            ${showContinue ? `<button class="btn-ghost" data-action="continue">继续上一局 · 第 ${saved.day} 日 · ${RANKS[saved.rank].name}</button>` : ''}
            ${saved && saved.ended ? `<button class="btn-ghost" data-action="last-ending">查看上一局结局</button>` : ''}
            <div class="start-meta">
              <span>结局图鉴 ${gallery.length}/${Object.keys(ENDINGS).length}</span>
              <button data-action="gallery">打开图鉴</button>
              <span>存档自动保存</span>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function statRow(label, key, cls, threshold, warning) {
    const value = state.stats[key];
    const warn = warning && (key === 'mood' ? value < threshold : value >= threshold);
    return `
      <div class="stat-row ${warn ? 'warn' : ''}">
        <span class="label">${label}${warn ? `<small>${warning}</small>` : ''}</span>
        <span class="value">${value}<small>/100</small></span>
        <span class="bar ${cls}" aria-hidden="true"><i style="width:${value}%"></i>
          ${threshold === undefined ? '' : `<b class="bar-threshold" style="left:${threshold}%"></b>`}
        </span>
      </div>
    `;
  }

  function relationPips(level) {
    let html = '';
    for (let i = 0; i < 5; i += 1) {
      html += `<i class="${i < level ? 'on' : ''}"></i>`;
    }
    return html;
  }

  function renderGame() {
    if (!state) {
      gameScreen = 'start';
      renderStart();
      return;
    }
    const rank = RANKS[state.rank];
    const c = clueCount();
    const left = Math.max(1, MAX_DAY + 1 - state.day);
    const isLast = state.day >= MAX_DAY;
    const minTrust = workTrustGain(0);
    const maxTrust = workTrustGain(2);
    const trustGain = minTrust === maxTrust ? String(minTrust) : `${minTrust}–${maxTrust}`;
    const flavor = DAY_FLAVOR[Math.min(DAY_FLAVOR.length - 1, state.day - 1)];
    const date = DAY_DATES[Math.min(DAY_DATES.length - 1, state.day - 1)];
    let nextExam = '已至终考';
    let examReq = '终考：第 30 日';
    if (state.rank === 0) {
      nextExam = state.day < 11 ? '第 11 日' : '已错过';
      examReq = state.day < 11 ? '信任 25 · 才学 25 · 线索 1' : '第 11 日考功已过，位分停留';
    } else if (state.rank === 1) {
      nextExam = state.day < 21 ? '第 21 日' : '已错过';
      examReq = state.day < 21 ? '信任 45 · 才学 45 · 人望 25 · 线索 3' : '第 21 日考功已过，位分停留';
    }

    const logHtml = state.log.slice(-40).reverse().map((entry) => `
      <div class="log-entry ${entry.type || ''}">
        <span class="log-day">第 ${entry.day} 日</span>
        ${escapeHtml(entry.text)}
      </div>
    `).join('') || '<div class="log-entry"><span class="log-day">第 1 日</span>值房里很安静。你听见自己的心跳。</div>';

    const clueHtml = CLUE_IDS.map((id) => {
      const known = state.clues[id];
      return `
        <${known ? 'button' : 'div'} class="clue-item ${known ? 'known' : ''}" ${known ? `type="button" data-clue="${id}"` : ''}>
          <span class="mark">${known ? '●' : '○'}</span>
          <span>
            <span class="clue-title">${CLUES[id].label}</span>
            <span class="clue-sub">${known ? CLUES[id].sub : '未查得'}</span>
          </span>
        </${known ? 'button' : 'div'}>
      `;
    }).join('');

    const relHtml = Object.keys(SOCIALS).map((key) => {
      const person = SOCIALS[key];
      const level = state.relations[key] || 0;
      return `
        <div class="relation-row">
          <span><span class="name">${person.name}</span><br><span class="role">${person.role}</span></span>
          <span class="relation-pips">${relationPips(level)}</span>
          <span class="level">${level}/5</span>
        </div>
      `;
    }).join('');

    let tip = '每天只能做一件事。先活下来，再查案。';
    if (c >= 5) tip = '证据已经够了。最后一日，三司会审。';
    else if (state.stats.fatigue >= 75) tip = '你太累了。再撑下去，会出事。';
    else if (state.stats.risk >= 60) tip = '暗处有人盯着你。查档时小心些。';
    else if (c === 0) tip = '先学艺到才学 30，再查「罪籍画押」。第一份证据最要紧。';
    else if (c < 5) tip = '还差 ' + (5 - c) + ' 份证据。最后一日，至少要五份才能当堂翻案。';
    else if (state.stats.trust < 25) tip = '顾清和还在看。多当值，先把信任挣回来。';

    $app().innerHTML = `
      <div class="game-shell">
        <header class="topbar">
          <div class="brand">
            <h1>御前典簿司</h1>
            <span>三十日翻案录</span>
          </div>
          <div class="topmeta">
            <span>第 <b>${state.day}</b> / ${MAX_DAY} 日</span>
            <span>银 <b>${state.silver}</b> 两</span>
            <button class="icon-btn" data-action="menu">菜单</button>
          </div>
        </header>

        <div class="case-summary">
          <div class="deadline">
            <span>距终审</span>
            <b>${isLast ? '最后一日' : `${left} 日`}</b>
            <span class="deadline-line" aria-hidden="true"><i style="width:${state.day / MAX_DAY * 100}%"></i></span>
          </div>
          <div class="case-metric"><span>线索</span><b>${c}<small> / 6</small></b></div>
          <div class="case-metric"><span>疲劳</span><b class="${state.stats.fatigue >= 75 ? 'danger' : ''}">${state.stats.fatigue}</b></div>
          <div class="case-metric"><span>危机</span><b class="${state.stats.risk >= 60 ? 'danger' : ''}">${state.stats.risk}</b></div>
        </div>

        <div class="game-grid">
          <main>
            <section class="paper story-panel">
              <div class="paper-inner">
                <div class="panel-head">
                  <h2>今日案牍</h2>
                  <span class="date">${date} · 第 ${state.day} 日</span>
                </div>
                <p class="day-flavor">${flavor}</p>
                <div class="log-scroll" tabindex="0" role="region" aria-label="案牍记录">${logHtml}</div>
              </div>
            </section>

            <div class="actions-head"><h2>今日行动</h2><span>每日限一次</span></div>
            <section class="actions" aria-label="今日行动">
              <button class="action-card" data-action="work" ${state.ended ? 'disabled' : ''}>
                <strong>当值</strong>
                <small>抄录、校书、值守。换上官信任。</small>
                <em><span>信任 +${trustGain} · 才学 +1</span><span class="cost">疲劳 +12</span></em>
              </button>
              <button class="action-card" data-action="investigate" ${state.ended ? 'disabled' : ''}>
                <strong>查档</strong>
                <small>调阅卷宗，找出翻案的证据。</small>
                <em><span>获取线索 · 才学 +1</span><span class="cost">疲劳 +10–14 · 危机 +2–8</span></em>
              </button>
              <button class="action-card" data-action="study" ${state.ended ? 'disabled' : ''}>
                <strong>学艺</strong>
                <small>读律例、练字。才学是查档的钥匙。</small>
                <em><span>才学 +${studyTalentGain()} · 清誉 +1</span><span class="cost">疲劳 +10</span></em>
              </button>
              <button class="action-card" data-action="social" ${state.ended ? 'disabled' : ''}>
                <strong>走动</strong>
                <small>去见一个人。人情也是证据。</small>
                <em><span>关系 +1</span><span class="cost">银 −2 · 疲劳 +8</span></em>
              </button>
              <button class="action-card ${state.stats.scheme < 25 ? 'locked' : ''}" data-action="scheme" ${state.ended ? 'disabled' : ''}>
                <strong>布局</strong>
                <small>用手段换一条路。风险自负。</small>
                <em><span class="cost">${state.stats.scheme < 25 ? `手段 ${state.stats.scheme} / 25 解锁` : '收益与风险视选项而定'}</span></em>
              </button>
              <button class="action-card" data-action="rest" ${state.ended ? 'disabled' : ''}>
                <strong>歇息</strong>
                <small>睡一觉。你还要撑三十天。</small>
                <em><span>疲劳 −32 · 心情 +8</span></em>
              </button>
            </section>
          </main>

          <aside class="side-col">
            <section class="paper side-panel">
              <div class="paper-inner">
                <div class="side-head"><h3>位分与状态</h3><span>三十日考功</span></div>
                <div class="rank-line">
                  <strong>${rank.name}</strong>
                  <span class="silver"><b>${state.silver}</b> 两</span>
                </div>
                <div class="rank-track">
                  ${RANKS.map((r, i) => `<span class="${i <= state.rank ? 'on' : ''}"></span>`).join('')}
                </div>
                <div class="rank-caption">下次考功：${nextExam}</div>
                <div class="rank-req">${examReq}</div>
                <div class="stats-list">
                  ${statRow('才学', 'talent', 'blue')}
                  ${statRow('人望', 'popularity', 'green')}
                  ${statRow('信任', 'trust', '')}
                  ${statRow('清誉', 'reputation', '')}
                  ${statRow('手段', 'scheme', 'blue', 25)}
                  ${statRow('心情', 'mood', 'green', 30, '效率下降')}
                  ${statRow('疲劳', 'fatigue', 'red', 75, '效率减半')}
                  ${statRow('危机', 'risk', 'red', 60, '警戒')}
                </div>
                <div class="tip-box">${tip}</div>
              </div>
            </section>

            <section class="paper side-panel">
              <div class="paper-inner">
                <div class="side-head"><h3>姐姐的案子</h3><span class="dossier-count">${c} / 6</span></div>
                <div class="evidence-track" aria-hidden="true">
                  ${CLUE_IDS.map((_, i) => `<i class="${i < c ? 'on' : ''}"></i>`).join('')}
                </div>
                <div class="evidence-goal">当堂翻案至少需要 5 份线索</div>
                <div class="clue-list">${clueHtml}</div>
              </div>
            </section>

            <section class="paper side-panel">
              <div class="paper-inner">
                <div class="side-head"><h3>人情</h3><span>走动可增长</span></div>
                <div class="relation-list">${relHtml}</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;
  }

  function renderEnding() {
    const ending = ENDINGS[state.ending] || ENDINGS.executed;
    const gallery = getGallery();
    const body = ending.body.map((p) => `<p>${p}</p>`).join('') + `<p class="last-line">${ending.last}</p>`;
    $app().innerHTML = `
      <main class="ending-screen">
        <div class="ending-wrap">
          <div class="ending-kicker">${ending.kicker} · 第 ${state.day} 日 · 终局</div>
          <h1 class="ending-title">${ending.title}</h1>
          <div class="ending-sub">${ending.sub}</div>
          <div class="ending-rule"></div>
          <div class="paper ending-body"><div class="paper-inner">${body}</div></div>
          <div class="ending-stats">
            <span>最终位分 <b>${RANKS[state.rank].name}</b></span>
            <span>查得线索 <b>${clueCount()} / 6</b></span>
            <span>上官信任 <b>${state.stats.trust}</b></span>
            <span>清誉 <b>${state.stats.reputation}</b></span>
          </div>
          <div class="ending-actions">
            <button class="btn-primary" data-action="restart">再来一世 <span class="arrow">→</span></button>
            <button class="btn-ghost" data-action="gallery">结局图鉴</button>
          </div>
          <div class="ending-collection">已收集 ${gallery.length} / ${Object.keys(ENDINGS).length} 个结局</div>
        </div>
      </main>
    `;
  }

  /* ---------------- 开始 / 继续 ---------------- */

  function startNewGame(name) {
    state = newGame((name || '').trim() || '沈青梧');
    gameScreen = 'game';
    addLog('你走进御前典簿司。值房里只有一张空案，案上放着一支旧笔。', '');
    addLog('距秋决还有三十日。', 'danger');
    save();
    render();
    queueModal({
      kicker: '承平二十七年 · 十月初七',
      title: '你只有三十天',
      body: [
        '三日前，御前典簿司掌籍女史沈兰因以“私改军粮账册、盗卖官粮”下狱。案卷齐备，画押俱全。',
        '她是你的姐姐。昨夜，狱卒老周递进来一句话。姐姐说：我没有上堂，也没有画押。',
        '典簿司掌司顾清和把一支笔放在你面前。“你姐姐的位置空着。你替她抄完这个月，也替她查清楚。”',
        '“三十日。要么你姐姐的案子翻过来，要么你替她死。”'
      ],
      choices: [{
        label: '接过那支笔',
        sub: '笔杆上还留着姐姐的体温。',
        action: () => {
          state.flags.introSeen = true;
          addLog('你接过笔。顾清和看了你很久，转身走了。', 'rank');
          save();
          render();
        }
      }]
    });
  }

  function continueGame() {
    const saved = loadSave();
    if (!saved) {
      showToast('没有找到存档。');
      return;
    }
    state = saved;
    gameScreen = state.ended ? 'ending' : 'game';
    render();
    if (!state.ended && !state.flags.introSeen) {
      queueModal({
        kicker: '承平二十七年 · 十月初七',
        title: '你只有三十天',
        body: ['案卷还在，姐姐还在狱里。你还有三十天。'],
        choices: [{
          label: '继续',
          action: () => {
            state.flags.introSeen = true;
            save();
            render();
          }
        }]
      });
    }
  }

  function restart() {
    clearSave();
    state = null;
    gameScreen = 'start';
    clearModal();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 行动 ---------------- */

  function guard() {
    if (!state || state.ended) return false;
    return true;
  }

  function actionWork() {
    if (!guard()) return;
    const gain = workTrustGain(rand(0, 2));
    applyMods({ trust: gain, talent: 1, fatigue: 12, reputation: 1, mood: -1 });
    addLog(pick(WORK_LINES[Math.min(state.rank, WORK_LINES.length - 1)]), '');
    if (state.stats.fatigue >= 85) {
      addLog('你熬到散值，眼前发花。再这样下去，身子要垮。', 'danger');
    }
    advance();
  }

  function actionStudy() {
    if (!guard()) return;
    const gain = studyTalentGain();
    applyMods({ talent: gain, fatigue: 10, mood: -2, reputation: 1 });
    addLog(pick(STUDY_LINES), '');
    advance();
  }

  function actionRest() {
    if (!guard()) return;
    applyMods({ fatigue: -32, mood: 8, reputation: 1 });
    addLog(pick(REST_LINES), '');
    advance();
  }

  function actionSocial() {
    if (!guard()) return;
    const choices = Object.keys(SOCIALS).map((key) => {
      const p = SOCIALS[key];
      const level = state.relations[key] || 0;
      return {
        label: p.name + ' · ' + p.role,
        sub: p.effect + ' · 当前关系 ' + level + '/5 · 银 −2 · 疲劳 +8',
        disabled: state.silver < 2,
        action: () => resolveSocial(key)
      };
    });
    choices.push({
      label: '改日再说',
      sub: '不消耗今日。',
      action: () => {}
    });
    queueModal({
      kicker: '人情往来',
      title: '今日去见谁？',
      body: [
        '宫里的人情，是一张一张纸叠起来的。你只有一次机会，把纸递到对的人手里。',
        state.silver < 2 ? '你摸了摸袖袋，连一包点心的钱都不够。' : '袖袋里还有 ' + state.silver + ' 两银子。'
      ],
      choices
    });
  }

  function resolveSocial(key) {
    if (!guard()) return;
    if (state.silver < 2) {
      showToast('你连一包点心的钱都没有。');
      return;
    }
    const p = SOCIALS[key];
    const rel = {};
    rel[key] = 1;
    applyMods({ silver: -2, fatigue: 8, rel });
    if (key === 'gu') applyMods({ trust: 4, popularity: 1 });
    if (key === 'pei') applyMods({ popularity: 5, mood: 2 });
    if (key === 'lu') applyMods({ scheme: 4, talent: 1 });
    if (key === 'zhou') applyMods({ popularity: 2, mood: 1 });
    addLog(pick(p.lines), '');
    checkSocialClue(key);
    advance();
  }

  function checkSocialClue(key) {
    const rel = state.relations[key];
    if (key === 'zhou' && rel >= 3 && !state.clues.witness) {
      addClue('witness');
    }
    if (key === 'pei' && rel >= 3 && !state.clues.time) {
      addClue('time');
    }
    if (key === 'lu' && rel >= 3 && !state.clues.silver) {
      addClue('silver');
    }
    if (key === 'gu' && rel >= 4 && state.stats.trust >= 55 && !state.clues.letter) {
      addClue('letter');
    }
  }

  function actionInvestigate() {
    if (!guard()) return;
    if (clueCount() >= CLUE_IDS.length) {
      showToast('六份卷宗都已查过。剩下的，是怎么用它们。');
      return;
    }
    const choices = ARCHIVES.map((a) => {
      const known = state.clues[a.id];
      const can = a.req(state);
      return {
        label: a.name + (known ? ' · 已查得' : ''),
        sub: known ? CLUES[a.id].title : (can ? `${a.desc} 疲劳 +${a.fatigue} · 危机 +${a.risk}` : '需要：' + a.reqText),
        disabled: known || !can,
        action: () => resolveArchive(a)
      };
    });
    choices.push({
      label: '先回去',
      sub: '不消耗今日。',
      action: () => {}
    });
    queueModal({
      kicker: '档案库',
      title: '调哪一份卷宗？',
      body: [
        '档案库的钥匙在掌籍女史手里。你只有一次调阅的机会，不能留下太多痕迹。',
        '查档会消耗精力，也会让你离某些人更近。'
      ],
      note: '未满足条件的卷宗暂时调不出来。先当值、学艺或走动。',
      choices
    });
  }

  function resolveArchive(a) {
    if (!guard()) return;
    if (state.clues[a.id]) return;
    if (!a.req(state)) {
      showToast('你还没有调阅这份卷宗的资格。');
      return;
    }
    applyMods({ fatigue: a.fatigue, risk: a.risk, talent: 1 });
    addClue(a.id);
    addLog('你调出了' + a.name + '。灯下看了很久，终于在一处不起眼的地方停住。', 'clue');
    advance();
  }

  function actionScheme() {
    if (!guard()) return;
    if (state.stats.scheme < 25) {
      showToast('你的手段还不足以布局。多和陆知微走动，或先查几份卷宗。');
      return;
    }
    queueModal({
      kicker: '暗处',
      title: '要不要走这一步？',
      body: [
        '有些路，走一次就回不了头。可你也没有太多时间了。',
        '你现在的危机是 ' + state.stats.risk + ' / 100。越高，越容易被人先下手。'
      ],
      note: '布局会消耗一日。风险由你承担。',
      choices: [
        {
          label: '打点狱卒，再见姐姐一面',
          sub: '花费 8 两 · 老周关系 +1 · 危机 +5 · 疲劳 +8',
          disabled: state.silver < 8,
          action: () => {
            applyMods({ silver: -8, fatigue: 8, risk: 5, rel: { zhou: 1 } });
            addLog('你把银子塞进老周手里。他没数，只叹了口气：“别待太久。”', 'danger');
            if (state.relations.zhou >= 3 && !state.clues.witness) addClue('witness');
            advance();
          }
        },
        {
          label: '把消息散出去，逼他们动',
          sub: '人望 +6 · 清誉 −4 · 危机 +3 · 疲劳 +8',
          action: () => {
            applyMods({ popularity: 6, reputation: -4, risk: 3, fatigue: 8 });
            addLog('你托裴小满把话递到几个值房。第二日，宫里都在传：军粮案要重审。', 'danger');
            advance();
          }
        },
        {
          label: '仿一份提审手令',
          sub: '需手段 40 · 五成成功 · 失败即终局',
          disabled: state.stats.scheme < 40,
          action: () => {
            if (chance(0.5)) {
              state.flags.forged = true;
              applyMods({ scheme: 4, risk: 12, fatigue: 10, mood: -4 });
              addLog('你对着旧手令练了三夜。新纸做旧，印色也调得八九不离十。', 'danger');
              showToast('你得到一份伪造的提审手令。');
              advance();
            } else {
              ending('forgery');
            }
          }
        },
        {
          label: '什么都不做，先稳住',
          sub: '危机 −4 · 心情 +2 · 疲劳 +2',
          action: () => {
            applyMods({ risk: -4, mood: 2, fatigue: 2 });
            addLog('你把案卷收进柜子，吹了灯。今夜什么也不做。', '');
            advance();
          }
        }
      ]
    });
  }

  /* ---------------- 日推进 ---------------- */

  function advance() {
    if (!state || state.ended) return;
    state.day += 1;

    if (state.day === 11 || state.day === 21) {
      paySalary();
      checkPromotion();
    }

    if (state.day > MAX_DAY) {
      state.day = MAX_DAY;
      state.silver += RANKS[state.rank].salary;
      addLog('最后一旬的俸银发下来了：' + RANKS[state.rank].salary + ' 两。', '');
      save();
      render();
      setTimeout(showFinale, 260);
      return;
    }

    if (state.stats.fatigue >= 100) {
      save();
      render();
      setTimeout(() => ending('ill'), 260);
      return;
    }

    maybeEvent();
    save();
    render();
    pumpModals();
  }

  function paySalary() {
    const amount = RANKS[state.rank].salary;
    state.silver += amount;
    addLog('十日一结的俸银发下来了：' + amount + ' 两。', '');
  }

  function checkPromotion() {
    const c = clueCount();
    if (state.day === 11 && state.rank === 0) {
      if (state.stats.trust >= 25 && state.stats.talent >= 25 && c >= 1) {
        state.rank = 1;
        addLog('考功通过。顾清和把你的名字写进掌籍册：沈青梧，掌籍女史。', 'rank');
        queueModal({
          kicker: '考功 · 第一场',
          title: '掌籍女史',
          body: ['顾清和把一库钥匙推到你面前。“从明日起，你不再是抄录。”', '她没有笑。但也没有再看你案上的罪籍。'],
          choices: [{ label: '领命' }]
        });
      } else {
        addLog('考功未过。你的名字还停在抄录册上。', 'danger');
        queueModal({
          kicker: '考功 · 第一场',
          title: '留任',
          body: ['掌司在考功簿上批了“留任”二字。', '你没有说话。回去的路上，把袖里的卷宗攥得很紧。'],
          choices: [{ label: '继续' }]
        });
      }
    }
    if (state.day === 21 && state.rank === 1) {
      if (state.stats.trust >= 45 && state.stats.talent >= 45 && state.stats.popularity >= 25 && c >= 3) {
        state.rank = 2;
        addLog('考功通过。你成了典簿司掌事，掌司之下，文书都要过你的手。', 'rank');
        queueModal({
          kicker: '考功 · 第二场',
          title: '典簿司掌事',
          body: ['你搬进了靠里那间值房。窗外能看见档案库的檐角。', '顾清和把一串库房钥匙放在你案上，说：“现在，你能调所有旧档了。”'],
          choices: [{ label: '领命' }]
        });
      } else {
        addLog('第二场考功未过。你还坐在原来的位置上。', 'danger');
        queueModal({
          kicker: '考功 · 第二场',
          title: '留任',
          body: ['掌司没有见你，只让人送来一句话：再等等。', '可你没有多少时间可以等了。'],
          choices: [{ label: '继续' }]
        });
      }
    }
  }

  function maybeEvent() {
    if (state.day >= MAX_DAY) return;
    if (!chance(0.42)) return;
    const pool = EVENTS.filter((ev) => !state.seenEvents.includes(ev.id));
    if (!pool.length) return;
    const ev = pick(pool);
    state.seenEvents.push(ev.id);
    queueModal({
      kicker: ev.kicker || '值房夜话',
      title: ev.title,
      body: ev.text,
      note: ev.note,
      choices: ev.choices.map((choice) => ({
        label: choice.label,
        sub: choice.sub,
        disabled: choice.disabled ? choice.disabled() : false,
        action: () => {
          choice.effect();
          addLog(choice.log, choice.type || '');
          save();
          render();
        }
      }))
    });
  }

  /* ---------------- 终局 ---------------- */

  function showFinale() {
    if (!state || state.ended) return;
    const c = clueCount();
    if (state.stats.fatigue >= 100) {
      ending('ill');
      return;
    }
    if (state.stats.risk >= 95 && c < 6) {
      ending('silenced');
      return;
    }
    if (state.stats.reputation < 25 || state.stats.trust < 15) {
      queueModal({
        kicker: '十一月初六 · 秋决',
        title: '你被挡在门外',
        body: ['你赶到宫门时，腰牌已经被收走了。', '典簿司的考功簿上写着：清誉有亏，不堪任用。'],
        choices: [{ label: '离开', action: () => ending('dismissed') }]
      });
      return;
    }
    if (c < 3) {
      queueModal({
        kicker: '十一月初六 · 秋决',
        title: '证据不够',
        body: [
          '你手里只有零碎的疑点。它们拼不成一份能递上去的呈文。',
          '午时三刻，鼓响。你站在人群里，听见姐姐的名字被念出来。'
        ],
        choices: [{ label: '去刑场', action: () => ending('executed') }]
      });
      return;
    }

    const effective = c + (state.flags.forged ? 1 : 0);
    const canExpose = effective >= 5 && state.stats.reputation >= 50 && state.stats.risk < 85;
    const canGu = effective >= 5 && state.stats.trust >= 60;
    const choices = [];

    if (canExpose) {
      choices.push({
        label: '当堂呈上全部证据',
        sub: '把六份卷宗，一件一件摆到三司面前。',
        action: () => exposeChoice()
      });
    }
    if (canGu) {
      choices.push({
        label: '请顾清和代为上奏',
        sub: '她还有一份直达御前的奏本。',
        action: () => exposeChoice()
      });
    }
    choices.push({
      label: '与郑铨做一笔交易',
      sub: '用证据换姐姐一条命，也换自己的前程。',
      action: () => ending('deal')
    });
    choices.push({
      label: '烧掉证据，封存卷宗',
      sub: '保住自己，让姐姐的案子永远沉下去。',
      action: () => ending('seal')
    });
    choices.push({
      label: '什么都不做',
      sub: '你没有走进三司会审的大门。',
      action: () => ending('executed')
    });

    queueModal({
      kicker: '十一月初六 · 三司会审',
      title: '最后一日',
      body: [
        '三司会审设在刑部大堂。你站在门外，怀里抱着六份卷宗。',
        canExpose
          ? '证据够了。但你也知道，只要递上去，就没有回头路。'
          : '证据还差一点。你可以递，也可以拿它去换别的东西。',
        state.flags.forged ? '其中一份手令，是你自己仿的。没有人看出来。' : ''
      ].filter(Boolean),
      note: '这是最后的选择。',
      choices
    });
  }

  function exposeChoice() {
    queueModal({
      kicker: '三司会审 · 案已翻',
      title: '你要什么？',
      body: [
        '曹弼被当场拿下。郑铨坐在上首，脸色很白。堂上安静了很久，才有人敲下惊堂木。',
        '姐姐的案子翻了。她从狱里出来时，天已经黑了。',
        '顾清和把御前女官的印信推到你面前。姐姐站在门外，没有进来。'
      ],
      note: '你只能选一次。',
      choices: [
        {
          label: '留在宫里，接下御前女官之印',
          sub: '你赢了。但你也成了这套规矩的一部分。',
          action: () => {
            state.rank = 3;
            ending('clear_stay');
          }
        },
        {
          label: '辞官，带姐姐离开京城',
          sub: '你救了她，也放过了自己。',
          action: () => ending('clear_leave')
        }
      ]
    });
  }

  function ending(type) {
    if (!state) return;
    state.ended = true;
    state.ending = type;
    addGallery(type);
    save();
    clearModal();
    gameScreen = 'ending';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 事件池 ---------------- */

  const EVENTS = [
    {
      id: 'rain',
      title: '雨夜借伞',
      text: ['散值时分下起冷雨。顾清和站在廊下，手里只有一把伞。她看见你，把伞往你这边偏了偏。'],
      choices: [
        {
          label: '接过伞，送她回值房',
          sub: '信任 +5 · 心情 +4',
          effect: () => applyMods({ trust: 5, mood: 4, fatigue: 3, rel: { gu: 1 } }),
          log: '你替顾清和撑伞，一路送到值房门口。她说了声“回去”，声音比平时轻。'
        },
        {
          label: '说自己还有卷宗要抄',
          sub: '才学 +3 · 疲劳 +5 · 信任 −1',
          effect: () => applyMods({ talent: 3, fatigue: 5, trust: -1 }),
          log: '你留在值房抄完最后一页。雨声很大，廊下那把伞很久才走。'
        }
      ]
    },
    {
      id: 'pei',
      title: '廊下罚跪',
      text: ['裴小满被掌籍女史罚跪在廊下，怀里还护着一摞湿了的文书。她看见你，眼圈一下红了。'],
      choices: [
        {
          label: '替她求情',
          sub: '人望 +5 · 信任 −2',
          effect: () => applyMods({ popularity: 5, trust: -2, mood: 2, rel: { pei: 1 } }),
          log: '你替裴小满说了几句话。掌籍女史冷着脸走了。裴小满跟在你身后，一路没敢抬头。'
        },
        {
          label: '蹲下来帮她晒文书',
          sub: '人望 +3 · 才学 +2 · 疲劳 +5',
          effect: () => applyMods({ popularity: 3, talent: 2, fatigue: 5, rel: { pei: 1 } }),
          log: '你和裴小满把湿文书一页页摊在廊下。她小声说：“沈姐姐，你真好。”'
        },
        {
          label: '绕开',
          sub: '心情 −3 · 清誉 −1',
          effect: () => applyMods({ mood: -3, reputation: -1 }),
          log: '你从廊下绕过去。裴小满没有叫你。'
        }
      ]
    },
    {
      id: 'lu',
      title: '没有落款的纸条',
      text: ['陆知微在宫门外拦住你，递来一张没有落款的纸条。上面只有一行字：“汇通号，八月十七，曹。”'],
      choices: [
        {
          label: '收下',
          sub: '手段 +5 · 危机 +5 · 陆知微 +1',
          effect: () => applyMods({ scheme: 5, risk: 5, rel: { lu: 1 } }),
          log: '你把纸条收进袖中。陆知微看了你一眼，说：“别让人看见。”'
        },
        {
          label: '退回',
          sub: '清誉 +3 · 信任 +1',
          effect: () => applyMods({ reputation: 3, trust: 1 }),
          log: '你把纸条推回去。陆知微没有接，转身走了。纸条落在地上，被风卷走。'
        }
      ]
    },
    {
      id: 'zheng',
      title: '少监的人',
      text: ['郑铨的人在值房外等你。那人穿着内官的青袍，笑得很客气：“沈女史，少监说，令姐的案子，还可以再议。”'],
      choices: [
        {
          label: '周旋',
          sub: '手段 +4 · 危机 +6',
          effect: () => applyMods({ scheme: 4, risk: 6, flags: {} }),
          log: '你和那人说了半盏茶的话，什么也没答应。他走时，笑得更客气了。'
        },
        {
          label: '闭门不见',
          sub: '清誉 +3 · 危机 +2',
          effect: () => applyMods({ reputation: 3, risk: 2 }),
          log: '你让裴小满回话：沈女史今日不见客。门外安静了一会儿，脚步声走了。'
        },
        {
          label: '把话录下来',
          sub: '需才学 40 · 信任 +2 · 危机 +4',
          disabled: () => state.stats.talent < 40,
          effect: () => applyMods({ trust: 2, risk: 4, talent: 2 }),
          log: '你隔着门，把他的话一字一句记在纸上。墨迹很稳。'
        }
      ]
    },
    {
      id: 'sister',
      title: '一小块炭',
      text: ['老周趁换班塞给你一小块炭。上面是姐姐的字，写得很急：“别查我，查粮。”'],
      choices: [
        {
          label: '继续查',
          sub: '心情 +5 · 危机 +4',
          effect: () => applyMods({ mood: 5, risk: 4 }),
          log: '你把炭块攥在手里，炭灰落了一地。查粮。她到这时候，还在给你指路。'
        },
        {
          label: '托他带话：等我',
          sub: '心情 +8 · 信任 +2',
          effect: () => applyMods({ mood: 8, trust: 2, rel: { zhou: 1 } }),
          log: '老周点点头，把炭块收回去。你说：告诉她，等我。'
        }
      ]
    },
    {
      id: 'document',
      title: '落错的日期',
      text: ['同僚把一份誊清的折子落在你案上。你翻开，发现落款日期比正文早了两天。'],
      choices: [
        {
          label: '改过来',
          sub: '才学 +3 · 信任 +3',
          effect: () => applyMods({ talent: 3, trust: 3 }),
          log: '你把日期改过来，重新誊了一遍。同僚回来时，什么也没发现。'
        },
        {
          label: '装作没看见',
          sub: '清誉 −2 · 心情 −2',
          effect: () => applyMods({ reputation: -2, mood: -2 }),
          log: '你把折子放回原处。第二日，它被递了上去。'
        },
        {
          label: '抄一份留底',
          sub: '手段 +4 · 危机 +3',
          effect: () => applyMods({ scheme: 4, risk: 3 }),
          log: '你把折子抄了一份，藏在《河工志》底下。'
        }
      ]
    },
    {
      id: 'test',
      title: '掌司考校',
      text: ['顾清和忽然问你：“军粮册上的损耗，为何要用新墨？”'],
      choices: [
        {
          label: '答：因为原账被改过',
          sub: '需才学 35 · 信任 +6',
          disabled: () => state.stats.talent < 35,
          effect: () => {
            applyMods({ trust: 6, talent: 3 });
          },
          log: '顾清和看了你很久，说：“你姐姐也这么答过。”'
        },
        {
          label: '答：许是补记',
          sub: '信任 +1 · 清誉 +1',
          effect: () => applyMods({ trust: 1, reputation: 1 }),
          log: '顾清和没有追问，只把册子合上了。'
        }
      ]
    },
    {
      id: 'rumor',
      title: '宫里的闲话',
      text: ['司里传开：沈家姐妹，一个盗粮，一个攀附。话是从茶房传出来的，越传越难听。'],
      choices: [
        {
          label: '花 5 两压下去',
          sub: '清誉 +3 · 银 −5',
          disabled: () => state.silver < 5,
          effect: () => applyMods({ silver: -5, reputation: 3 }),
          log: '你托裴小满给茶房的婆子塞了银子。第二日，闲话换了个人说。'
        },
        {
          label: '不理',
          sub: '清誉 −4 · 心情 −3',
          effect: () => applyMods({ reputation: -4, mood: -3 }),
          log: '你低头抄书。那些话从耳边过，像风。'
        },
        {
          label: '当众驳斥',
          sub: '人望 +4 · 信任 −2 · 危机 +2',
          effect: () => applyMods({ popularity: 4, trust: -2, risk: 2 }),
          log: '你在值房门口站住，把话一句一句驳了回去。没人再笑。'
        }
      ]
    },
    {
      id: 'book',
      title: '旧书商的残卷',
      text: ['旧书商在宫门外卖残卷，其中一页像是河工旧档。他开价八两，一分不少。'],
      choices: [
        {
          label: '买下',
          sub: '才学 +4 · 银 −8',
          disabled: () => state.silver < 8,
          effect: () => applyMods({ silver: -8, talent: 4, mood: 2 }),
          log: '你把残卷买下来。回值房的路上，发现背面有一行被水洇过的字：“曹仓。”'
        },
        {
          label: '记下书名，改日再查',
          sub: '才学 +1',
          effect: () => applyMods({ talent: 1 }),
          log: '你记下书名，走了。书商在后面喊：“过了这村，可没这店了。”'
        }
      ]
    },
    {
      id: 'search',
      title: '被翻过的柜子',
      text: ['夜里回值房，你发现柜门虚掩，锁眼有新鲜的划痕。有人来过。'],
      choices: [
        {
          label: '检查少了什么',
          sub: '需手段 30 · 手段 +3 · 危机 +2',
          disabled: () => state.stats.scheme < 30,
          effect: () => applyMods({ scheme: 3, risk: 2 }),
          log: '你检查了一遍，少了一页无关紧要的旧档。他们是在找别的东西。'
        },
        {
          label: '不动声色，换一把锁',
          sub: '清誉 +2 · 危机 +2',
          effect: () => applyMods({ reputation: 2, risk: 2 }),
          log: '你换了锁，把钥匙贴身收好。第二日，什么也没发生。'
        }
      ]
    },
    {
      id: 'drink',
      title: '裴小满的生辰',
      text: ['裴小满拉你去吃酒，说今天是她的生辰。她攒了三个月的月钱，只为这一顿。'],
      choices: [
        {
          label: '去',
          sub: '心情 +8 · 人望 +3 · 银 −2',
          disabled: () => state.silver < 2,
          effect: () => applyMods({ mood: 8, popularity: 3, silver: -2, fatigue: 5, rel: { pei: 1 } }),
          log: '你们在城南小摊上吃了一碗面。裴小满说，等她出去了，要开一间书铺。'
        },
        {
          label: '推辞',
          sub: '心情 −2 · 才学 +2',
          effect: () => applyMods({ mood: -2, talent: 2 }),
          log: '你说还有卷宗要抄。裴小满笑了笑，说：“那我给你留一块糕。”'
        }
      ]
    },
    {
      id: 'warrant',
      title: '刑部调卷',
      text: ['刑部来人调卷。陆知微趁人不注意，低声说：“他们不是来查案，是来销案。”'],
      choices: [
        {
          label: '把关键一页藏起来',
          sub: '手段 +5 · 危机 +6',
          effect: () => applyMods({ scheme: 5, risk: 6 }),
          log: '你把军粮册最后一页抽出来，藏进袖中。刑部的人翻了翻，没发现。'
        },
        {
          label: '让他们拿走',
          sub: '清誉 +2 · 心情 −2',
          effect: () => applyMods({ reputation: 2, mood: -2 }),
          log: '你站在一边，看他们把卷宗装进箱子。箱盖合上时，你听见自己咬牙的声音。'
        }
      ]
    },
    {
      id: 'gu',
      title: '档案库最深处',
      text: ['顾清和把你叫到档案库最深处。她说：“你姐姐查的，不只是粮。”'],
      choices: [
        {
          label: '追问',
          sub: '信任 +3 · 心情 −2',
          effect: () => applyMods({ trust: 3, mood: -2, rel: { gu: 1 } }),
          log: '顾清和没有再说下去。她只指了指最里面那排柜子，说：“钥匙在掌籍册上。”'
        },
        {
          label: '沉默',
          sub: '心情 −1 · 才学 +1',
          effect: () => applyMods({ mood: -1, talent: 1 }),
          log: '你什么也没问。顾清和看了你一眼，像是失望，又像是放心。'
        }
      ]
    },
    {
      id: 'cold',
      title: '风寒',
      text: ['你受了风寒，头重脚轻。案上的字开始重影。'],
      choices: [
        {
          label: '歇半日',
          sub: '疲劳 −12 · 心情 +2',
          effect: () => applyMods({ fatigue: -12, mood: 2 }),
          log: '你趴在案上睡了半日。醒来时，身上多了一件旧披风。'
        },
        {
          label: '硬撑',
          sub: '疲劳 +8 · 才学 +1',
          effect: () => applyMods({ fatigue: 8, talent: 1 }),
          log: '你灌了一碗姜汤，继续抄。手抖得厉害，字却比平时更用力。'
        }
      ]
    }
  ];

  /* ---------------- 菜单 / 图鉴 ---------------- */

  function openMenu() {
    if (!state) return;
    queueModal({
      kicker: '暂歇',
      title: '要做什么？',
      body: ['宫门还没下钥。你可以再坐一会儿。'],
      choices: [
        {
          label: '回到封面',
          sub: '当前进度会自动保存。',
          action: () => {
            gameScreen = 'start';
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          label: '结局图鉴',
          sub: '看看你已经走到过哪些地方。',
          action: () => showGallery()
        },
        {
          label: '重新开始',
          sub: '当前这一局会被清掉。',
          action: () => confirmRestart()
        }
      ]
    });
  }

  function confirmRestart() {
    queueModal({
      kicker: '重新开始',
      title: '确定要重来？',
      body: ['当前这一局的进度会被清除。已经收集的结局会保留。'],
      choices: [
        { label: '重来', action: () => restart() },
        { label: '再想想' }
      ]
    });
  }

  function showGallery() {
    const unlocked = getGallery();
    const ids = Object.keys(ENDINGS);
    const items = ids.map((id) => {
      const e = ENDINGS[id];
      const has = unlocked.includes(id);
      return `
        <div class="gallery-item ${has ? '' : 'locked'}">
          <div class="g-title">${has ? e.title : '？？？'}</div>
          <div class="g-sub">${has ? e.sub : '尚未抵达'}</div>
        </div>
      `;
    }).join('');
    queueModal({
      kicker: '结局图鉴',
      title: '已收集 ' + unlocked.length + ' / ' + ids.length,
      html: `<div class="gallery-grid">${items}</div>`,
      choices: [{ label: '合上' }]
    });
  }

  /* ---------------- 事件委托 ---------------- */

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (trigger) {
      const action = trigger.dataset.action;
      if (action === 'start') {
        const input = document.getElementById('player-name');
        const name = input ? input.value : '';
        const saved = loadSave();
        if (saved && !saved.ended) {
          queueModal({
            kicker: '还有一局未走完',
            title: '要重开吗？',
            body: ['你已经有一局进行到第 ' + saved.day + ' 日。重开会覆盖这局的自动存档。'],
            choices: [
              { label: '继续上一局', sub: '回到第 ' + saved.day + ' 日。', action: () => continueGame() },
              { label: '重开一局', sub: '当前进度会被覆盖。', action: () => startNewGame(name) },
              { label: '再想想' }
            ]
          });
        } else {
          startNewGame(name);
        }
      } else if (action === 'continue') {
        continueGame();
      } else if (action === 'last-ending') {
        const saved = loadSave();
        if (saved && saved.ended) {
          state = saved;
          gameScreen = 'ending';
          render();
        }
      } else if (action === 'gallery') {
        showGallery();
      } else if (action === 'restart') {
        restart();
      } else if (action === 'menu') {
        openMenu();
      } else if (action === 'work') {
        actionWork();
      } else if (action === 'investigate') {
        actionInvestigate();
      } else if (action === 'study') {
        actionStudy();
      } else if (action === 'social') {
        actionSocial();
      } else if (action === 'scheme') {
        actionScheme();
      } else if (action === 'rest') {
        actionRest();
      }
      return;
    }

    const clueEl = event.target.closest('[data-clue]');
    if (clueEl) {
      const id = clueEl.dataset.clue;
      if (id && CLUES[id] && state && state.clues[id]) {
        queueModal({
          kicker: '卷宗 · ' + CLUES[id].label,
          title: CLUES[id].title,
          body: [CLUES[id].text],
          note: '来源：' + CLUES[id].source,
          choices: [{ label: '合上' }]
        });
      }
    }
  });

  /* ---------------- 启动 ---------------- */

  render();

  /* 供本地调试与自动化测试使用；不会影响正常游玩 */
  window.__YUQIAN__ = {
    get state() { return state; },
    get screen() { return gameScreen; },
    newGame,
    render,
    actionWork,
    actionStudy,
    actionRest,
    actionInvestigate,
    actionSocial,
    actionScheme,
    advance,
    ending,
    showFinale,
    clueCount
  };
})();
