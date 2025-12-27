import Foundation
import CoreLocation

// MARK: - API Response Models

/// Response from /recommendations endpoint
struct RecommendationsResponse: Codable {
    let cards: [RouteCard]
}

/// A single route card for display in the feed
struct RouteCard: Codable, Identifiable {
    let routeId: String
    let title: String
    let heroImageUrl: String
    let summary: String
    let departByIso: String
    let todayFit: Double
    let durationHours: Double
    let elevationGainM: Int
    let distanceKm: Double
    let map: RouteMap
    
    var id: String { routeId }
    
    enum CodingKeys: String, CodingKey {
        case routeId = "route_id"
        case title
        case heroImageUrl = "hero_image_url"
        case summary
        case departByIso = "depart_by_iso"
        case todayFit = "today_fit"
        case durationHours = "duration_hours"
        case elevationGainM = "elevation_gain_m"
        case distanceKm = "distance_km"
        case map
    }
    
    /// Formatted duration string (e.g., "3.5 hours")
    var formattedDuration: String {
        if durationHours < 1 {
            return "\(Int(durationHours * 60)) min"
        } else if durationHours == Double(Int(durationHours)) {
            return "\(Int(durationHours)) hours"
        } else {
            return String(format: "%.1f hours", durationHours)
        }
    }
    
    /// Formatted distance string (e.g., "12.4 km")
    var formattedDistance: String {
        return String(format: "%.1f km", distanceKm)
    }
    
    /// Formatted elevation string (e.g., "320m ↑")
    var formattedElevation: String {
        return "\(elevationGainM)m ↑"
    }
    
    /// Depart by time as Date
    var departByDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: departByIso) {
            return date
        }
        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: departByIso)
    }
    
    /// Formatted depart by time (e.g., "Depart by 10:15")
    var formattedDepartBy: String {
        guard let date = departByDate else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return "Depart by \(formatter.string(from: date))"
    }
    
    /// Today fit as percentage (e.g., "78% fit")
    var formattedTodayFit: String {
        return "\(Int(todayFit * 100))% fit"
    }
}

/// Map data for a route
struct RouteMap: Codable {
    let polyline: String
    let startStation: String
    let trailheadStation: String
    let bailoutStation: String?
    let pois: [POI]
    
    enum CodingKeys: String, CodingKey {
        case polyline
        case startStation = "start_station"
        case trailheadStation = "trailhead_station"
        case bailoutStation = "bailout_station"
        case pois
    }
}

/// Point of interest (pub, cafe, etc.)
struct POI: Codable, Identifiable {
    let name: String
    let lat: Double
    let lon: Double
    
    var id: String { name }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}

// MARK: - API Request Models

/// Request body for /recommendations
struct RecommendationsRequest: Codable {
    let user: UserContext
    let prefs: PreferencesPayload
    let queryText: String?
    
    enum CodingKeys: String, CodingKey {
        case user, prefs
        case queryText = "query_text"
    }
}

/// User context (location, departure time)
struct UserContext: Codable {
    let lat: Double
    let lon: Double
    let leaveAfterIso: String?
    
    enum CodingKeys: String, CodingKey {
        case lat, lon
        case leaveAfterIso = "leave_after_iso"
    }
}

/// Preferences payload for API request
struct PreferencesPayload: Codable {
    let maxTravelMinutes: Int
    let windTolerance: String
    let rainToleranceMmPerHr: Double
    let needsPub: Bool
    
    enum CodingKeys: String, CodingKey {
        case maxTravelMinutes = "max_travel_minutes"
        case windTolerance = "wind_tolerance"
        case rainToleranceMmPerHr = "rain_tolerance_mm_per_hr"
        case needsPub = "needs_pub"
    }
}

// MARK: - Mock Data

extension RouteCard {
    static let mockCards: [RouteCard] = [
        RouteCard(
            routeId: "south_downs_amberley_loop",
            title: "Amberley Downs & River Arun",
            heroImageUrl: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
            summary: "Dry throughout. Breezy on the ridge. The Bridge Inn open 12–3.",
            departByIso: "2024-12-27T10:15:00Z",
            todayFit: 0.78,
            durationHours: 4.0,
            elevationGainM: 340,
            distanceKm: 14.2,
            map: RouteMap(
                polyline: "_{~xHjwIeB}@gCkAuBs@wCq@yCYwCFyCd@oCz@mCrAiBrAuAvAoAdBaAfBs@xBi@|Bc@~BI`CI|BFxBXvBj@tBz@nBfAnB~AhBfBzAvBnA`CbAfC~@xCr@~Cf@`D\\bDJdDAdDQ~CYzCi@tCw@nC_AhCkAfCuArByAlB{AjB_BbBgBzAoB",
                startStation: "London Victoria",
                trailheadStation: "Amberley",
                bailoutStation: "Arundel",
                pois: [POI(name: "The Bridge Inn", lat: 50.9005, lon: -0.5512)]
            )
        ),
        RouteCard(
            routeId: "box_hill_dorking",
            title: "Box Hill & Stepping Stones",
            heroImageUrl: "https://images.unsplash.com/photo-1516298773066-c48f8e9bd92b?w=800",
            summary: "Dry for 4+ hours. Calm conditions. Box Hill Cafe open until 5pm.",
            departByIso: "2024-12-27T09:45:00Z",
            todayFit: 0.85,
            durationHours: 3.0,
            elevationGainM: 280,
            distanceKm: 10.5,
            map: RouteMap(
                polyline: "oq}xH~lZ}AkBsAgBmAuBgAcCaAkCy@sCq@{Ci@aDa@eDY_EQ_EI_EA}D@{DJ{DV{Df@yDt@wD~@uDjAsDrAqDxAoDzAoD|AoDzAmD",
                startStation: "London Victoria",
                trailheadStation: "Box Hill & Westhumble",
                bailoutStation: "Dorking",
                pois: [
                    POI(name: "Box Hill Cafe", lat: 51.2570, lon: -0.3089),
                    POI(name: "The Stepping Stones Pub", lat: 51.2498, lon: -0.3201)
                ]
            )
        ),
        RouteCard(
            routeId: "epping_forest_loop",
            title: "Epping Forest Ancient Woodland",
            heroImageUrl: "https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=800",
            summary: "Light rain possible. Mud likely. The Royal Oak open from noon.",
            departByIso: "2024-12-27T11:00:00Z",
            todayFit: 0.62,
            durationHours: 2.5,
            elevationGainM: 85,
            distanceKm: 8.5,
            map: RouteMap(
                polyline: "_k`yH_vEaAeBw@sBo@uBg@wB_@yBWyBO{BGyCByCD{CL{CR{C\\yC",
                startStation: "Liverpool Street",
                trailheadStation: "Loughton",
                bailoutStation: "Chingford",
                pois: [POI(name: "The Royal Oak", lat: 51.6478, lon: 0.0523)]
            )
        )
    ]
}
