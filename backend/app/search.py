"""Searching samples.

The search box understands plain words and a few shortcuts:
    "watery"      -> any sample whose project, description, pen, pig ID ... contains "watery"
    "pen 3"       -> pen is exactly 3
    "#2"          -> sample # is 2
    "day 14"      -> trial day is 14
    "pig 76"      -> pig ID is exactly 76
    "score 2"     -> final score is 2
Words are combined, so "pen 3 day 14" finds Pen 3 samples on trial day 14.
"""

from __future__ import annotations

from typing import Any, Iterable

SHORTCUTS = {"pen", "day", "pig", "score"}


def _parse(q: str) -> tuple[dict[str, str], list[str]]:
    exact: dict[str, str] = {}
    words: list[str] = []
    tokens = q.lower().split()
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok in SHORTCUTS and i + 1 < len(tokens):
            exact[tok] = tokens[i + 1]
            i += 2
            continue
        if tok.startswith("#") and tok[1:].isdigit():
            exact["#"] = tok[1:]
        elif tok:
            words.append(tok)
        i += 1
    return exact, words


def _haystack(s: dict[str, Any]) -> str:
    return " ".join(
        str(v)
        for v in (
            s.get("project_name", ""),
            f"pen {s['pen']} #{s['sample_no']}",
            f"pig {s['pig_id']}",
            f"day {s['trial_day']}",
            f"score {s['final_score']}",
            s.get("description", ""),
        )
    ).lower()


def filter_samples(
    samples: Iterable[dict[str, Any]],
    q: str | None = None,
    pen: str | None = None,
    trial_day: int | None = None,
    score: int | None = None,
) -> list[dict[str, Any]]:
    exact, words = _parse(q or "")
    out = []
    for s in samples:
        if pen is not None and str(s["pen"]).lower() != pen.strip().lower():
            continue
        if trial_day is not None and s["trial_day"] != trial_day:
            continue
        if score is not None and s["final_score"] != score:
            continue
        if "pen" in exact and str(s["pen"]).lower() != exact["pen"]:
            continue
        if "#" in exact and str(s["sample_no"]) != exact["#"]:
            continue
        if "day" in exact and str(s["trial_day"]) != exact["day"]:
            continue
        if "pig" in exact and str(s["pig_id"]).lower() != exact["pig"]:
            continue
        if "score" in exact and str(s["final_score"]) != exact["score"]:
            continue
        if words:
            hay = _haystack(s)
            if not all(w in hay for w in words):
                continue
        out.append(s)
    return out
