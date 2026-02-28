"""
Nightly training pipeline — dual-purpose module:
  • Importable: called by APScheduler at 2 AM
  • Standalone: `python nightly_train.py` to train immediately

Pipeline:
  1. Pull all phrases from SQLite
  2. Build bigram vocab → write vocab_store.json
  3. Embed each unique phrase into ChromaDB
"""

from db.database import init_db, get_all_phrases
from services.vocab import build_vocab_from_phrases, save_vocab, load_vocab
from services.vector_store import init_vector_store, embed_and_store
from services.context import get_context_tag


def run_training() -> dict:
    """
    Execute the full training pipeline.
    Returns a summary dict with phrase count and embed stats.
    """
    print("[train] Starting nightly training pipeline...")

    init_db()
    phrases = get_all_phrases()
    phrase_texts = [p["phrase"] for p in phrases]

    print(f"[train] Found {len(phrases)} phrases in database.")

    # Step 1 — Build and persist bigram vocab
    vocab = build_vocab_from_phrases(phrase_texts)
    save_vocab(vocab)
    load_vocab()
    print(f"[train] Vocab built with {len(vocab)} unique first-words.")

    # Step 2 — Embed into ChromaDB
    init_vector_store()
    added = 0
    skipped = 0
    for row in phrases:
        context_tag = get_context_tag(row["location"], row["hour_of_day"])
        was_new = embed_and_store(
            phrase=row["phrase"],
            location=row["location"],
            context_tag=context_tag,
        )
        if was_new:
            added += 1
        else:
            skipped += 1

    print(f"[train] Embedded {added} new phrases, skipped {skipped} duplicates.")
    print("[train] Training complete.")

    return {
        "phrases_in_db": len(phrases),
        "vocab_size": len(vocab),
        "newly_embedded": added,
        "duplicates_skipped": skipped,
    }


if __name__ == "__main__":
    summary = run_training()
    print("\nSummary:", summary)
