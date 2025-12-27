import Foundation
import SwiftUI

/// User preferences for walk recommendations
class UserPreferences: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var maxTravelMinutes: Int {
        didSet { save() }
    }
    
    @Published var windTolerance: WindTolerance {
        didSet { save() }
    }
    
    @Published var rainToleranceMmPerHr: Double {
        didSet { save() }
    }
    
    @Published var needsPub: Bool {
        didSet { save() }
    }
    
    // MARK: - Initialization
    
    init() {
        let defaults = UserDefaults.standard
        self.maxTravelMinutes = defaults.integer(forKey: "maxTravelMinutes") == 0 
            ? 90 
            : defaults.integer(forKey: "maxTravelMinutes")
        self.windTolerance = WindTolerance(rawValue: defaults.string(forKey: "windTolerance") ?? "moderate") ?? .moderate
        self.rainToleranceMmPerHr = defaults.double(forKey: "rainToleranceMmPerHr") == 0 
            ? 0.5 
            : defaults.double(forKey: "rainToleranceMmPerHr")
        self.needsPub = defaults.bool(forKey: "needsPub")
    }
    
    // MARK: - Persistence
    
    private func save() {
        let defaults = UserDefaults.standard
        defaults.set(maxTravelMinutes, forKey: "maxTravelMinutes")
        defaults.set(windTolerance.rawValue, forKey: "windTolerance")
        defaults.set(rainToleranceMmPerHr, forKey: "rainToleranceMmPerHr")
        defaults.set(needsPub, forKey: "needsPub")
    }
    
    // MARK: - API Payload
    
    /// Convert to API request format
    func toPayload() -> PreferencesPayload {
        PreferencesPayload(
            maxTravelMinutes: maxTravelMinutes,
            windTolerance: windTolerance.rawValue,
            rainToleranceMmPerHr: rainToleranceMmPerHr,
            needsPub: needsPub
        )
    }
}

// MARK: - Wind Tolerance Enum

enum WindTolerance: String, CaseIterable, Identifiable {
    case low = "low"
    case moderate = "moderate"
    case high = "high"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .low: return "Low (calm days only)"
        case .moderate: return "Moderate (some breeze OK)"
        case .high: return "High (I don't mind wind)"
        }
    }
}

// MARK: - Rain Tolerance Helpers

extension UserPreferences {
    /// Rain tolerance as descriptive text
    var rainToleranceDescription: String {
        switch rainToleranceMmPerHr {
        case 0..<0.2: return "Dry only"
        case 0.2..<0.5: return "Light drizzle OK"
        case 0.5..<1.0: return "Some rain OK"
        default: return "Don't mind rain"
        }
    }
    
    /// Preset rain tolerance values
    static let rainTolerancePresets: [(value: Double, label: String)] = [
        (0.1, "Dry only"),
        (0.3, "Light drizzle OK"),
        (0.5, "Some rain OK"),
        (1.0, "Don't mind rain")
    ]
}
