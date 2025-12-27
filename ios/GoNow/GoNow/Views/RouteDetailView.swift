import SwiftUI
import MapKit

/// Detail view for a route with map, stats, and start trip action
struct RouteDetailView: View {
    let card: RouteCard
    
    @State private var cameraPosition: MapCameraPosition = .automatic
    @Environment(\.dismiss) private var dismiss
    
    // Decoded polyline coordinates
    private var routeCoordinates: [CLLocationCoordinate2D] {
        PolylineDecoder.decode(card.map.polyline)
    }
    
    var body: some View {
        ZStack(alignment: .top) {
            // Background
            Color(red: 0.1, green: 0.15, blue: 0.2)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Map
                    mapSection
                    
                    // Content
                    VStack(alignment: .leading, spacing: 24) {
                        // Title and summary
                        headerSection
                        
                        Divider()
                            .background(Color.white.opacity(0.2))
                        
                        // Stats grid
                        statsSection
                        
                        Divider()
                            .background(Color.white.opacity(0.2))
                        
                        // Stations
                        stationsSection
                        
                        // POIs
                        if !card.map.pois.isEmpty {
                            Divider()
                                .background(Color.white.opacity(0.2))
                            poisSection
                        }
                        
                        // Start button
                        startButton
                            .padding(.top, 8)
                    }
                    .padding(20)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
    }
    
    // MARK: - Subviews
    
    private var mapSection: some View {
        Map(position: $cameraPosition) {
            // Route polyline
            if !routeCoordinates.isEmpty {
                MapPolyline(coordinates: routeCoordinates)
                    .stroke(.blue, lineWidth: 4)
            }
            
            // Trailhead marker
            if let first = routeCoordinates.first {
                Annotation("Start", coordinate: first) {
                    ZStack {
                        Circle()
                            .fill(.green)
                            .frame(width: 24, height: 24)
                        Image(systemName: "figure.walk")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            
            // End marker
            if let last = routeCoordinates.last, routeCoordinates.count > 1 {
                Annotation("End", coordinate: last) {
                    ZStack {
                        Circle()
                            .fill(.red)
                            .frame(width: 24, height: 24)
                        Image(systemName: "flag.fill")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            
            // POI markers
            ForEach(card.map.pois) { poi in
                Annotation(poi.name, coordinate: poi.coordinate) {
                    ZStack {
                        Circle()
                            .fill(.orange)
                            .frame(width: 28, height: 28)
                        Image(systemName: "fork.knife")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .frame(height: 300)
        .onAppear {
            setMapRegion()
        }
    }
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(card.title)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                
                Spacer()
                
                // Today fit badge
                Text(card.formattedTodayFit)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(fitColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(fitColor.opacity(0.2))
                    .cornerRadius(8)
            }
            
            Text(card.summary)
                .font(.system(size: 16, weight: .regular))
                .foregroundColor(.white.opacity(0.8))
        }
    }
    
    private var statsSection: some View {
        HStack(spacing: 0) {
            statBox(value: card.formattedDistance, label: "Distance")
            Spacer()
            statBox(value: card.formattedElevation, label: "Elevation")
            Spacer()
            statBox(value: card.formattedDuration, label: "Duration")
        }
    }
    
    private func statBox(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }
    
    private var stationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Journey")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
            
            HStack(spacing: 12) {
                stationItem(name: card.map.startStation, type: "Depart from", icon: "tram.fill")
                
                Image(systemName: "arrow.right")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.4))
                
                stationItem(name: card.map.trailheadStation, type: "Start walking at", icon: "figure.walk")
            }
            
            if let bailout = card.map.bailoutStation {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.uturn.backward")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.5))
                    Text("Bail-out: \(bailout)")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(.top, 4)
            }
        }
    }
    
    private func stationItem(name: String, type: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(type)
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.5))
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(name)
                    .font(.system(size: 14, weight: .medium))
            }
            .foregroundColor(.white)
        }
    }
    
    private var poisSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Amenities")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
            
            ForEach(card.map.pois) { poi in
                HStack(spacing: 10) {
                    Image(systemName: "fork.knife")
                        .font(.system(size: 14))
                        .foregroundColor(.orange)
                        .frame(width: 24)
                    
                    Text(poi.name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white)
                    
                    Spacer()
                }
            }
        }
    }
    
    private var startButton: some View {
        Button {
            openDirections()
        } label: {
            HStack {
                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                    .font(.system(size: 18))
                Text("Start Trip")
                    .font(.system(size: 17, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(14)
        }
    }
    
    // MARK: - Helpers
    
    private var fitColor: Color {
        if card.todayFit >= 0.7 {
            return .green
        } else if card.todayFit >= 0.5 {
            return .yellow
        } else {
            return .orange
        }
    }
    
    private func setMapRegion() {
        guard !routeCoordinates.isEmpty else { return }
        
        if let center = PolylineDecoder.centerOf(routeCoordinates),
           let span = PolylineDecoder.spanFor(routeCoordinates, padding: 1.5) {
            cameraPosition = .region(MKCoordinateRegion(
                center: center,
                span: MKCoordinateSpan(
                    latitudeDelta: max(0.02, span.latDelta),
                    longitudeDelta: max(0.02, span.lonDelta)
                )
            ))
        }
    }
    
    private func openDirections() {
        // Open Apple Maps with directions to the trailhead station
        if let first = routeCoordinates.first {
            let placemark = MKPlacemark(coordinate: first)
            let mapItem = MKMapItem(placemark: placemark)
            mapItem.name = card.map.trailheadStation
            mapItem.openInMaps(launchOptions: [
                MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeTransit
            ])
        }
    }
}

#Preview {
    NavigationStack {
        RouteDetailView(card: RouteCard.mockCards[0])
    }
}
