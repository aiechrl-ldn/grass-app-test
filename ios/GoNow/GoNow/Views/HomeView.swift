import SwiftUI

/// Main home view showing route recommendations
struct HomeView: View {
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var preferences: UserPreferences
    
    @State private var cards: [RouteCard] = []
    @State private var loadingState: LoadingState = .idle
    @State private var showingPreferences = false
    @State private var showingAskInput = false
    @State private var queryText: String?
    
    enum LoadingState {
        case idle
        case loading
        case loaded
        case error(String)
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.1, green: 0.15, blue: 0.2),
                        Color(red: 0.05, green: 0.1, blue: 0.15)
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Header
                        headerSection
                        
                        // Ask button
                        askButton
                        
                        // Content based on state
                        switch loadingState {
                        case .loading:
                            loadingView
                        case .error(let message):
                            errorView(message: message)
                        case .loaded, .idle:
                            if cards.isEmpty {
                                emptyView
                            } else {
                                cardsList
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingPreferences = true
                    } label: {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundColor(.white)
                    }
                }
            }
            .sheet(isPresented: $showingPreferences) {
                PreferencesView()
            }
            .sheet(isPresented: $showingAskInput) {
                AskInputView(queryText: $queryText, onSubmit: {
                    showingAskInput = false
                    Task { await fetchRecommendations() }
                })
            }
            .onAppear {
                requestLocationAndFetch()
            }
        }
    }
    
    // MARK: - Subviews
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Go Now")
                .font(.system(size: 34, weight: .bold))
                .foregroundColor(.white)
            
            Text("What good walk can you do today?")
                .font(.system(size: 17, weight: .regular))
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(.top, 20)
    }
    
    private var askButton: some View {
        Button {
            showingAskInput = true
        } label: {
            HStack {
                Image(systemName: "mic.fill")
                    .font(.system(size: 16))
                Text("Tell me what you're looking for...")
                    .font(.system(size: 15))
                Spacer()
            }
            .foregroundColor(.white.opacity(0.6))
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.2)
            Text("Finding today's best walks...")
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(.orange)
            Text(message)
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            Button("Try Again") {
                Task { await fetchRecommendations() }
            }
            .buttonStyle(.bordered)
            .tint(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.walk")
                .font(.system(size: 40))
                .foregroundColor(.white.opacity(0.5))
            Text("No walks match your preferences right now")
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            Button("Adjust Preferences") {
                showingPreferences = true
            }
            .buttonStyle(.bordered)
            .tint(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    private var cardsList: some View {
        LazyVStack(spacing: 20) {
            ForEach(cards) { card in
                NavigationLink(destination: RouteDetailView(card: card)) {
                    RouteCardView(card: card)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
    }
    
    // MARK: - Actions
    
    private func requestLocationAndFetch() {
        // Request location permission if needed
        if locationManager.authorizationStatus == .notDetermined {
            locationManager.requestPermission()
        } else {
            locationManager.requestLocation()
        }
        
        // Fetch with mock data for now (will wire to real API in M4)
        loadMockData()
    }
    
    private func loadMockData() {
        loadingState = .loading
        
        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            cards = RouteCard.mockCards
            loadingState = .loaded
        }
    }
    
    private func fetchRecommendations() async {
        loadingState = .loading
        
        do {
            let response = try await APIClient.shared.getRecommendations(
                location: locationManager.currentOrDefault,
                preferences: preferences,
                queryText: queryText
            )
            
            await MainActor.run {
                cards = response.cards
                loadingState = .loaded
            }
        } catch {
            await MainActor.run {
                // Fall back to mock data if API fails
                cards = RouteCard.mockCards
                loadingState = .loaded
                // loadingState = .error(error.localizedDescription)
            }
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(LocationManager())
        .environmentObject(UserPreferences())
}
