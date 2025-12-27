import Foundation
import CoreLocation

/// Decodes Google Polyline Algorithm encoded strings into coordinates
struct PolylineDecoder {
    
    /// Decode an encoded polyline string into an array of coordinates
    /// - Parameter encodedPolyline: The encoded polyline string (may include "enc:" prefix)
    /// - Returns: Array of CLLocationCoordinate2D points
    static func decode(_ encodedPolyline: String) -> [CLLocationCoordinate2D] {
        // Remove "enc:" prefix if present
        var polyline = encodedPolyline
        if polyline.hasPrefix("enc:") {
            polyline = String(polyline.dropFirst(4))
        }
        
        var coordinates: [CLLocationCoordinate2D] = []
        var index = polyline.startIndex
        var lat = 0
        var lon = 0
        
        while index < polyline.endIndex {
            // Decode latitude
            var result = 0
            var shift = 0
            var byte: Int
            
            repeat {
                guard index < polyline.endIndex else { break }
                byte = Int(polyline[index].asciiValue ?? 0) - 63
                index = polyline.index(after: index)
                result |= (byte & 0x1F) << shift
                shift += 5
            } while byte >= 0x20
            
            let deltaLat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
            lat += deltaLat
            
            // Decode longitude
            result = 0
            shift = 0
            
            repeat {
                guard index < polyline.endIndex else { break }
                byte = Int(polyline[index].asciiValue ?? 0) - 63
                index = polyline.index(after: index)
                result |= (byte & 0x1F) << shift
                shift += 5
            } while byte >= 0x20
            
            let deltaLon = (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
            lon += deltaLon
            
            // Convert to coordinate (divide by 1e5 for precision)
            let coordinate = CLLocationCoordinate2D(
                latitude: Double(lat) / 1e5,
                longitude: Double(lon) / 1e5
            )
            coordinates.append(coordinate)
        }
        
        return coordinates
    }
    
    /// Calculate the center point of an array of coordinates
    static func centerOf(_ coordinates: [CLLocationCoordinate2D]) -> CLLocationCoordinate2D? {
        guard !coordinates.isEmpty else { return nil }
        
        var minLat = coordinates[0].latitude
        var maxLat = coordinates[0].latitude
        var minLon = coordinates[0].longitude
        var maxLon = coordinates[0].longitude
        
        for coord in coordinates {
            minLat = min(minLat, coord.latitude)
            maxLat = max(maxLat, coord.latitude)
            minLon = min(minLon, coord.longitude)
            maxLon = max(maxLon, coord.longitude)
        }
        
        return CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )
    }
    
    /// Calculate appropriate span to show all coordinates
    static func spanFor(_ coordinates: [CLLocationCoordinate2D], padding: Double = 1.3) -> (latDelta: Double, lonDelta: Double)? {
        guard !coordinates.isEmpty else { return nil }
        
        var minLat = coordinates[0].latitude
        var maxLat = coordinates[0].latitude
        var minLon = coordinates[0].longitude
        var maxLon = coordinates[0].longitude
        
        for coord in coordinates {
            minLat = min(minLat, coord.latitude)
            maxLat = max(maxLat, coord.latitude)
            minLon = min(minLon, coord.longitude)
            maxLon = max(maxLon, coord.longitude)
        }
        
        return (
            latDelta: (maxLat - minLat) * padding,
            lonDelta: (maxLon - minLon) * padding
        )
    }
}
