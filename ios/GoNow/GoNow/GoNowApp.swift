import SwiftUI

@main
struct GoNowApp: App {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var preferences = UserPreferences()
    
    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(locationManager)
                .environmentObject(preferences)
        }
    }
}
