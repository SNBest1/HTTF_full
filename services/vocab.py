"""
Vocabulary service — builds a bigram frequency map from logged phrases
and provides next-word prediction.

Bigram key format: "word1|word2"
Pipe delimiter chosen to avoid collision with single-word keys.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

VOCAB_PATH = Path(__file__).parent.parent / "vocab_store.json"

# Module-level singleton loaded at startup
_vocab: dict[str, dict[str, int]] = {}


def _tokenize(phrase: str) -> list[str]:
    """Lowercase and split phrase into words, stripping punctuation."""
    return re.findall(r"[a-z']+", phrase.lower())


def build_vocab_from_phrases(phrases: list[str]) -> dict[str, dict[str, int]]:
    """
    Build a bigram frequency map from a list of phrase strings.
    Returns: { "word1": {"word2": count, "word3": count, ...}, ... }
    The outer key is the first word; inner dict maps next-words to counts.
    """
    bigrams: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for phrase in phrases:
        tokens = _tokenize(phrase)
        for i in range(len(tokens) - 1):
            w1, w2 = tokens[i], tokens[i + 1]
            bigrams[w1][w2] += 1

    # Convert to plain dicts for JSON serialisation
    return {k: dict(v) for k, v in bigrams.items()}


def save_vocab(vocab: dict[str, dict[str, int]]) -> None:
    """Persist the vocab map to vocab_store.json."""
    with open(VOCAB_PATH, "w") as f:
        json.dump(vocab, f, indent=2)


def load_vocab() -> None:
    """Load vocab_store.json into the module-level singleton."""
    global _vocab
    if VOCAB_PATH.exists():
        with open(VOCAB_PATH) as f:
            _vocab = json.load(f)
        print(f"[vocab] Loaded {len(_vocab)} bigram entries.")
    else:
        _vocab = {}
        print("[vocab] No vocab_store.json found — predictions will be empty until training.")


def predict_next_words(partial_input: str, n: int = 2) -> list[str]:
    """
    Given a partial input string, find the last word and return the top-n
    most frequent words that follow it in the training corpus.
    """
    if not _vocab:
        return []

    tokens = _tokenize(partial_input)
    if not tokens:
        return []

    last_word = tokens[-1]
    candidates: dict[str, int] = _vocab.get(last_word, {})
    if not candidates:
        return []

    sorted_words = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
    return [word for word, _ in sorted_words[:n]]
