import XCTest
@testable import GoNow

final class PolylineDecoderTests: XCTestCase {
    
    func testDecodeSimplePolyline() {
        // A simple encoded polyline for testing
        // This represents a short path
        let encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        
        let coordinates = PolylineDecoder.decode(encoded)
        
        XCTAssertGreaterThan(coordinates.count, 0)
        
        // First point should be approximately (38.5, -120.2)
        if let first = coordinates.first {
            XCTAssertEqual(first.latitude, 38.5, accuracy: 0.1)
            XCTAssertEqual(first.longitude, -120.2, accuracy: 0.1)
        }
    }
    
    func testDecodeWithEncPrefix() {
        let encoded = "enc:_p~iF~ps|U_ulLnnqC"
        
        let coordinates = PolylineDecoder.decode(encoded)
        
        XCTAssertGreaterThan(coordinates.count, 0)
    }
    
    func testDecodeEmptyString() {
        let coordinates = PolylineDecoder.decode("")
        
        XCTAssertEqual(coordinates.count, 0)
    }
    
    func testCenterOfCoordinates() {
        let coords = [
            CLLocationCoordinate2D(latitude: 50.0, longitude: -1.0),
            CLLocationCoordinate2D(latitude: 52.0, longitude: 1.0)
        ]
        
        let center = PolylineDecoder.centerOf(coords)
        
        XCTAssertNotNil(center)
        XCTAssertEqual(center!.latitude, 51.0, accuracy: 0.01)
        XCTAssertEqual(center!.longitude, 0.0, accuracy: 0.01)
    }
    
    func testCenterOfEmptyArray() {
        let center = PolylineDecoder.centerOf([])
        XCTAssertNil(center)
    }
    
    func testSpanForCoordinates() {
        let coords = [
            CLLocationCoordinate2D(latitude: 50.0, longitude: -1.0),
            CLLocationCoordinate2D(latitude: 52.0, longitude: 1.0)
        ]
        
        let span = PolylineDecoder.spanFor(coords, padding: 1.0)
        
        XCTAssertNotNil(span)
        XCTAssertEqual(span!.latDelta, 2.0, accuracy: 0.01)
        XCTAssertEqual(span!.lonDelta, 2.0, accuracy: 0.01)
    }
    
    func testSpanWithPadding() {
        let coords = [
            CLLocationCoordinate2D(latitude: 50.0, longitude: -1.0),
            CLLocationCoordinate2D(latitude: 52.0, longitude: 1.0)
        ]
        
        let span = PolylineDecoder.spanFor(coords, padding: 1.5)
        
        XCTAssertNotNil(span)
        XCTAssertEqual(span!.latDelta, 3.0, accuracy: 0.01)
        XCTAssertEqual(span!.lonDelta, 3.0, accuracy: 0.01)
    }
}

import CoreLocation
