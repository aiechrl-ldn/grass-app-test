"""
Unit tests for JSON decoding of /recommendations response.
"""

import pytest
import json
from pydantic import ValidationError
from main import RecommendationsResponse, RouteCard, RouteMap, POI


VALID_RESPONSE_JSON = """
{
  "cards": [
    {
      "route_id": "south_downs_amberley_loop",
      "title": "Amberley Downs & River Arun",
      "hero_image_url": "https://example.com/image.jpg",
      "summary": "Dry for about 2h20. Breezy on the ridge. Pub serving 12–3.",
      "depart_by_iso": "2025-12-27T09:22:00Z",
      "today_fit": 0.78,
      "duration_hours": 3.5,
      "elevation_gain_m": 320,
      "distance_km": 12.4,
      "map": {
        "polyline": "enc:test",
        "start_station": "London Victoria",
        "trailhead_station": "Amberley",
        "bailout_station": "Arundel",
        "pois": [{"name": "The Bridge Inn", "lat": 50.9, "lon": -0.54}]
      }
    }
  ]
}
"""

INVALID_RESPONSE_MISSING_FIELD = """
{
  "cards": [
    {
      "route_id": "test",
      "title": "Test Route"
    }
  ]
}
"""

EMPTY_CARDS_RESPONSE = """
{
  "cards": []
}
"""


def test_valid_response_decodes():
    """Valid response JSON should decode without error."""
    data = json.loads(VALID_RESPONSE_JSON)
    response = RecommendationsResponse(**data)
    
    assert len(response.cards) == 1
    card = response.cards[0]
    assert card.route_id == "south_downs_amberley_loop"
    assert card.today_fit == 0.78
    assert card.map.trailhead_station == "Amberley"
    assert len(card.map.pois) == 1
    assert card.map.pois[0].name == "The Bridge Inn"


def test_invalid_response_raises_error():
    """Response missing required fields should raise ValidationError."""
    data = json.loads(INVALID_RESPONSE_MISSING_FIELD)
    
    with pytest.raises(ValidationError):
        RecommendationsResponse(**data)


def test_empty_cards_decodes():
    """Response with empty cards array should decode."""
    data = json.loads(EMPTY_CARDS_RESPONSE)
    response = RecommendationsResponse(**data)
    
    assert len(response.cards) == 0


def test_poi_model():
    """POI model should decode correctly."""
    poi = POI(name="Test Pub", lat=51.5, lon=-0.1)
    assert poi.name == "Test Pub"
    assert poi.lat == 51.5


def test_route_map_optional_bailout():
    """RouteMap with null bailout station should decode."""
    map_data = {
        "polyline": "enc:test",
        "start_station": "Victoria",
        "trailhead_station": "Test",
        "bailout_station": None,
        "pois": []
    }
    route_map = RouteMap(**map_data)
    assert route_map.bailout_station is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
