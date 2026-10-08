export type VerseHit = {
  book: string;
  chapter: number;
  verse: number;
  web: string;
};

export type SearchResponse =
  | {
      ok: true;
      translated: boolean;
      englishQuestion: string;
      summary: string | null;
      verses: VerseHit[];
    }
  | {
      ok: false;
      error: string;
    };
