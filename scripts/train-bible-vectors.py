"""Train domain word vectors on the whole Bible and write verse fingerprints."""

import json
import math
from collections import Counter
from pathlib import Path

import numpy as np
from gensim.models import Word2Vec

ROOT = Path("/workspace")
BUILD = ROOT / "data" / "build"
PACKED = ROOT / "src" / "lib" / "bible" / "packed"
DIM = 72

sentences = [line.split() for line in (BUILD / "chapters.txt").read_text().splitlines() if line.strip()]
print(f"training sentences: {len(sentences)}", flush=True)

model = Word2Vec(
    sentences=sentences,
    vector_size=DIM,
    window=8,
    min_count=2,
    sg=1,
    negative=8,
    epochs=8,
    workers=4,
    seed=13,
    sample=1e-3,
)
print("trained", flush=True)

vocab = list(model.wv.index_to_key)
index = {word: i for i, word in enumerate(vocab)}
word_vecs = np.vstack([model.wv[word] for word in vocab]).astype(np.float32)
norms = np.linalg.norm(word_vecs, axis=1, keepdims=True)
word_vecs /= np.clip(norms, 1e-8, None)

verse_token_lines = (BUILD / "verse-tokens.jsonl").read_text().splitlines()
df = Counter()
parsed = []
for line in verse_token_lines:
    tokens = json.loads(line)
    parsed.append(tokens)
    df.update(set(tokens))

n_docs = len(parsed)
idf = np.ones(len(vocab), dtype=np.float32)
for word, i in index.items():
    idf[i] = math.log((n_docs + 1) / (df[word] + 1)) + 1.0

verse_vecs = np.zeros((n_docs, DIM), dtype=np.float32)
empty = 0
for row, tokens in enumerate(parsed):
    acc = np.zeros(DIM, dtype=np.float32)
    for token in tokens:
        i = index.get(token)
        if i is None:
            continue
        acc += word_vecs[i] * idf[i]
    norm = float(np.linalg.norm(acc))
    if norm < 1e-8:
        empty += 1
        continue
    verse_vecs[row] = acc / norm

PACKED.mkdir(parents=True, exist_ok=True)
(PACKED / "vocab.json").write_text(json.dumps(vocab))
(PACKED / "meta.json").write_text(
    json.dumps({"dim": DIM, "verses": n_docs, "vocab": len(vocab), "emptyVerses": empty})
)
word_vecs.tofile(PACKED / "word-vectors.bin")
idf.astype(np.float32).tofile(PACKED / "idf.bin")
verse_vecs.tofile(PACKED / "verse-vectors.bin")

def neighbors(word: str, k: int = 8) -> list[str]:
    if word not in model.wv:
        return []
    return [item for item, _score in model.wv.most_similar(word, topn=k)]

print(json.dumps({"empty": empty, "vocab": len(vocab), "verses": n_docs}, indent=2))
for probe in ("suffer", "afflict", "fear", "anxiety", "love", "forgive", "wealth", "death", "faith"):
    print(probe, "->", ", ".join(neighbors(probe)))
