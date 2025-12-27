import Foundation
import CoreLocation

/// API client for communicating with the Go-Now backend
class APIClient {
    
    // MARK: - Configuration
    
    /// Backend URL - update this when deploying to Replit
    /// For development, can point to localhost
    static var baseURL: String = "https://grass-app-test--aiechrl-ldn.replit.app"
    
    /// Shared instance
    static let shared = APIClient()
    
    private init() {}
    
    // MARK: - Errors
    
    enum APIError: LocalizedError {
        case invalidURL
        case networkError(Error)
        case invalidResponse
        case decodingError(Error)
        case serverError(Int, String?)
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Invalid API URL"
            case .networkError(let error):
                return "Network error: \(error.localizedDescription)"
            case .invalidResponse:
                return "Invalid response from server"
            case .decodingError(let error):
                return "Could not parse response: \(error.localizedDescription)"
            case .serverError(let code, let message):
                return "Server error (\(code)): \(message ?? "Unknown")"
            }
        }
    }
    
    // MARK: - State
    
    enum LoadingState<T> {
        case idle
        case loading
        case loaded(T)
        case error(Error)
    }
    
    // MARK: - API Methods
    
    /// Fetch route recommendations
    func getRecommendations(
        location: CLLocationCoordinate2D,
        preferences: UserPreferences,
        queryText: String? = nil
    ) async throws -> RecommendationsResponse {
        
        guard let url = URL(string: "\(Self.baseURL)/recommendations") else {
            throw APIError.invalidURL
        }
        
        // Build request body
        let request = RecommendationsRequest(
            user: UserContext(
                lat: location.latitude,
                lon: location.longitude,
                leaveAfterIso: ISO8601DateFormatter().string(from: Date())
            ),
            prefs: preferences.toPayload(),
            queryText: queryText
        )
        
        // Create URL request
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        urlRequest.httpBody = try encoder.encode(request)
        
        // Make request
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        // Check response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8)
            throw APIError.serverError(httpResponse.statusCode, message)
        }
        
        // Decode response
        let decoder = JSONDecoder()
        do {
            return try decoder.decode(RecommendationsResponse.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
}
