"""
Today Fit Scoring Module

Implements the weighted scoring algorithm for ranking routes:
- Weather fit: 0.40 weight
- Travel hassle: 0.35 weight  
- Amenity fit: 0.15 weight
- Mud penalty: -0.10 weight
"""

from datetime import datetime, timedelta
from typing import Optional


def score_route(
    route: dict,
    weather: dict,
    prefs: dict,
    leave_time: datetime
) -> dict:
    """
    Calculate the today-fit score for a route.
    
    Returns a dict with component scores and total:
    {
        "weather_score": 0.0-1.0,
        "travel_score": 0.0-1.0,
        "amenity_score": 0.0-1.0,
        "mud_penalty": 0.0-1.0,
        "total_score": 0.0-1.0,
        "weather_notes": [...],
        "amenity_notes": [...]
    }
    """
    weather_score, weather_notes = calculate_weather_score(route, weather, prefs)
    travel_score = calculate_travel_score(route, prefs)
    amenity_score, amenity_notes = calculate_amenity_score(route, prefs, leave_time)
    mud_penalty = calculate_mud_penalty(route, weather)
    
    # Weighted combination
    total = (
        (weather_score * 0.40) +
        (travel_score * 0.35) +
        (amenity_score * 0.15) -
        (mud_penalty * 0.10)
    )
    
    # Clamp to 0-1
    total = max(0.0, min(1.0, total))
    
    return {
        "weather_score": weather_score,
        "travel_score": travel_score,
        "amenity_score": amenity_score,
        "mud_penalty": mud_penalty,
        "total_score": total,
        "weather_notes": weather_notes,
        "amenity_notes": amenity_notes
    }


def calculate_weather_score(route: dict, weather: dict, prefs: dict) -> tuple[float, list[str]]:
    """
    Score weather fit based on rain and wind during walk window.
    
    Perfect score (1.0): No rain, light wind
    Decreases with: rain probability/amount, high wind on exposed routes
    """
    notes = []
    
    if not weather.get("hourly"):
        notes.append("Weather data unavailable")
        return 0.5, notes  # Neutral if we can't check
    
    hourly = weather["hourly"]
    duration_hours = route.get("estimated_duration_hours", 3)
    
    # Look at the walk window (approx travel time + duration)
    travel_mins = route.get("approx_travel_minutes", 60)
    start_hour = int(travel_mins / 60)
    end_hour = start_hour + int(duration_hours) + 1
    
    # Get relevant hours (capped to available data)
    relevant_hours = list(range(start_hour, min(end_hour + 1, len(hourly.get("precipitation", [])))))
    
    if not relevant_hours:
        return 0.5, ["Cannot determine weather window"]
    
    # Calculate rain score
    rain_tolerance = prefs.get("rain_tolerance_mm_per_hr", 0.5)
    precip = hourly.get("precipitation", [])
    precip_prob = hourly.get("precipitation_probability", [])
    
    total_precip = sum(precip[h] for h in relevant_hours if h < len(precip))
    avg_precip_per_hr = total_precip / len(relevant_hours) if relevant_hours else 0
    
    max_prob = max((precip_prob[h] for h in relevant_hours if h < len(precip_prob)), default=0)
    
    # Rain score: 1.0 if dry, decreasing with precip
    if avg_precip_per_hr <= 0.1 and max_prob < 20:
        rain_score = 1.0
        notes.append("Dry throughout")
    elif avg_precip_per_hr <= rain_tolerance:
        rain_score = 0.7
        notes.append(f"Light rain possible ({int(max_prob)}% chance)")
    elif avg_precip_per_hr <= rain_tolerance * 2:
        rain_score = 0.4
        notes.append(f"Rain likely ({int(max_prob)}% chance)")
    else:
        rain_score = 0.1
        notes.append("Heavy rain expected")
    
    # Calculate wind score
    wind_tolerance = prefs.get("wind_tolerance", "moderate")
    wind_speeds = hourly.get("wind_speed_10m", [])
    avg_wind = sum(wind_speeds[h] for h in relevant_hours if h < len(wind_speeds)) / len(relevant_hours) if relevant_hours else 0
    
    # Check if route is exposed
    is_exposed = any(tag in route.get("tags", []) for tag in ["exposed", "ridgey", "clifftop"])
    
    # Wind thresholds (km/h)
    if wind_tolerance == "low":
        wind_threshold = 15
    elif wind_tolerance == "high":
        wind_threshold = 40
    else:  # moderate
        wind_threshold = 25
    
    # Apply stricter threshold for exposed routes
    if is_exposed:
        wind_threshold *= 0.7
    
    if avg_wind <= wind_threshold * 0.5:
        wind_score = 1.0
        notes.append("Calm conditions")
    elif avg_wind <= wind_threshold:
        wind_score = 0.7
        if is_exposed:
            notes.append(f"Breezy on the ridge ({int(avg_wind)} km/h)")
        else:
            notes.append(f"Light breeze ({int(avg_wind)} km/h)")
    elif avg_wind <= wind_threshold * 1.5:
        wind_score = 0.4
        notes.append(f"Windy ({int(avg_wind)} km/h)")
    else:
        wind_score = 0.1
        notes.append(f"Very windy ({int(avg_wind)} km/h)")
    
    # Combine rain and wind (rain matters more)
    combined = (rain_score * 0.65) + (wind_score * 0.35)
    
    return combined, notes


