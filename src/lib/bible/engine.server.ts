import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { contentTokens, questionTokens } from "./lemma.ts";
import { CORPUS_GZ_B64, META_JSON, VOCAB_JSON } from "./text-bundle.server.ts";
import type { SearchResponse, VerseHit } from "./types.ts";

type Row = { b: string; c: number; v: number; w: string };
type Posting = { doc: number; tf: number };

type Index = {
  rows: Row[];
  dim: number;
  vocab: Map<string, number>;
  wordVecs: Float32Array | null;
  vectorIdf: Float32Array | null;
  verseVecs: Float32Array | null;
  postings: Map<string, Posting[]>;
  docLen: Uint16Array;
  avgdl: number;
  bmIdf: Map<string, number>;
};

const PSALM_LABELS = new Set(
  "ALEPH BETH GIMEL DALETH HE VAV WAW ZAYIN HETH CHETH TETH YODH JOD KAPH LAMEDH LAMED MEM NUN SAMEKH AYIN PE TSADHE TZADDI QOPH KOPH RESH SHIN SIN TAV TAU".split(
    " ",
  ),
);

function cleanVerse(text: string): string {
  return text
    .replace(/\s+([A-Z]{2,8})\s*$/, (full, word: string) => (PSALM_LABELS.has(word) ? "" : full))
    .trim();
}

const packedDir = join(dirname(fileURLToPath(import.meta.url)), "packed");
const K1 = 1.2;
const B = 0.75;
const RESULT_COUNT = 8;
const FUNCTION_WORDS = new Set(
  "the a an what does how why is are about should my to of for in when who can do did was were am i you your we our and or but if this that it with from would could tell say please dont doesn't its".split(
    " ",
  ),
);

let loading: Promise<Index> | null = null;
const answerCache = new Map<string, SearchResponse>();

function asBuffer(raw: unknown): Buffer | null {
  if (raw == null || raw === "") return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  if (raw instanceof ArrayBuffer) return Buffer.from(raw);
  if (typeof raw === "string") return Buffer.from(raw);
  return null;
}

async function readPacked(name: string): Promise<Buffer | null> {
  if (process.env.NODE_ENV === "production") {
    try {
      const { useStorage } = await import("nitro/storage");
      const raw = await useStorage("assets/bible").getItemRaw(name);
      const buf = asBuffer(raw);
      if (buf) return buf;
    } catch (err) {
      console.error("Bible data storage failed", err);
    }
  }
  const local = join(packedDir, name);
  if (!existsSync(local)) return null;
  return readFileSync(local);
}

function floats(buf: Buffer): Float32Array {
  const aligned = new ArrayBuffer(buf.byteLength);
  new Uint8Array(aligned).set(buf);
  return new Float32Array(aligned);
}

