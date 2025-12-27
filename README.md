# Go-Now Walking App

A "go now" walking app for Londoners that shows curated walks doable today, based on live weather, travel time, and your preferences.

## Project Structure

```
├── backend/           # Python FastAPI backend
│   ├── main.py       # API endpoints
│   ├── scoring.py    # Today-fit scoring algorithm
│   ├── weather.py    # Open-Meteo weather integration
│   ├── routes.json   # Curated route data
│   └── test_*.py     # Unit tests
│
└── ios/GoNow/        # SwiftUI iOS app
    └── GoNow/
        ├── Models/   # Route, Preferences
        ├── Views/    # HomeView, RouteDetailView, etc.
        ├── Services/ # APIClient, LocationManager
        └── Utilities/# PolylineDecoder
```

## Running the Backend Locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

The API runs at `http://localhost:8000`. Test it:

```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"lat": 51.5074, "lon": -0.1278},
    "prefs": {"max_travel_minutes": 90, "wind_tolerance": "moderate", "rain_tolerance_mm_per_hr": 0.5, "needs_pub": true}
  }'
```

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest test_scoring.py test_decode.py -v
```

## Building the iOS App

1. Open `ios/GoNow/GoNow.xcodeproj` in Xcode 15+
2. Update the backend URL in `Services/APIClient.swift` to your deployed backend URL
3. Select your development team in Signing & Capabilities
4. Build and run on simulator or device

## Deploying to Replit

1. Create a new Python Repl on [replit.com](https://replit.com)
2. Upload all files from `backend/` to the Repl
3. In the Repl, run: `pip install -r requirements.txt`
4. Set the run command to: `python main.py`
5. Click Run — Replit will provide a public HTTPS URL
6. Copy that URL and update `APIClient.swift` in the iOS app

## TestFlight Deployment

1. In Xcode, select **Product → Archive**
2. In the Organizer window, click **Distribute App**
3. Choose **App Store Connect** → **Upload**
4. In App Store Connect, add the build to TestFlight
5. Add testers and send invites

Requires an Apple Developer Program membership ($99/year).

## API Contract

### POST /recommendations

**Request:**
```json
{
  "user": {
    "lat": 51.5074,
    "lon": -0.1278,
    "leave_after_iso": "2024-12-27T10:00:00Z"
  },
  "prefs": {
    "max_travel_minutes": 90,
    "wind_tolerance": "moderate",
    "rain_tolerance_mm_per_hr": 0.5,
    "needs_pub": true
  },
  "query_text": "easy walk with pub lunch"
}
```

**Response:**
```json
{
  "cards": [
    {
      "route_id": "box_hill_dorking",
      "title": "Box Hill & Stepping Stones",
      "hero_image_url": "https://...",
      "summary": "Dry throughout. Calm conditions. Box Hill Cafe open until 5pm.",
      "depart_by_iso": "2024-12-27T09:45:00Z",
      "today_fit": 0.85,
      "duration_hours": 3.0,
      "elevation_gain_m": 280,
      "distance_km": 10.5,
      "map": {
        "polyline": "oq}xH~lZ...",
        "start_station": "London Victoria",
        "trailhead_station": "Box Hill & Westhumble",
        "bailout_station": "Dorking",
        "pois": [{"name": "Box Hill Cafe", "lat": 51.257, "lon": -0.309}]
      }
    }
  ]
}
```

## Adding Routes

Edit `backend/routes.json`. Each route needs:

| Field | Description |
|-------|-------------|
| `id` | Unique slug (e.g., `south_downs_amberley`) |
| `name` | Display name |
| `region` | Area (South Downs, Surrey Hills, etc.) |
| `trailhead` | Lat/lon of walk start |
| `polyline` | Google-encoded polyline string |
| `distance_km` | Total distance |
| `elevation_gain_m` | Total ascent |
| `estimated_duration_hours` | Walking time |
| `start_station` | London departure station |
| `trailhead_station` | Station at trailhead |
| `approx_travel_minutes` | Door-to-trailhead time |
| `bailout_stations` | Array of escape stations |
| `tags` | Surface/exposure hints |
| `amenities` | Array of pubs/cafes with hours |
| `hero_image_url` | Image URL (800px width) |

## What's Real vs Mocked

| Feature | Status |
|---------|--------|
| Weather forecast | ✅ Real (Open-Meteo API) |
| Route data | ✅ Real (hand-curated) |
| Today-fit scoring | ✅ Real algorithm |
| Travel times | ⚠️ Stored approximations (not live rail) |
| Amenity hours | ⚠️ Stored where known |
| Natural language → filters | 🚧 Stub (maps phrases to prefs) |

## Next Steps for Production

1. **Live rail integration** — National Rail API for real-time travel
2. **More routes** — Expand to 20+ curated walks
3. **Voice input** — iOS Speech framework integration
4. **LLM parsing** — OpenAI/Claude for natural language → filters
5. **48-hour rain lookback** — Better mud predictions
6. **Push notifications** — "Great walking day tomorrow" alerts
7. **Airtable CMS** — Easier route management
