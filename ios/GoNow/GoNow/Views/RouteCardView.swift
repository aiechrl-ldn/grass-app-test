import SwiftUI

/// Card view displaying a route summary in the home feed
struct RouteCardView: View {
    let card: RouteCard
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Hero image
            AsyncImage(url: URL(string: card.heroImageUrl)) { phase in
                switch phase {
                case .empty:
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        )
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "photo")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.5))
                        )
                @unknown default:
                    EmptyView()
                }
            }
            .frame(height: 180)
            .clipped()
            
            // Content
            VStack(alignment: .leading, spacing: 12) {
                // Title and fit score
                HStack(alignment: .top) {
                    Text(card.title)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    // Today fit badge
                    Text(card.formattedTodayFit)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(fitColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(fitColor.opacity(0.2))
                        .cornerRadius(6)
                }
                
                // Summary
                Text(card.summary)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(2)
                
                // Stats row
                HStack(spacing: 16) {
                    statItem(icon: "clock", text: card.formattedDuration)
                    statItem(icon: "arrow.up.right", text: card.formattedDistance)
                    statItem(icon: "arrow.up", text: card.formattedElevation)
                    
                    Spacer()
                    
                    // Depart by
                    if !card.formattedDepartBy.isEmpty {
                        Text(card.formattedDepartBy)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.orange)
                    }
                }
                
                // Stations
                HStack(spacing: 4) {
                    Image(systemName: "tram.fill")
                        .font(.system(size: 11))
                    Text(card.map.startStation)
                        .font(.system(size: 12))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 10))
                    Text(card.map.trailheadStation)
                        .font(.system(size: 12, weight: .medium))
                }
                .foregroundColor(.white.opacity(0.6))
            }
            .padding(16)
            .background(Color.white.opacity(0.08))
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
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
    
    private func statItem(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11))
            Text(text)
                .font(.system(size: 12, weight: .medium))
        }
        .foregroundColor(.white.opacity(0.7))
    }
}

#Preview {
    ZStack {
        Color(red: 0.1, green: 0.15, blue: 0.2)
            .ignoresSafeArea()
        
        RouteCardView(card: RouteCard.mockCards[0])
            .padding()
    }
}
