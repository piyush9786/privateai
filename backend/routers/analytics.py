import json
from collections import defaultdict

from fastapi import APIRouter

from db import db_get_analytics_summary

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary(days: int = 7):
    """Real, aggregated analytics from actual recorded chat turns.

    Every number here comes from message_events rows written at the moment
    a real chat turn completed — no synthetic data, no filled-in averages
    for days with zero traffic (those days just don't appear).
    """
    events = db_get_analytics_summary(days=days)

    total_turns = len(events)
    avg_latency_ms = round(sum(e["latency_ms"] for e in events) / total_turns) if total_turns else 0

    by_day = defaultdict(int)
    by_model = defaultdict(int)
    tool_usage = defaultdict(int)
    latency_by_day = defaultdict(list)

    for e in events:
        day = e["created_at"][:10]
        by_day[day] += 1
        by_model[e["model"]] += 1
        latency_by_day[day].append(e["latency_ms"])
        try:
            tools = json.loads(e["tool_calls"])
        except (json.JSONDecodeError, TypeError):
            tools = []
        for t in tools:
            tool_usage[t] += 1

    daily_volume = [{"date": d, "turns": c} for d, c in sorted(by_day.items())]
    daily_latency = [
        {"date": d, "avg_latency_ms": round(sum(v) / len(v))}
        for d, v in sorted(latency_by_day.items())
    ]
    model_usage = [{"model": m, "turns": c} for m, c in sorted(by_model.items(), key=lambda x: -x[1])]
    tool_usage_list = [{"tool": t, "count": c} for t, c in sorted(tool_usage.items(), key=lambda x: -x[1])]

    return {
        "total_turns": total_turns,
        "avg_latency_ms": avg_latency_ms,
        "daily_volume": daily_volume,
        "daily_latency": daily_latency,
        "model_usage": model_usage,
        "tool_usage": tool_usage_list,
    }
