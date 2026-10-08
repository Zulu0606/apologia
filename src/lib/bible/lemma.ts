/** Topic lemmas and light folding so everyday questions meet Bible wording. */

const MERGE: Record<string, string> = {
  suffer: "suffer",
  suffers: "suffer",
  suffered: "suffer",
  suffering: "suffer",
  sufferings: "suffer",
  afflict: "afflict",
  afflicted: "afflict",
  afflicting: "afflict",
  affliction: "afflict",
  afflictions: "afflict",
  tribulation: "tribulation",
  tribulations: "tribulation",
  persecute: "persecute",
  persecuted: "persecute",
  persecuting: "persecute",
  persecution: "persecute",
  persecutions: "persecute",
  torment: "torment",
  tormented: "torment",
  torments: "torment",
  tormenting: "torment",
  anguish: "anguish",
  misery: "misery",
  miserable: "misery",
  adversity: "adversity",
  distress: "distress",
  distressed: "distress",
  distresses: "distress",
  chasten: "chasten",
  chastened: "chasten",
  chastening: "chasten",
  chastisement: "chasten",
  chastisements: "chasten",
  trial: "trial",
  trials: "trial",
  oppress: "oppress",
  oppressed: "oppress",
  oppresses: "oppress",
  oppressing: "oppress",
  oppression: "oppress",
  oppressor: "oppress",
  oppressors: "oppress",
  sorrow: "sorrow",
  sorrows: "sorrow",
  sorry: "sorrow",
  grief: "sorrow",
  grieve: "sorrow",
  grieved: "sorrow",
  grieves: "sorrow",
  grieving: "sorrow",
  mourn: "sorrow",
  mourned: "sorrow",
  mourning: "sorrow",
  mourns: "sorrow",
  weep: "sorrow",
  weeping: "sorrow",
  wept: "sorrow",
  weeps: "sorrow",
  pain: "pain",
  pains: "pain",
  pained: "pain",
  painful: "pain",
  hardship: "hardship",
  hardships: "hardship",
  groan: "groan",
  groaned: "groan",
  groaning: "groan",
  groanings: "groan",
  groans: "groan",
  endure: "endure",
  endured: "endure",
  endures: "endure",
  enduring: "endure",
  endurance: "endure",
  patient: "patient",
  patiently: "patient",
  patience: "patient",
  longsuffering: "patient",
  comfort: "comfort",
  comforted: "comfort",
  comforter: "comfort",
  comforters: "comfort",
  comforts: "comfort",
  comforting: "comfort",
  consolation: "comfort",
  consolations: "comfort",
  anxiety: "anxiety",
  anxious: "anxiety",
  worry: "anxiety",
  worried: "anxiety",
  worries: "anxiety",
  worrying: "anxiety",
  careful: "anxiety",
  fear: "fear",
  fears: "fear",
  feared: "fear",
  fearing: "fear",
  fearful: "fear",
  afraid: "fear",
  scare: "fear",
  scares: "fear",
  scared: "fear",
  scary: "fear",
  dread: "fear",
  dreaded: "fear",
  terror: "fear",
  terrors: "fear",
  tremble: "fear",
  trembled: "fear",
  trembling: "fear",
  trembles: "fear",
  courage: "courage",
  courageous: "courage",
  love: "love",
  loves: "love",
  loved: "love",
  loving: "love",
  beloved: "love",
  charity: "love",
  kindness: "kindness",
  lovingkindness: "kindness",
  compassion: "compassion",
  mercies: "mercy",
  mercy: "mercy",
  merciful: "mercy",
  forgive: "forgive",
  forgives: "forgive",
  forgiven: "forgive",
  forgave: "forgive",
  forgiving: "forgive",
  forgiveness: "forgive",
  pardon: "forgive",
  pardoned: "forgive",
  pardons: "forgive",
  sin: "sin",
  sins: "sin",
  sinned: "sin",
  sinning: "sin",
  sinner: "sin",
  sinners: "sin",
  sinful: "sin",
  iniquity: "sin",
  iniquities: "sin",
  transgression: "sin",
  transgressions: "sin",
  trespass: "sin",
  trespasses: "sin",
  trespassed: "sin",
  repent: "repent",
  repents: "repent",
  repented: "repent",
  repenting: "repent",
  repentance: "repent",
  faith: "faith",
  faithful: "faith",
  faithfully: "faith",
  faithfulness: "faith",
  believe: "faith",
  believes: "faith",
  believed: "faith",
  believing: "faith",
  belief: "faith",
  beliefs: "faith",
  trust: "faith",
  trusts: "faith",
  trusted: "faith",
  trusting: "faith",
  prayer: "prayer",
  prayers: "prayer",
  pray: "prayer",
  prays: "prayer",
  prayed: "prayer",
  praying: "prayer",
  supplication: "prayer",
  supplications: "prayer",
  wealth: "wealth",
  rich: "wealth",
  riches: "wealth",
  richer: "wealth",
  money: "wealth",
  mammon: "wealth",
  wealthy: "wealth",
  greed: "wealth",
  greedy: "wealth",
  desire: "desire",
  desires: "desire",
  desired: "desire",
  desiring: "desire",
  covet: "desire",
  covets: "desire",
  coveted: "desire",
  coveting: "desire",
  covetous: "desire",
  covetousness: "desire",
  lust: "desire",
  lusts: "desire",
  lusted: "desire",
  lusting: "desire",
  poor: "poor",
  poverty: "poor",
  needy: "poor",
  widow: "widow",
  widows: "widow",
  death: "death",
  die: "death",
  dies: "death",
  died: "death",
  dying: "death",
  dead: "death",
  grave: "death",
  graves: "death",
  resurrection: "resurrection",
  marriage: "marriage",
  marry: "marriage",
  marries: "marriage",
  married: "marriage",
  marrying: "marriage",
  husband: "marriage",
  husbands: "marriage",
  wife: "marriage",
  wives: "marriage",
  bride: "marriage",
  bridegroom: "marriage",
  anger: "anger",
  angry: "anger",
  wrath: "anger",
  wroth: "anger",
  furious: "anger",
  fury: "anger",
  wisdom: "wisdom",
  wise: "wisdom",
  foolish: "foolish",
  fool: "foolish",
  fools: "foolish",
  folly: "foolish",
  hope: "hope",
  hopes: "hope",
  hoped: "hope",
  hoping: "hope",
  peace: "peace",
  peaceful: "peace",
  peaceable: "peace",
  joy: "joy",
  joyful: "joy",
  joyfully: "joy",
  rejoice: "joy",
  rejoiced: "joy",
  rejoices: "joy",
  rejoicing: "joy",
  glad: "joy",
  gladness: "joy",
  pride: "pride",
  proud: "pride",
  proudly: "pride",
  haughty: "pride",
  haughtiness: "pride",
  humble: "humble",
  humbled: "humble",
  humbles: "humble",
  humility: "humble",
  meek: "humble",
  meekness: "humble",
  enemy: "enemy",
  enemies: "enemy",
  foe: "enemy",
  foes: "enemy",
  heal: "heal",
  heals: "heal",
  healed: "heal",
  healing: "heal",
  health: "heal",
  sick: "sick",
  sickness: "sick",
  sicknesses: "sick",
  disease: "sick",
  diseases: "sick",
  illness: "sick",
  illnesses: "sick",
  truth: "truth",
  true: "truth",
  truly: "truth",
  lie: "lie",
  lies: "lie",
  lied: "lie",
  lying: "lie",
  liar: "lie",
  liars: "lie",
  deceit: "lie",
  deceitful: "lie",
  work: "work",
  works: "work",
  worked: "work",
  working: "work",
  labor: "work",
  labors: "work",
  labored: "work",
  laboring: "work",
  labour: "work",
  labours: "work",
  laboured: "work",
  toil: "work",
  toiled: "work",
  toiling: "work",
  diligent: "work",
  diligently: "work",
  lazy: "lazy",
  laziness: "lazy",
  slothful: "lazy",
  slothfulness: "lazy",
  child: "child",
  children: "child",
  tongue: "speech",
  speech: "speech",
  speeches: "speech",
  gossip: "speech",
  slander: "speech",
  slanderer: "speech",
  slanderers: "speech",
  praise: "worship",
  praised: "worship",
  praises: "worship",
  praising: "worship",
  worship: "worship",
  worships: "worship",
  worshipped: "worship",
  worshiped: "worship",
  worshipping: "worship",
  worshiping: "worship",
  save: "save",
  saves: "save",
  saved: "save",
  saving: "save",
  salvation: "save",
  savior: "save",
  saviour: "save",
  redeem: "save",
  redeemed: "save",
  redeemer: "save",
  redeems: "save",
  redemption: "save",
  grace: "grace",
  gracious: "grace",
  graciously: "grace",
  righteous: "righteous",
  righteousness: "righteous",
  justice: "justice",
  just: "justice",
  judge: "justice",
  judges: "justice",
  judged: "justice",
  judging: "justice",
  judgment: "justice",
  judgments: "justice",
  judgement: "justice",
  judgements: "justice",
  lonely: "lonely",
  hurt: "suffer",
  hurts: "suffer",
  hurting: "suffer",
  hurtful: "suffer",
  stressed: "anxiety",
  stress: "anxiety",
  stressful: "anxiety",
  sad: "sorrow",
  sadness: "sorrow",
  depressed: "sorrow",
  depression: "sorrow",
  heartbroken: "sorrow",
  guilty: "sin",
  guilt: "sin",
  born: "birth",
  birth: "birth",
  births: "birth",
  forsake: "lonely",
  forsaken: "lonely",
  forsook: "lonely",
  tempt: "tempt",
  tempts: "tempt",
  tempted: "tempt",
  tempting: "tempt",
  temptation: "tempt",
  temptations: "tempt",
  holy: "holy",
  holiness: "holy",
  sanctify: "holy",
  sanctified: "holy",
  sanctifies: "holy",
  heaven: "heaven",
  heavens: "heaven",
  heavenly: "heaven",
  hell: "hell",
  gehenna: "hell",
  hades: "hell",
  immoral: "immoral",
  immorality: "immoral",
  fornication: "immoral",
  fornications: "immoral",
  adultery: "immoral",
  adulterer: "immoral",
  adulterers: "immoral",
  adulteress: "immoral",
  drunk: "drunk",
  drunken: "drunk",
  drunkenness: "drunk",
  drunkard: "drunk",
  drunkards: "drunk",
  sober: "sober",
  soberly: "sober",
  neighbor: "neighbor",
  neighbors: "neighbor",
  neighbour: "neighbor",
  neighbours: "neighbor",
  thank: "thank",
  thanks: "thank",
  thanked: "thank",
  thankful: "thank",
  thanksgiving: "thank",
  grateful: "thank",
  doubt: "doubt",
  doubts: "doubt",
  doubted: "doubt",
  doubting: "doubt",
  unbelief: "doubt",
  weak: "weak",
  weakness: "weak",
  weaknesses: "weak",
  infirmity: "weak",
  infirmities: "weak",
  strength: "strength",
  strong: "strength",
  brother: "brother",
  brothers: "brother",
  brethren: "brother",
  spirit: "spirit",
  spirits: "spirit",
  bless: "bless",
  blessed: "bless",
  blessing: "bless",
  blessings: "bless",
  blesses: "bless",
  create: "create",
  created: "create",
  creates: "create",
  creating: "create",
  creation: "create",
  life: "life",
  lives: "life",
  sing: "sing",
  sings: "sing",
  sang: "sing",
  sung: "sing",
  singing: "sing",
  perish: "perish",
  perished: "perish",
  perishes: "perish",
  perishing: "perish",
  hate: "hate",
  hates: "hate",
  hated: "hate",
  hating: "hate",
  hatred: "hate",
  evil: "evil",
  wicked: "evil",
  wickedness: "evil",
  good: "good",
  goodness: "good",
  heart: "heart",
  hearts: "heart",
  jesus: "jesus",
  moses: "moses",
  christ: "christ",
  god: "god",
  lord: "lord",
};