async function loadIndex(): Promise<Index> {
  const rows = (JSON.parse(gunzipSync(Buffer.from(CORPUS_GZ_B64, "base64")).toString("utf8")) as Row[]).map(
    (row) => ({
      ...row,
      w: cleanVerse(row.w),
    }),
  );
  const words = JSON.parse(VOCAB_JSON) as string[];
  const meta = JSON.parse(META_JSON) as { dim: number; verses: number };
  const dim = meta.dim;
  if (rows.length !== meta.verses) throw new Error("Bible text is incomplete.");

  let wordVecs: Float32Array | null = null;
  let vectorIdf: Float32Array | null = null;
  let verseVecs: Float32Array | null = null;
  try {
    const [wordBuf, idfBuf, verseBuf] = await Promise.all([
      readPacked("word-vectors.bin"),
      readPacked("idf.bin"),
      readPacked("verse-vectors.bin"),
    ]);
    if (wordBuf && idfBuf && verseBuf) {
      const wordsV = floats(wordBuf);
      const idfV = floats(idfBuf);
      const versesV = floats(verseBuf);
      if (wordsV.length === words.length * dim && versesV.length === rows.length * dim) {
        wordVecs = wordsV;
        vectorIdf = idfV;
        verseVecs = versesV;
      }
    }
  } catch (err) {
    console.error("Bible similarity index skipped", err);
  }

  const vocab = new Map(words.map((word, i) => [word, i]));
  const postings = new Map<string, Posting[]>();
  const docLen = new Uint16Array(rows.length);
  let total = 0;
  for (let doc = 0; doc < rows.length; doc++) {
    const row = rows[doc]!;
    const tokens = contentTokens(row.w);
    docLen[doc] = tokens.length;
    total += tokens.length;
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    for (const [token, count] of tf) {
      const list = postings.get(token);
      const posting = { doc, tf: count };
      if (list) list.push(posting);
      else postings.set(token, [posting]);
    }
  }
  const avgdl = total / rows.length || 1;
  const bmIdf = new Map<string, number>();
  for (const [term, list] of postings) {
    const df = list.length;
    bmIdf.set(term, Math.log(1 + (rows.length - df + 0.5) / (df + 0.5)));
  }
  return { rows, dim, vocab, wordVecs, vectorIdf, verseVecs, postings, docLen, avgdl, bmIdf };
}

function index(): Promise<Index> {
  loading ??= loadIndex();
  return loading;
}

