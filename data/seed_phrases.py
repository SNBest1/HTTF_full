"""
Seed the database with 15 demo phrases spread across all 4 locations
and time-of-day bands. Run once via:  python -m data.seed_phrases

The function is idempotent — it skips seeding if any phrases already exist.
"""

from db.database import init_db, insert_phrase, count_phrases

SEED_PHRASES: list[tuple[str, str, int]] = [
    # (phrase, location, hour_of_day)
    # Home — morning/evening
    ("Good morning, I need breakfast", "Home", 8),
    ("I want to watch TV please", "Home", 19),
    ("I need to use the bathroom", "Home", 7),
    ("Can you help me get dressed", "Home", 9),
    # School — morning/afternoon
    ("I need help with my work", "School", 10),
    ("I want a break please", "School", 11),
    ("I need water please", "School", 14),
    ("Can I go to the bathroom", "School", 13),
    # Hospital — various hours
    ("I am in pain", "Hospital", 3),
    ("I need a nurse please", "Hospital", 14),
    ("I feel sick", "Hospital", 22),
    ("I want my family here", "Hospital", 16),
    # Work — daytime
    ("I need a break", "Work", 10),
    ("I want lunch please", "Work", 12),
    ("I need help with this task", "Work", 15),
]


def seed() -> None:
    init_db()
    if count_phrases() > 0:
        print("Database already has phrases — skipping seed.")
        return

    for phrase, location, hour in SEED_PHRASES:
        insert_phrase(phrase, location, hour)

    print(f"Seeded {len(SEED_PHRASES)} phrases into the database.")


if __name__ == "__main__":
    seed()
