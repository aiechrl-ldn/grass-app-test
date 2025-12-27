"""
Natural Language Query Parser

For v1: Simple keyword-based parsing that maps common phrases to preference filters.
For v2: Replace with LLM call (OpenAI/Claude) for semantic understanding.
"""

import re
from typing import Optional


def parse_query(query_text: Optional[str]) -> dict:
    """
    Parse a natural language query into preference overrides.
    
    Returns a dict that can be merged with user preferences, e.g.:
    {
        "max_travel_minutes": 60,
        "needs_pub": True,
        "difficulty": "easy"
    }
    
    TODO: Replace with LLM call for proper semantic parsing.
    """
    if not query_text:
        return {}
    
    query = query_text.lower().strip()
    overrides = {}
    
    # --- Duration parsing ---
    # "2 hour", "2-3 hours", "half day", "quick", "short"
    if re.search(r'\b(quick|short|1\s*h|1-2\s*h)\b', query):
        overrides["max_duration_hours"] = 2.0
    elif re.search(r'\b(2\s*h|2-3\s*h|couple\s+hours)\b', query):
        overrides["max_duration_hours"] = 3.0
    elif re.search(r'\b(half\s*day|3-4\s*h|4\s*h)\b', query):
        overrides["max_duration_hours"] = 4.5
    elif re.search(r'\b(full\s*day|5\s*h|longer)\b', query):
        overrides["max_duration_hours"] = 8.0
    
    # --- Distance parsing ---
    # "close", "nearby", "not too far"
    if re.search(r'\b(close|nearby|near|not\s+far|local)\b', query):
        overrides["max_travel_minutes"] = 45
    elif re.search(r'\b(medium|moderate\s+distance)\b', query):
        overrides["max_travel_minutes"] = 75
    elif re.search(r'\b(further|far|don.t\s+mind\s+travel)\b', query):
        overrides["max_travel_minutes"] = 120
    
    # --- Pub/café requirement ---
    if re.search(r'\b(pub|cafe|café|lunch|food|eat|drink|beer|coffee)\b', query):
        overrides["needs_pub"] = True
    
    # --- Difficulty/effort ---
    if re.search(r'\b(easy|gentle|relaxed|flat|accessible)\b', query):
        overrides["difficulty"] = "easy"
        overrides["max_elevation_m"] = 150
    elif re.search(r'\b(moderate|medium|some\s+hills)\b', query):
        overrides["difficulty"] = "moderate"
    elif re.search(r'\b(hard|challenging|hilly|steep)\b', query):
        overrides["difficulty"] = "hard"
        overrides["min_elevation_m"] = 300
    
    # --- Weather tolerance ---
    if re.search(r'\b(don.t\s+mind\s+rain|wet|muddy?\s+ok)\b', query):
        overrides["rain_tolerance_mm_per_hr"] = 2.0
    elif re.search(r'\b(dry|no\s+rain|hate\s+rain)\b', query):
        overrides["rain_tolerance_mm_per_hr"] = 0.1
    
    if re.search(r'\b(windy\s+ok|don.t\s+mind\s+wind)\b', query):
        overrides["wind_tolerance"] = "high"
    elif re.search(r'\b(sheltered|no\s+wind|calm)\b', query):
        overrides["wind_tolerance"] = "low"
    
    # --- Terrain/scenery ---
    if re.search(r'\b(coast|sea|beach|cliff)\b', query):
        overrides["tags_include"] = ["coastal", "clifftop"]
    elif re.search(r'\b(wood|forest|tree)\b', query):
        overrides["tags_include"] = ["woodland"]
    elif re.search(r'\b(view|panoram|ridge|hill)\b', query):
        overrides["tags_include"] = ["ridgey", "exposed"]
    elif re.search(r'\b(river|water|canal)\b', query):
        overrides["tags_include"] = ["riverside"]
    
    # --- Specific areas ---
    if re.search(r'\b(south\s*downs?)\b', query):
        overrides["region"] = "South Downs"
    elif re.search(r'\b(surrey|box\s*hill)\b', query):
        overrides["region"] = "Surrey Hills"
    elif re.search(r'\b(chiltern)\b', query):
        overrides["region"] = "Chilterns"
    elif re.search(r'\b(epping)\b', query):
        overrides["region"] = "Epping Forest"
    
    return overrides


def apply_query_filters(routes: list, query_overrides: dict) -> list:
    """
    Filter and adjust routes based on parsed query overrides.
    Returns filtered list of routes.
    """
    if not query_overrides:
        return routes
    
    filtered = []
    
    for route in routes:
        # Check duration filter
        max_dur = query_overrides.get("max_duration_hours")
        if max_dur and route.get("estimated_duration_hours", 0) > max_dur:
            continue
        
        # Check elevation filters
        max_elev = query_overrides.get("max_elevation_m")
        if max_elev and route.get("elevation_gain_m", 0) > max_elev:
            continue
        
        min_elev = query_overrides.get("min_elevation_m")
        if min_elev and route.get("elevation_gain_m", 0) < min_elev:
            continue
        
        # Check region filter
        region = query_overrides.get("region")
        if region and route.get("region", "").lower() != region.lower():
            continue
        
        # Check tags filter
        tags_include = query_overrides.get("tags_include", [])
        if tags_include:
            route_tags = route.get("tags", [])
            if not any(tag in route_tags for tag in tags_include):
                continue
        
        filtered.append(route)
    
    return filtered


# --- Test the parser ---
if __name__ == "__main__":
    test_queries = [
        "easy 2 hour walk with a pub",
        "something close with views",
        "half day hike, don't mind mud",
        "quick walk near Box Hill",
        "coastal walk, not too far",
        "challenging hilly walk in the South Downs"
    ]
    
    for q in test_queries:
        result = parse_query(q)
        print(f"\nQuery: {q}")
        print(f"Parsed: {result}")
