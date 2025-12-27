import XCTest
@testable import GoNow

final class RouteTests: XCTestCase {
    
    // Sample JSON matching API response
    let validRouteJSON = """
    {
        "cards": [
            {
                "route_id": "test_route",
                "title": "Test Route",
                "hero_image_url": "https://example.com/image.jpg",
                "summary": "A nice walk.",
                "depart_by_iso": "2024-12-27T10:00:00Z",
                "today_fit": 0.75,
                "duration_hours": 3.0,
                "elevation_gain_m": 250,
                "distance_km": 10.5,
                "map": {
                    "polyline": "test_polyline",
                    "start_station": "London Victoria",
                    "trailhead_station": "Test Station",
                    "bailout_station": "Bailout Station",
                    "pois": [
                        {"name": "Test Pub", "lat": 51.5, "lon": -0.1}
                    ]
                }
            }
        ]
    }
    """
    
    func testDecodeValidResponse() throws {
        let data = validRouteJSON.data(using: .utf8)!
        let decoder = JSONDecoder()
        
        let response = try decoder.decode(RecommendationsResponse.self, from: data)
        
        XCTAssertEqual(response.cards.count, 1)
        
        let card = response.cards[0]
        XCTAssertEqual(card.routeId, "test_route")
        XCTAssertEqual(card.title, "Test Route")
        XCTAssertEqual(card.todayFit, 0.75)
        XCTAssertEqual(card.durationHours, 3.0)
        XCTAssertEqual(card.elevationGainM, 250)
        XCTAssertEqual(card.distanceKm, 10.5)
        
        XCTAssertEqual(card.map.startStation, "London Victoria")
        XCTAssertEqual(card.map.trailheadStation, "Test Station")
        XCTAssertEqual(card.map.bailoutStation, "Bailout Station")
        XCTAssertEqual(card.map.pois.count, 1)
        XCTAssertEqual(card.map.pois[0].name, "Test Pub")
    }
    
    func testDecodeEmptyCards() throws {
        let json = """
        {"cards": []}
        """
        let data = json.data(using: .utf8)!
        let decoder = JSONDecoder()
        
        let response = try decoder.decode(RecommendationsResponse.self, from: data)
        
        XCTAssertEqual(response.cards.count, 0)
    }
    
    func testFormattedDuration() {
        let card = RouteCard.mockCards[0]
        XCTAssertFalse(card.formattedDuration.isEmpty)
        XCTAssertTrue(card.formattedDuration.contains("hour"))
    }
    
    func testFormattedTodayFit() {
        let card = RouteCard.mockCards[0]
        XCTAssertTrue(card.formattedTodayFit.contains("%"))
    }
    
    func testMockDataExists() {
        XCTAssertGreaterThan(RouteCard.mockCards.count, 0)
        
        for card in RouteCard.mockCards {
            XCTAssertFalse(card.title.isEmpty)
            XCTAssertFalse(card.heroImageUrl.isEmpty)
            XCTAssertFalse(card.summary.isEmpty)
            XCTAssertGreaterThan(card.todayFit, 0)
            XCTAssertGreaterThan(card.distanceKm, 0)
        }
    }
}