/** Related lemmas added only to the word search, at a lower weight than the question itself. */
export const RELATED: Record<string, readonly string[]> = {
  suffer: [
    "afflict",
    "tribulation",
    "persecute",
    "torment",
    "anguish",
    "distress",
    "chasten",
    "sorrow",
    "pain",
    "oppress",
    "misery",
    "adversity",
    "trial",
    "groan",
    "hardship",
    "patient",
    "endure",
    "comfort",
  ],
  afflict: ["suffer", "tribulation", "distress", "oppress", "chasten"],
  fear: ["anxiety", "courage", "peace"],
  anxiety: ["fear", "peace"],
  love: ["kindness", "compassion", "mercy", "neighbor"],
  forgive: ["mercy", "sin", "repent"],
  sin: ["repent", "forgive", "evil"],
  faith: ["doubt", "save", "grace"],
  prayer: ["thank", "worship"],
  wealth: ["poor", "desire", "greedy"],
  poor: ["oppress", "justice", "widow"],
  death: ["resurrection", "heaven", "hell", "perish"],
  marriage: ["faith", "immoral"],
  anger: ["patient", "peace", "hate"],
  wisdom: ["foolish", "understanding"],
  hope: ["faith", "patient", "wait"],
  peace: ["anxiety", "rest", "comfort"],
  joy: ["hope", "worship"],
  pride: ["humble"],
  humble: ["pride"],
  enemy: ["hate", "forgive", "neighbor", "love"],
  heal: ["sick"],
  truth: ["lie"],
  work: ["lazy", "rest"],
  child: ["son", "daughter", "father", "mother"],
  speech: ["lie", "mouth"],
  worship: ["thank", "sing"],
  save: ["grace", "faith", "repent"],
  grace: ["mercy", "save"],
  repent: ["sin", "forgive"],
  justice: ["righteous", "oppress", "poor"],
  lonely: ["comfort", "widow"],
  birth: ["bethlehem"],
  sorrow: ["suffer", "comfort"],
  tempt: ["sin", "trial"],
  holy: ["spirit", "pure"],
  heaven: ["eternal", "kingdom", "hope"],
  hell: ["death", "perish", "darkness"],
  patient: ["endure", "suffer"],
  kindness: ["love", "mercy"],
  immoral: ["desire", "marriage"],
  desire: ["immoral", "wealth"],
  drunk: ["wine", "sober"],
  thank: ["worship"],
  doubt: ["faith"],
  weak: ["strength"],
  comfort: ["sorrow", "suffer", "peace"],
  hate: ["enemy", "love", "anger"],
  neighbor: ["love", "enemy"],
  bless: ["joy", "praise"],
};

