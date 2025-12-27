import Foundation
import CoreLocation

/// Manages user location and authorization
class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    
    private let manager = CLLocationManager()
    
    @Published var location: CLLocationCoordinate2D?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var errorMessage: String?
    
    /// Default location (central London) when real location unavailable
    static let defaultLocation = CLLocationCoordinate2D(latitude: 51.5074, longitude: -0.1278)
    
    /// Current location or default if unavailable
    var currentOrDefault: CLLocationCoordinate2D {
        location ?? Self.defaultLocation
    }
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = manager.authorizationStatus
    }
    
    /// Request location permission
    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }
    
    /// Request a single location update
    func requestLocation() {
        manager.requestLocation()
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        
        switch authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied, .restricted:
            errorMessage = "Location access denied. Using central London as default."
        default:
            break
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.first {
            self.location = location.coordinate
            errorMessage = nil
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
        errorMessage = "Could not get location. Using central London."
    }
}