function looksEnglish(question: string, vocab: Map<string, number>): boolean {
  if (/[^\u0000-\u024f¿¡]/.test(question) || /[¿¡]/.test(question)) return false;
  const words = question.toLowerCase().match(/[a-z']+/g) ?? [];
  if (words.length === 0) return true;
  let known = 0;
  for (const word of words) {
    const cleaned = word.replace(/'/g, "");
    if (FUNCTION_WORDS.has(cleaned)) {
      known += 1;
      continue;
    }
    const tokens = contentTokens(cleaned);
    if (tokens.some((token) => vocab.has(token))) known += 1;
  }
  return known / words.length >= 0.5;
}

function queryVector(idx: Index, tokens: { token: string; weight: number }[]): Float32Array | null {
  if (!idx.wordVecs || !idx.vectorIdf) return null;
  const acc = new Float32Array(idx.dim);
  let used = 0;
  for (const { token, weight } of tokens) {
    if (weight < 1) continue;
    const id = idx.vocab.get(token);
    if (id === undefined) continue;
    const idf = idx.vectorIdf[id] ?? 1;
    const base = id * idx.dim;
    for (let d = 0; d < idx.dim; d++) acc[d] += idx.wordVecs[base + d]! * idf * weight;
    used += 1;
  }
  if (!used) return null;
  let norm = 0;
  for (let d = 0; d < idx.dim; d++) norm += acc[d]! * acc[d]!;
  norm = Math.sqrt(norm);
  if (norm < 1e-8) return null;
  for (let d = 0; d < idx.dim; d++) acc[d] = acc[d]! / norm;
  return acc;
}

function semanticOrder(idx: Index, query: Float32Array): number[] {
  const verseVecs = idx.verseVecs;
  if (!verseVecs) return [];
  const scored: { doc: number; score: number }[] = [];
  const { dim, rows } = idx;
  for (let doc = 0; doc < rows.length; doc++) {
    const base = doc * dim;
    let score = 0;
    for (let d = 0; d < dim; d++) score += verseVecs[base + d]! * query[d]!;
    if (score > 0.18) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 40).map((item) => item.doc);
}

function lexicalOrder(idx: Index, tokens: { token: string; weight: number }[]): number[] {
  const scores = new Map<number, number>();
  for (const { token, weight } of tokens) {
    const list = idx.postings.get(token);
    const idf = idx.bmIdf.get(token);
    if (!list || idf === undefined) continue;
    for (const { doc, tf } of list) {
      const len = idx.docLen[doc] || 1;
      const denom = tf + K1 * (1 - B + (B * len) / idx.avgdl);
      const add = idf * ((tf * (K1 + 1)) / denom) * weight;
      scores.set(doc, (scores.get(doc) ?? 0) + add);
    }
  }
  const required = tokens.filter((item) => item.weight >= 0.35).map((item) => item.token);
  if (required.length >= 2) {
    let both: Set<number> | null = null;
    for (const token of required) {
      const list = idx.postings.get(token);
      if (!list) {
        both = new Set();
        break;
      }
      const docs = new Set(list.map((posting) => posting.doc));
      both = both ? new Set([...both].filter((doc) => docs.has(doc))) : docs;
    }
    for (const doc of both ?? []) scores.set(doc, (scores.get(doc) ?? 0) + 12);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([doc]) => doc);
}

function fuse(lists: number[][]): number[] {
  const scores = new Map<number, number>();
  for (const list of lists) {
    list.forEach((doc, rank) => {
      scores.set(doc, (scores.get(doc) ?? 0) + 1 / (60 + rank + 1));
    });
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([doc]) => doc);
}

function diversify(idx: Index, ranked: number[], limit: number): number[] {
  const picked: number[] = [];
  const perChapter = new Map<string, number>();
  const skipped: number[] = [];
  for (const doc of ranked) {
    const row = idx.rows[doc]!;
    const key = `${row.b}:${row.c}`;
    const count = perChapter.get(key) ?? 0;
    if (count >= 2) {
      skipped.push(doc);
      continue;
    }
    perChapter.set(key, count + 1);
    picked.push(doc);
    if (picked.length === limit) return picked;
  }
  for (const doc of skipped) {
    picked.push(doc);
    if (picked.length === limit) break;
  }
  return picked;
}

export async function findVerses(englishQuestion: string): Promise<VerseHit[]> {
  const idx = await index();
  const tokens = questionTokens(englishQuestion);
  if (!tokens.length) return [];
  const lexical = lexicalOrder(idx, tokens);
  const vector = queryVector(idx, tokens);
  const semantic = vector ? semanticOrder(idx, vector) : [];
  let fused = fuse([lexical, semantic]);
  const required = tokens.filter((item) => item.weight >= 0.35).map((item) => item.token);
  if (required.length >= 2) {
    let both: Set<number> | null = null;
    for (const token of required) {
      const list = idx.postings.get(token);
      if (!list) {
        both = new Set();
        break;
      }
      const docs = new Set(list.map((posting) => posting.doc));
      both = both ? new Set([...both].filter((doc) => docs.has(doc))) : docs;
    }
    if (both && both.size) {
      const covered = fused.filter((doc) => both.has(doc));
      const rest = fused.filter((doc) => !both.has(doc));
      fused = [...covered, ...rest];
    }
  }
  const ranked = diversify(idx, fused, RESULT_COUNT);
  return ranked.map((doc) => {
    const row = idx.rows[doc]!;
    return { book: row.b, chapter: row.c, verse: row.v, web: row.w };
  });
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

async function grok(
  messages: { role: "system" | "user"; content: string }[],
  maxTokens: number,
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.2,
      reasoning_effort: "low",
      max_tokens: Math.max(maxTokens, 500),
      messages,
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content;
  return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

async function translateQuestion(question: string): Promise<string | null> {
  const text = await grok(
    [
      {
        role: "system",
        content:
          "Translate the user's Bible question into natural English. Return only the English question. If it is already English, return it unchanged. Do not answer it.",
      },
      { role: "user", content: question },
    ],
    80,
  );
  if (!text) return null;
  return clip(text.replace(/^["']|["']$/g, ""), 400);
}

async function summarizeVerses(
  original: string,
  english: string,
  translated: boolean,
  verses: VerseHit[],
): Promise<string | null> {
  const list = verses
    .map((verse) => {
      const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
      const parts = [`${ref}`];
      if (verse.web) parts.push(`World English Bible: ${clip(verse.web, 220)}`);
      return parts.join("\n");
    })
    .join("\n\n");
  const language = translated
    ? "Write the summary in the same language as the original question."
    : "Write the summary in English.";
  const shape = responseShape(english);
  const text = await grok(
    [
      {
        role: "system",
        content: `You summarize only the Bible verses given to you.
Rules:
- Use only those verses. Do not add other verses, teachings, history, or advice.
- Do not bring in anything that is not stated in the verses.
- If they only partly address the question, say what they do say and do not fill the gap.
- Write 2 to 4 sentences of plain prose. No title and no bullet list.
- Do not invent references. You may name a reference only if it is in the verse list.
- The question may be a bare word, a statement, a command, or a full question. Answer that wording. Do not recast every prompt as "what the Bible says about" a topic.
- ${shape}
- ${language}`,
      },
      {
        role: "user",
        content: `Original question:\n${original}\n\nEnglish question used to find the verses:\n${english}\n\nVerses:\n${list}`,
      },
    ],
    220,
  );
  if (!text) return null;
  return clip(text.replace(/^summary:\s*/i, ""), 700);
}

function responseShape(question: string): string {
  const q = question.trim().toLowerCase();
  if (/^(who|whose)\b/.test(q)) {
    return "The question asks who. Name only people or roles the verses themselves name. If they do not say who, say so.";
  }
  if (/^where\b/.test(q)) {
    return "The question asks where. Give only places named in the verses. If they name none, say so.";
  }
  if (/^when\b/.test(q)) {
    return "The question asks when. Give only times stated in the verses. If they state none, say so.";
  }
  if (/^why\b/.test(q)) {
    return "The question asks why. Give only reasons the verses state. Do not invent a cause.";
  }
  if (/^how\b/.test(q)) {
    return "The question asks how. Describe only the way or response written in the verses, not steps you add.";
  }
  if (/^(is|are|was|were|do|does|did|can|could|should|will|would)\b/.test(q)) {
    return "The question wants a yes or no. Take a side only when the verses do. Otherwise say what they say instead of forcing an answer.";
  }
  if (/^(i|i'm|im|we|my|i've|ive)\b/.test(q)) {
    return "The question is a personal statement. Say what these verses say about that condition. Do not add comfort or advice that is not written in them.";
  }
  if (/^(tell|show|give|explain|list)\b/.test(q)) {
    return "The question asks to be shown something. State what the verses say about that subject. Do not turn the answer into a list.";
  }
  return "Answer the subject of the sentence in ordinary prose, whether it is one word or a full sentence.";
}

function cacheGet(key: string): SearchResponse | null {
  const hit = answerCache.get(key);
  if (!hit) return null;
  answerCache.delete(key);
  answerCache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: SearchResponse) {
  if (answerCache.size > 40) {
    const oldest = answerCache.keys().next().value;
    if (oldest) answerCache.delete(oldest);
  }
  answerCache.set(key, value);
}

export async function answerQuestion(question: string): Promise<SearchResponse> {
  const cleaned = question.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  const key = cleaned.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const idx = await index();
  const singleWord = /^[a-zA-Z][a-zA-Z'-]*[?.!]?$/.test(cleaned);
  const englishInput = singleWord || looksEnglish(cleaned, idx.vocab);
  let english = cleaned.replace(/[?.!]+$/g, "");
  let translated = false;
  if (!englishInput) {
    const next = await translateQuestion(question);
    if (next) {
      english = next;
      translated = true;
    }
  }

  const verses = await findVerses(english);
  if (!verses.length) {
    return {
      ok: true,
      translated,
      englishQuestion: english,
      summary: null,
      verses: [],
    };
  }

  const summary = await summarizeVerses(question, english, translated, verses);
  const result: SearchResponse = {
    ok: true,
    translated,
    englishQuestion: english,
    summary,
    verses,
  };
  if (summary) cacheSet(key, result);
  return result;
}