const STOP = new Set(
  `a an the and or of to in on for with as by at from that this these those it its be is are was were been being am i me my we our you your he him his she her they them their not no nor but if then than so there here when where which who whom what how why do did does doing have has had having will would shall should can could may might must into unto upon thee thou thy thine ye hath hast doth dost art wilt shalt over under again about above before after out up down also very just only own same such too once bible scripture verse verses chapter chapters say says said saying mean means meaning tell tells according something anything everything someone anyone please thing things unto hither thither whereby wherein whereof thereof therein verily behold yea nay lo o oh ah ha ye ye ye`.split(
    /\s+/,
  ),
);

const NO_PLURAL = new Set(["jesus", "moses", "genesis", "ephesus", "acts"]);

function stripPlural(word: string): string {
  if (word.length <= 4 || NO_PLURAL.has(word)) return word;
  if (word.endsWith("ies") && word.length > 5) return word.slice(0, -3) + "y";
  if (
    word.endsWith("sses") ||
    word.endsWith("shes") ||
    word.endsWith("ches") ||
    word.endsWith("xes") ||
    word.endsWith("zes")
  ) {
    return word.slice(0, -2);
  }
  if (
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is") &&
    !word.endsWith("os") &&
    word.length > 5
  ) {
    return word.slice(0, -1);
  }
  return word;
}

