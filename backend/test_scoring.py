"""
Unit tests for the scoring module.
"""

import pytest
from datetime import datetime, timezone
from scoring import (
    score_route,
    calculate_weather_score,
    calculate_travel_score,
    calculate_amenity_score,
    calculate_mud_penalty
)


# --- Test Data ---

SAMPLE_ROUTE_EASY = {
    "id": "test_easy",
    "name": "Easy Woodland Walk",
    "trailhead": {"lat": 51.5, "lon": -0.1},
    "distance_km": 8,
    "elevation_gain_m": 100,
    "estimated_duration_hours": 2.5,
    "approx_travel_minutes": 40,
    "tags": ["woodland"],
    "amenities": [
        {
            "name": "The Test Pub",
            "lat": 51.5,
            "lon": -0.1,
            "hours": {"sat": "12:00-22:00", "sun": "12:00-20:00"}
        }
    ]
}

SAMPLE_ROUTE_EXPOSED = {
    "id": "test_exposed",
    "name": "Exposed Ridge Walk",
    "trailhead": {"lat": 51.0, "lon": -0.5},
    "distance_km": 14,
    "elevation_gain_m": 350,
    "estimated_duration_hours": 4.0,
    "approx_travel_minutes": 90,
    "tags": ["chalk", "ridgey", "exposed"],
    "amenities": []
}

SAMPLE_ROUTE_MUDDY = {
    "id": "test_muddy",
    "name": "Muddy Clay Path",
    "trailhead": {"lat": 51.6, "lon": 0.1},
    "distance_km": 10,
    "elevation_gain_m": 50,
    "estimated_duration_hours": 3.0,
    "approx_travel_minutes": 35,
    "tags": ["clay", "muddy", "woodland"],
    "amenities": []
}

GOOD_WEATHER = {
    "hourly": {
        "time": [f"2024-01-01T{h:02d}:00" for h in range(12)],
        "temperature_2m": [8.0] * 12,
        "precipitation": [0.0] * 12,
        "precipitation_probability": [5] * 12,
        "wind_speed_10m": [10.0] * 12
    }
}

BAD_WEATHER = {
    "hourly": {
        "time": [f"2024-01-01T{h:02d}:00" for h in range(12)],
        "temperature_2m": [6.0] * 12,
        "precipitation": [3.0] * 12,  # 3mm per hour = heavy rain
        "precipitation_probability": [85] * 12,
        "wind_speed_10m": [45.0] * 12  # Very windy
    }
}

MODERATE_PREFS = {
    "max_travel_minutes": 90,
    "wind_tolerance": "moderate",
    "rain_tolerance_mm_per_hr": 0.5,
    "needs_pub": True
}


# --- Test: Scenario 1 - Good weather, nearby route ---

def test_scenario_good_weather_nearby_route():
    """
    Scenario 1: Perfect day, nearby route should score > 0.75
    """
    leave_time = datetime(2024, 1, 6, 10, 0, tzinfo=timezone.utc)  # Saturday
    
    result = score_route(
        route=SAMPLE_ROUTE_EASY,
        weather=GOOD_WEATHER,
        prefs=MODERATE_PREFS,
        leave_time=leave_time
    )
    
    assert result["total_score"] > 0.75, f"Expected score > 0.75, got {result['total_score']}"
    assert result["weather_score"] > 0.7, "Weather score should be high on good day"
    assert result["travel_score"] > 0.8, "Travel score should be high for nearby route"
    assert result["mud_penalty"] < 0.2, "No mud penalty for non-muddy route in dry weather"


# --- Test: Scenario 2 - Bad weather, far route ---

def test_scenario_bad_weather_far_route():
    """
    Scenario 2: Rainy day, far route should score < 0.40
    """
    leave_time = datetime(2024, 1, 6, 10, 0, tzinfo=timezone.utc)
    prefs = {**MODERATE_PREFS, "needs_pub": False}
    
    result = score_route(
        route=SAMPLE_ROUTE_EXPOSED,
        weather=BAD_WEATHER,
        prefs=prefs,
        leave_time=leave_time
    )
    
    assert result["total_score"] < 0.40, f"Expected score < 0.40, got {result['total_score']}"
    assert result["weather_score"] < 0.3, "Weather score should be low on bad day"


# --- Test: Travel Score ---

def test_travel_score_under_half_max():
    """Travel under 50% of max should score 1.0"""
    route = {"approx_travel_minutes": 30}
    prefs = {"max_travel_minutes": 90}
    
    score = calculate_travel_score(route, prefs)
    assert score == 1.0


def test_travel_score_at_max():
    """Travel at max should score 0.0"""
    route = {"approx_travel_minutes": 90}
    prefs = {"max_travel_minutes": 90}
    
    score = calculate_travel_score(route, prefs)
    assert score == 0.0


def test_travel_score_at_75_percent():
    """Travel at 75% of max should score 0.5"""
    route = {"approx_travel_minutes": 67}  # ~75% of 90
    prefs = {"max_travel_minutes": 90}
    
    score = calculate_travel_score(route, prefs)
    assert 0.4 <= score <= 0.6  # Allow some tolerance


# --- Test: Mud Penalty ---

def test_mud_penalty_dry_non_muddy_route():
    """Non-muddy route in dry weather should have no penalty"""
    penalty = calculate_mud_penalty(SAMPLE_ROUTE_EASY, GOOD_WEATHER)
    assert penalty == 0.0


def test_mud_penalty_muddy_route_with_rain():
    """Muddy route with rain should have penalty"""
    rainy_weather = {
        "hourly": {
            "precipitation": [2.0] * 12  # Some rain
        }
    }
    penalty = calculate_mud_penalty(SAMPLE_ROUTE_MUDDY, rainy_weather)
    assert penalty > 0.3


# --- Test: Amenity Score ---

def test_amenity_score_pub_needed_and_open():
    """When pub needed and open, should score 1.0"""
    leave_time = datetime(2024, 1, 6, 10, 0, tzinfo=timezone.utc)  # Saturday
    prefs = {"needs_pub": True}
    
    score, notes = calculate_amenity_score(SAMPLE_ROUTE_EASY, prefs, leave_time)
    assert score == 1.0
    assert "open" in notes[0].lower()


def test_amenity_score_pub_needed_but_none():
    """When pub needed but route has none, should score 0.0"""
    leave_time = datetime(2024, 1, 6, 10, 0, tzinfo=timezone.utc)
    prefs = {"needs_pub": True}
    
    score, notes = calculate_amenity_score(SAMPLE_ROUTE_EXPOSED, prefs, leave_time)
    assert score == 0.0


def test_amenity_score_pub_not_needed():
    """When pub not needed, should score 1.0 regardless"""
    leave_time = datetime(2024, 1, 6, 10, 0, tzinfo=timezone.utc)
    prefs = {"needs_pub": False}
    
    score, notes = calculate_amenity_score(SAMPLE_ROUTE_EXPOSED, prefs, leave_time)
    assert score == 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
