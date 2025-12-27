"""
Weather Integration Module

Fetches live hourly weather forecast from Open-Meteo API (free, no key required).
"""

import httpx
from typing import Optional


async def get_weather_forecast(lat: float, lon: float, hours_ahead: int = 12) -> dict:
    """
    Fetch hourly weather forecast for a location.
    
    Returns dict with structure:
    {
        "hourly": {
            "time": ["2024-01-01T09:00", ...],
            "temperature_2m": [8.5, ...],
            "precipitation": [0.0, ...],
            "precipitation_probability": [10, ...],
            "wind_speed_10m": [15.2, ...]
        }
    }
    
    Returns empty dict on error.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,precipitation,precipitation_probability,wind_speed_10m",
        "forecast_hours": hours_ahead,
        "timezone": "Europe/London"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                "hourly": data.get("hourly", {}),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude")
            }
    except Exception as e:
        print(f"Weather API error: {e}")
        return {}


def format_weather_for_debug(weather: dict) -> str:
    """Format weather data for logging/debugging."""
    if not weather.get("hourly"):
        return "No weather data"
    
    hourly = weather["hourly"]
    times = hourly.get("time", [])[:6]
    temps = hourly.get("temperature_2m", [])[:6]
    precip = hourly.get("precipitation", [])[:6]
    
    lines = ["Weather forecast (next 6 hours):"]
    for i, t in enumerate(times):
        temp = temps[i] if i < len(temps) else "?"
        rain = precip[i] if i < len(precip) else "?"
        lines.append(f"  {t}: {temp}°C, {rain}mm")
    
    return "\n".join(lines)