function edIngFold(word: string): string | null {
  let stem = "";
  if (word.endsWith("ing") && word.length > 5) stem = word.slice(0, -3);
  else if (word.endsWith("ed") && word.length > 4) stem = word.slice(0, -2);
  else return null;
  if (MERGE[stem]) return MERGE[stem];
  if (MERGE[stem + "e"]) return MERGE[stem + "e"];
  if (stem.length > 3 && stem.at(-1) === stem.at(-2)) {
    const doubled = stem.slice(0, -1);
    if (MERGE[doubled]) return MERGE[doubled];
    if (doubled.length >= 4) return doubled;
  }
  if (stem.length >= 4) return stem;
  return null;
}

function stripArchaic(word: string): string | null {
  if (word.length > 5 && word.endsWith("eth")) {
    const stem = word.slice(0, -3);
    return MERGE[stem] ?? MERGE[stem + "e"] ?? (stem.length >= 4 ? stem : null);
  }
  if (word.length > 5 && word.endsWith("est")) {
    const stem = word.slice(0, -3);
    if (MERGE[stem]) return MERGE[stem];
    if (MERGE[stem + "e"]) return MERGE[stem + "e"];
  }
  return null;
}

export function lemmaWord(word: string): string {
  const direct = MERGE[word];
  if (direct) return direct;
  const archaic = stripArchaic(word);
  if (archaic) return archaic;
  const plural = stripPlural(word);
  if (plural !== word) {
    const mapped = MERGE[plural];
    if (mapped) return mapped;
    return stripArchaic(plural) ?? edIngFold(plural) ?? plural;
  }
  return edIngFold(word) ?? word;
}

