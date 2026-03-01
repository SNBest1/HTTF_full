"""
GET /analytics/heatmap  — phrase frequency by hour × location
GET /analytics/summary  — aggregate statistics dashboard
"""

from fastapi import APIRouter
from collections import Counter

from models.schemas import HeatmapResponse, HeatmapEntry, SummaryResponse
from db.database import get_all_phrases, get_autocomplete_stats

router = APIRouter(prefix="/analytics")


@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap() -> HeatmapResponse:
    phrases = get_all_phrases()
    word_counts: Counter[str] = Counter()
    for p in phrases:
        for word in p["phrase"].split():
            word_counts[word.lower()] += 1
    data = [
        HeatmapEntry(word=word, count=count)
        for word, count in word_counts.most_common(50)
    ]
    return HeatmapResponse(data=data)


@router.get("/summary", response_model=SummaryResponse)
def get_summary() -> SummaryResponse:
    phrases = get_all_phrases()
    total = len(phrases)
    total_suggestions, accepted = get_autocomplete_stats()

    acceptance_rate = (accepted / total_suggestions) if total_suggestions > 0 else 0.0

    phrase_counter: Counter[str] = Counter(p["phrase"] for p in phrases)
    top_phrases = [phrase for phrase, _ in phrase_counter.most_common(5)]

    location_counter: Counter[str] = Counter(p["location"] for p in phrases)
    top_locations = dict(location_counter.most_common(10))

    return SummaryResponse(
        total_phrases=total,
        total_suggestions=total_suggestions,
        acceptance_rate=round(acceptance_rate, 4),
        top_phrases=top_phrases,
        top_locations=top_locations,
    )
