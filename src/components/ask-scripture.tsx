import { useState } from "react";
import { Search } from "lucide-react";
import { askScripture } from "@/lib/bible/search.functions";
import type { SearchResponse } from "@/lib/bible/types";

const EXAMPLES = [
  { label: "Why we suffer", question: "Why do we suffer?" },
  { label: "How to forgive", question: "How can I forgive?" },
  { label: "I am afraid", question: "I am afraid" },
];

type Ready = Extract<SearchResponse, { ok: true }>;

export function AskScripture({ embed }: { embed: boolean }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Ready | null>(null);

  async function submit(next: string) {
    const trimmed = next.trim();
    if (trimmed.length < 2 || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await askScripture({ data: { question: trimmed } });
      if (!response.ok) {
        setError(response.error);
      } else {
        setResult(response);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("answer")?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={embed ? "px-4 py-6" : "px-4 py-10 sm:px-6 sm:py-16"}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <p className="font-serif text-sm text-muted">Apologia</p>
          <img
            src="/bobby-the-bible.png"
            alt=""
            width={1144}
            height={1406}
            className={embed ? "h-36 w-auto" : "h-48 w-auto sm:h-60"}
          />
          <h1 className="font-display text-4xl font-medium text-balance text-ink sm:text-5xl">
            Bobby the Bible
          </h1>
          <p className="font-serif text-lg text-muted">What does the Bible say?</p>
        </header>

        <form
          className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(question);
          }}
        >
          <label className="sr-only" htmlFor="question">
            Your question
          </label>
          <textarea
            id="question"
            name="question"
            rows={2}
            maxLength={400}
            value={question}
            placeholder="What does the Bible say about suffering?"
            className="min-h-20 w-full resize-y bg-transparent px-1 py-1 font-serif text-lg text-ink placeholder:text-muted"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit(question);
              }
            }}
          />
          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap">
              {EXAMPLES.map((example) => (
                <button
                  key={example.question}
                  type="button"
                  className="min-h-11 rounded-full bg-bg px-3 font-serif text-sm whitespace-nowrap text-ink"
                  onClick={() => {
                    setQuestion(example.question);
                    void submit(example.question);
                  }}
                >
                  {example.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={pending || question.trim().length < 2}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 font-display text-base font-medium text-accent-fg disabled:opacity-50"
            >
              <Search className="size-4" aria-hidden="true" />
              {pending ? "Looking" : "Ask"}
            </button>
          </div>
        </form>

        <p className="sr-only" role="status">
          {pending ? "Searching the Bible" : ""}
        </p>

        {error ? (
          <p className="font-serif text-accent" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <section id="answer" className="flex flex-col gap-8" aria-live="polite">
            <Summary result={result} />
            <VerseList result={result} />
          </section>
        ) : null}

        <p className="text-center font-serif text-sm text-muted">World English Bible</p>
      </div>
    </main>
  );
}

function Summary({ result }: { result: Ready }) {
  return (
    <div>
      <h2 className="font-display text-base font-medium text-accent">In short</h2>
      {result.summary ? (
        <p className="mt-3 font-serif text-xl text-pretty text-ink italic">{result.summary}</p>
      ) : (
        <p className="mt-3 font-serif text-lg text-pretty text-muted">
          {result.verses.length
            ? "A short summary could not be written just now. The verses below are the answer."
            : "No related verses turned up. Try a subject such as suffering, forgiveness, or fear."}
        </p>
      )}
      {result.translated ? (
        <p className="mt-3 font-serif text-sm text-muted">Searched as “{result.englishQuestion}”.</p>
      ) : null}
    </div>
  );
}

function VerseList({ result }: { result: Ready }) {
  if (!result.verses.length) return null;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-base font-medium text-accent">Verses</h2>
      <ol className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {result.verses.map((verse) => (
          <li
            key={`${verse.book}-${verse.chapter}-${verse.verse}`}
            className="border-t border-line px-5 py-5 first:border-t-0"
          >
            <p className="font-display text-base font-medium text-accent">
              {verse.book} {verse.chapter}:{verse.verse}
            </p>
            {verse.web ? (
              <p className="mt-2 font-serif text-lg text-pretty text-ink">{verse.web}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