export function contentTokens(text: string): string[] {
  const words = text.toLowerCase().replace(/’/g, "'").match(/[a-z']+/g);
  if (!words) return [];
  const out: string[] = [];
  for (let word of words) {
    word = word.replace(/^'+|'+$/g, "");
    if (word.endsWith("'s")) word = word.slice(0, -2);
    if (word.length < 3 || STOP.has(word)) continue;
    const lemma = lemmaWord(word);
    if (lemma.length < 3 || STOP.has(lemma)) continue;
    out.push(lemma);
  }
  return out;
}

export function expandTokens(tokens: string[]): { token: string; weight: number }[] {
  const weights = new Map<string, number>();
  const originals: string[] = [];
  for (const token of tokens) {
    if (!weights.has(token)) originals.push(token);
    weights.set(token, Math.min(3, (weights.get(token) ?? 0) + 1));
  }
  let added = 0;
  for (const token of originals) {
    for (const related of RELATED[token] ?? []) {
      if (weights.has(related)) continue;
      if (added >= 16) break;
      weights.set(related, 0.4);
      added += 1;
    }
    if (added >= 16) break;
  }
  return [...weights].map(([token, weight]) => ({ token, weight }));
}

/** Words that frame a sentence but are not the subject. Dropped only when a real subject remains. */
const QUERY_GLUE = new Set(
  `handle handl show shown explain explanation keep feel felt need help people person give look looking deal cope manag manage try tried want know think make get come let really still going through mean please something anything anybody everyone somebody wrong`.split(
    /\s+/,
  ),
);

const BROAD = new Set(["god", "lord", "jesus", "christ", "man", "men"]);

/** Turn any sentence shape into the subject words the Bible search should use. */
export function questionTokens(text: string): { token: string; weight: number }[] {
  const mapped = contentTokens(text).map((token) => (token === "alone" ? "lonely" : token));
  const unique = [...new Set(mapped)];
  if (!unique.length) {
    const only = text.toLowerCase().match(/[a-z']+/)?.[0]?.replace(/^'+|'+$/g, "") ?? "";
    if (only.length >= 3 && !STOP.has(only)) unique.push(lemmaWord(only));
  }
  const topic = unique.filter((token) => !QUERY_GLUE.has(token));
  const chosen = topic.length ? topic : unique;
  const hasSpecific = chosen.some((token) => !BROAD.has(token));
  const weighted = chosen.map((token) => ({
    token,
    weight: hasSpecific && BROAD.has(token) ? 0.35 : 1,
  }));
  const expanded = expandTokens(weighted.map((item) => item.token));
  const base = new Map(weighted.map((item) => [item.token, item.weight]));
  return expanded.map((item) => ({
    token: item.token,
    weight: base.get(item.token) ?? 0.25,
  }));
}
