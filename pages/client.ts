import { contentTokens, questionTokens } from "../src/lib/bible/lemma.ts";

type Row = { b: string; c: number; v: number; w: string };
type Posting = { doc: number; tf: number };

const K1 = 1.2;
const B = 0.75;

let rows: Row[] = [];
let postings = new Map<string, Posting[]>();
let docLen: Uint16Array = new Uint16Array(0);
let avgdl = 1;
let bmIdf = new Map<string, number>();

async function loadBible(): Promise<void> {
  const response = await fetch("/corpus.json.gz");
  if (!response.ok) throw new Error("Bible text is not available.");
  const compressed = await response.arrayBuffer();
  const text = await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip")),
  ).text();
  rows = JSON.parse(text) as Row[];
  postings = new Map();
  docLen = new Uint16Array(rows.length);
  let total = 0;
  for (let doc = 0; doc < rows.length; doc++) {
    const tokens = contentTokens(rows[doc]!.w);
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
  avgdl = total / rows.length || 1;
  bmIdf = new Map();
  for (const [term, list] of postings) {
    const df = list.length;
    bmIdf.set(term, Math.log(1 + (rows.length - df + 0.5) / (df + 0.5)));
  }
}

function search(question: string): Row[] {
  const tokens = questionTokens(question);
  if (!tokens.length) return [];
  const scores = new Map<number, number>();
  for (const { token, weight } of tokens) {
    const list = postings.get(token);
    const idf = bmIdf.get(token);
    if (!list || idf === undefined) continue;
    for (const { doc, tf } of list) {
      const len = docLen[doc] || 1;
      const denom = tf + K1 * (1 - B + (B * len) / avgdl);
      scores.set(doc, (scores.get(doc) ?? 0) + idf * ((tf * (K1 + 1)) / denom) * weight);
    }
  }
  const required = tokens.filter((item) => item.weight >= 0.35).map((item) => item.token);
  if (required.length >= 2) {
    let both: Set<number> | null = null;
    for (const token of required) {
      const list = postings.get(token);
      if (!list) {
        both = new Set();
        break;
      }
      const docs = new Set(list.map((posting) => posting.doc));
      both = both ? new Set([...both].filter((doc) => docs.has(doc))) : docs;
    }
    for (const doc of both ?? []) scores.set(doc, (scores.get(doc) ?? 0) + 12);
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([doc]) => doc);
  const picked: number[] = [];
  const perChapter = new Map<string, number>();
  for (const doc of ranked) {
    const row = rows[doc]!;
    const key = `${row.b}:${row.c}`;
    const count = perChapter.get(key) ?? 0;
    if (count >= 2) continue;
    perChapter.set(key, count + 1);
    picked.push(doc);
    if (picked.length === 8) break;
  }
  return picked.map((doc) => rows[doc]!);
}

const form = document.querySelector("form");
const input = document.querySelector("textarea");
const status = document.querySelector("[data-status]");
const answer = document.querySelector("[data-answer]");
const button = document.querySelector("button[type=submit]");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = input instanceof HTMLTextAreaElement ? input.value.trim() : "";
  if (question.length < 2 || !answer || !status) return;
  status.textContent = "";
  const hits = search(question);
  if (!hits.length) {
    answer.innerHTML = `<p class="muted">No verses matched. Try a subject such as love, fear, or forgiveness.</p>`;
    return;
  }
  answer.innerHTML = `<h2>Verses</h2><ol>${hits
    .map(
      (row) =>
        `<li><p class="ref">${row.b} ${row.c}:${row.v}</p><p>${escapeHtml(row.w)}</p></li>`,
    )
    .join("")}</ol>`;
  answer.scrollIntoView({ behavior: "smooth", block: "start" });
});

for (const chip of document.querySelectorAll<HTMLButtonElement>("[data-q]")) {
  chip.addEventListener("click", () => {
    if (!(input instanceof HTMLTextAreaElement)) return;
    input.value = chip.dataset.q ?? "";
    form?.requestSubmit();
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;");
}

loadBible()
  .then(() => {
    if (button instanceof HTMLButtonElement) button.disabled = false;
    if (status) status.textContent = "";
  })
  .catch(() => {
    if (status) status.textContent = "Bible text is not available.";
  });
