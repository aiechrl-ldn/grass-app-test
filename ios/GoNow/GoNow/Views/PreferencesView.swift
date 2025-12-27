import SwiftUI

/// Preferences screen for setting walk preferences
struct PreferencesView: View {
    @EnvironmentObject var preferences: UserPreferences
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.15, blue: 0.2)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        // Travel time
                        travelTimeSection
                        
                        Divider()
                            .background(Color.white.opacity(0.2))
                        
                        // Weather
                        weatherSection
                        
                        Divider()
                            .background(Color.white.opacity(0.2))
                        
                        // Amenities
                        amenitiesSection
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Preferences")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color(red: 0.1, green: 0.15, blue: 0.2), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
    
    // MARK: - Sections
    
    private var travelTimeSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader(title: "Travel Time", icon: "tram.fill")
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Maximum travel from London")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.7))
                
                HStack {
                    Text("\(preferences.maxTravelMinutes) min")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(travelDescription)
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.5))
                }
                
                Slider(
                    value: Binding(
                        get: { Double(preferences.maxTravelMinutes) },
                        set: { preferences.maxTravelMinutes = Int($0) }
                    ),
                    in: 30...150,
                    step: 15
                )
                .tint(.blue)
            }
            .padding(16)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
        }
    }
    
    private var weatherSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader(title: "Weather Tolerance", icon: "cloud.rain")
            
            // Rain tolerance
            VStack(alignment: .leading, spacing: 12) {
                Text("Rain")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                
                ForEach(UserPreferences.rainTolerancePresets, id: \.value) { preset in
                    rainOption(value: preset.value, label: preset.label)
                }
            }
            .padding(16)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
            
            // Wind tolerance
            VStack(alignment: .leading, spacing: 12) {
                Text("Wind")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                
                ForEach(WindTolerance.allCases) { tolerance in
                    windOption(tolerance: tolerance)
                }
            }
            .padding(16)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
        }
    }
    
    private var amenitiesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader(title: "Amenities", icon: "fork.knife")
            
            Toggle(isOn: $preferences.needsPub) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Need a pub or café")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white)
                    Text("Only show routes with a place to stop")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .tint(.blue)
            .padding(16)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
        }
    }
    
    // MARK: - Helpers
    
    private func sectionHeader(title: String, icon: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.blue)
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
        }
    }
    
    private var travelDescription: String {
        switch preferences.maxTravelMinutes {
        case 0..<45: return "Close by"
        case 45..<75: return "Nearby"
        case 75..<105: return "Medium distance"
        default: return "Further out"
        }
    }
    
    private func rainOption(value: Double, label: String) -> some View {
        Button {
            preferences.rainToleranceMmPerHr = value
        } label: {
            HStack {
                Text(label)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
                Spacer()
                if abs(preferences.rainToleranceMmPerHr - value) < 0.05 {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.blue)
                }
            }
            .padding(.vertical, 8)
        }
    }
    
    private func windOption(tolerance: WindTolerance) -> some View {
        Button {
            preferences.windTolerance = tolerance
        } label: {
            HStack {
                Text(tolerance.displayName)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
                Spacer()
                if preferences.windTolerance == tolerance {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.blue)
                }
            }
            .padding(.vertical, 8)
        }
    }
}

#Preview {
    PreferencesView()
        .environmentObject(UserPreferences())
}