def calculate_travel_score(route: dict, prefs: dict) -> float:
    """
    Score travel hassle based on travel time vs max preference.
    
    1.0 if under 50% of max
    Linear decrease to 0 at max
    0 if over max (though these should be filtered out)
    """
    travel_mins = route.get("approx_travel_minutes", 60)
    max_mins = prefs.get("max_travel_minutes", 90)
    
    if travel_mins >= max_mins:
        return 0.0
    
    ratio = travel_mins / max_mins
    
    if ratio <= 0.5:
        return 1.0
    else:
        # Linear from 1.0 at 50% to 0.0 at 100%
        return 1.0 - ((ratio - 0.5) * 2)


def calculate_amenity_score(route: dict, prefs: dict, leave_time: datetime) -> tuple[float, list[str]]:
    """
    Score amenity fit based on whether pubs/cafes are open during walk.
    
    1.0 if confirmed open during ETA window
    0.5 if hours uncertain  
    0.0 if known closed or no amenities when needed
    """
    notes = []
    needs_pub = prefs.get("needs_pub", False)
    
    amenities = route.get("amenities", [])
    
    if not needs_pub:
        # User doesn't need amenities, give full score
        return 1.0, []
    
    if not amenities:
        notes.append("No amenities on this route")
        return 0.0, notes
    
    # Check if any pub/cafe seems open
    # For v1: simple heuristic based on day of week and stored hours
    day_name = leave_time.strftime("%a").lower()  # 'sat', 'sun', etc.
    
    for amenity in amenities:
        hours = amenity.get("hours", {})
        if not hours:
            # No hours data, be optimistic
            notes.append(f"{amenity['name']} — expected open")
            return 0.5, notes
        
        day_hours = hours.get(day_name)
        if day_hours:
            notes.append(f"{amenity['name']} open {day_hours}")
            return 1.0, notes
    
    # No matching hours found
    notes.append("Amenity hours uncertain")
    return 0.3, notes


def calculate_mud_penalty(route: dict, weather: dict) -> float:
    """
    Calculate mud penalty based on route surface and recent rain.
    
    Returns 0.0-1.0 (higher = more mud penalty)
    
    TODO: In future, use 48-hour rainfall history. For now, use today's rain.
    """
    # Check if route is mud-prone
    is_muddy_surface = any(tag in route.get("tags", []) for tag in ["clay", "muddy"])
    
    if not is_muddy_surface:
        return 0.0
    
    # Check precipitation
    hourly = weather.get("hourly", {})
    precip = hourly.get("precipitation", [])
    
    if not precip:
        # No data, assume some risk on muddy routes
        return 0.3
    
    # Sum of today's rain (rough proxy for mud)
    total_rain = sum(precip[:12])  # First 12 hours
    
    if total_rain < 1:
        return 0.1  # Minor risk
    elif total_rain < 5:
        return 0.5  # Moderate mud likely
    else:
        return 1.0  # Very muddy


def generate_summary(route: dict, weather: dict, score_result: dict, leave_time: datetime) -> str:
    """
    Generate a plain-English summary for the route card.
    
    Format: "[Weather]. [Wind if notable]. [Mud if applicable]. [Amenity window]."
    """
    parts = []
    
    # Weather notes
    weather_notes = score_result.get("weather_notes", [])
    if weather_notes:
        # Pick the most important weather note
        for note in weather_notes:
            if "dry" in note.lower() or "rain" in note.lower():
                parts.append(note)
                break
        
        # Add wind note if different
        for note in weather_notes:
            if "wind" in note.lower() or "breeze" in note.lower() or "calm" in note.lower():
                if note not in parts:
                    parts.append(note)
                break
    
    # Mud note
    if score_result.get("mud_penalty", 0) > 0.3:
        parts.append("Mud likely after recent rain")
    
    # Amenity notes
    amenity_notes = score_result.get("amenity_notes", [])
    if amenity_notes:
        parts.append(amenity_notes[0])
    
    if not parts:
        parts.append("Good conditions expected")
    
    return ". ".join(parts) + "."
