import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { contentTokens } from "../src/lib/bible/lemma.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "data", "raw");
const buildDir = join(root, "data", "build");
const packedDir = join(root, "src", "lib", "bible", "packed");

function verseMap(book) {
  const chapters = new Map();
  for (const chapter of book.chapters ?? []) {
    const verses = new Map();
    for (const verse of chapter.verses ?? []) {
      const text = String(verse.text ?? "").replace(/\s+/g, " ").trim();
      if (text) verses.set(verse.number, text);
    }
    chapters.set(chapter.chapter, verses);
  }
  return chapters;
}

const web = JSON.parse(await readFile(join(rawDir, "web.json"), "utf8"));

/** @type {{b:string,c:number,v:number,w:string}[]} */
const rows = [];
/** @type {string[][]} */
const verseTokens = [];
const WINDOW = 36;
const STRIDE = 18;
/** @type {string[]} */
const chapterLines = [];

for (const book of web.books) {
  const webChapters = verseMap(book);
  const chapterNumbers = [...webChapters.keys()].sort((a, b) => a - b);
  const bookTokens = [];
  for (const chapter of chapterNumbers) {
    const webVerses = webChapters.get(chapter) ?? new Map();
    const verseNumbers = [...webVerses.keys()].sort((a, b) => a - b);
    for (const verse of verseNumbers) {
      const w = webVerses.get(verse) ?? "";
      if (!w) continue;
      const tokens = contentTokens(w);
      rows.push({ b: book.englishName, c: chapter, v: verse, w });
      verseTokens.push(tokens);
      bookTokens.push(...tokens);
    }
  }
  for (let i = 0; i < bookTokens.length; i += STRIDE) {
    const slice = bookTokens.slice(i, i + WINDOW);
    if (slice.length >= 8) chapterLines.push(slice.join(" "));
    if (i + WINDOW >= bookTokens.length) break;
  }
}

await mkdir(buildDir, { recursive: true });
await mkdir(packedDir, { recursive: true });

const corpus = gzipSync(Buffer.from(JSON.stringify(rows)));
await writeFile(join(packedDir, "corpus.json.gz"), corpus);

const tokenStream = createWriteStream(join(buildDir, "verse-tokens.jsonl"));
for (const tokens of verseTokens) tokenStream.write(`${JSON.stringify(tokens)}\n`);
await new Promise((resolve, reject) => {
  tokenStream.end(() => resolve());
  tokenStream.on("error", reject);
});
await writeFile(join(buildDir, "chapters.txt"), chapterLines.join("\n"));

const suffering = rows.find((row) => row.b === "Romans" && row.c === 8 && row.v === 18);
console.log(
  JSON.stringify(
    {
      verses: rows.length,
      chapters: chapterLines.length,
      corpusBytes: corpus.length,
      romans818: suffering,
      romansTokens: suffering
        ? contentTokens(suffering.w).slice(0, 24)
        : [],
    },
    null,
    2,
  ),
);
