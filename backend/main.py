"""
Go-Now Walking App Backend
FastAPI service providing route recommendations based on weather, travel, and user preferences.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import json
from pathlib import Path

from scoring import score_route, generate_summary
from weather import get_weather_forecast
from nlp import parse_query, apply_query_filters

app = FastAPI(title="Go-Now API", version="0.1.0")

# Allow iOS app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---

class UserLocation(BaseModel):
    lat: float
    lon: float
    leave_after_iso: Optional[str] = None


class UserPreferences(BaseModel):
    max_travel_minutes: int = 90
    wind_tolerance: str = "moderate"  # "low", "moderate", "high"
    rain_tolerance_mm_per_hr: float = 0.5
    needs_pub: bool = False


class RecommendationsRequest(BaseModel):
    user: UserLocation
    prefs: UserPreferences
    query_text: Optional[str] = None


class POI(BaseModel):
    name: str
    lat: float
    lon: float


class RouteMap(BaseModel):
    polyline: str
    start_station: str
    trailhead_station: str
    bailout_station: Optional[str] = None
    pois: list[POI]


class RouteCard(BaseModel):
    route_id: str
    title: str
    hero_image_url: str
    summary: str
    depart_by_iso: str
    today_fit: float
    duration_hours: float
    elevation_gain_m: int
    distance_km: float
    map: RouteMap


class RecommendationsResponse(BaseModel):
    cards: list[RouteCard]


# --- Load Routes ---

def load_routes() -> list[dict]:
    routes_path = Path(__file__).parent / "routes.json"
    with open(routes_path) as f:
        return json.load(f)


# --- Endpoints ---

@app.get("/")
def root():
    return {
        "message": "Go-Now API is running",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(request: RecommendationsRequest):
    """
    Main endpoint: returns 3-6 route cards ranked by today-fit score.
    """
    routes = load_routes()
    
    # Parse natural language query and get preference overrides
    query_overrides = parse_query(request.query_text)
    
    # Apply query-based filters to routes
    routes = apply_query_filters(routes, query_overrides)
    
    # Merge query overrides into preferences
    prefs_dict = request.prefs.model_dump()
    if "max_travel_minutes" in query_overrides:
        prefs_dict["max_travel_minutes"] = query_overrides["max_travel_minutes"]
    if "needs_pub" in query_overrides:
        prefs_dict["needs_pub"] = query_overrides["needs_pub"]
    if "rain_tolerance_mm_per_hr" in query_overrides:
        prefs_dict["rain_tolerance_mm_per_hr"] = query_overrides["rain_tolerance_mm_per_hr"]
    if "wind_tolerance" in query_overrides:
        prefs_dict["wind_tolerance"] = query_overrides["wind_tolerance"]
    
    # Parse leave time or default to now
    if request.user.leave_after_iso:
        try:
            leave_time = datetime.fromisoformat(request.user.leave_after_iso.replace('Z', '+00:00'))
        except ValueError:
            leave_time = datetime.now(timezone.utc)
    else:
        leave_time = datetime.now(timezone.utc)
    
    # Score each route
    scored_routes = []
    for route in routes:
        # Skip routes that exceed max travel time
        if route.get("approx_travel_minutes", 999) > prefs_dict["max_travel_minutes"]:
            continue
        
        # Fetch weather for this route's trailhead
        weather = await get_weather_forecast(
            lat=route["trailhead"]["lat"],
            lon=route["trailhead"]["lon"],
            hours_ahead=8
        )
        
        # Calculate score
        score_result = score_route(
            route=route,
            weather=weather,
            prefs=prefs_dict,
            leave_time=leave_time
        )
        
        # Generate human-readable summary
        summary = generate_summary(route, weather, score_result, leave_time)
        
        # Calculate depart-by time (leave_time for now, could be smarter)
        depart_by = leave_time
        
        # Build POIs from amenities
        pois = [
            POI(name=a["name"], lat=a["lat"], lon=a["lon"])
            for a in route.get("amenities", [])
        ]
        
        # Build the card
        card = RouteCard(
            route_id=route["id"],
            title=route["name"],
            hero_image_url=route["hero_image_url"],
            summary=summary,
            depart_by_iso=depart_by.isoformat(),
            today_fit=round(score_result["total_score"], 2),
            duration_hours=route["estimated_duration_hours"],
            elevation_gain_m=int(route["elevation_gain_m"]),
            distance_km=route["distance_km"],
            map=RouteMap(
                polyline=route["polyline"],
                start_station=route["start_station"],
                trailhead_station=route["trailhead_station"],
                bailout_station=route["bailout_stations"][0] if route.get("bailout_stations") else None,
                pois=pois
            )
        )
        
        scored_routes.append((score_result["total_score"], card))
    
    # Sort by score descending and take top 6
    scored_routes.sort(key=lambda x: x[0], reverse=True)
    top_cards = [card for _, card in scored_routes[:6]]
    
    return RecommendationsResponse(cards=top_cards)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
