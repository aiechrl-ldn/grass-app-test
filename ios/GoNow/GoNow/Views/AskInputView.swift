import SwiftUI

/// Natural language input view for asking about walks
struct AskInputView: View {
    @Binding var queryText: String?
    let onSubmit: () -> Void
    
    @State private var inputText: String = ""
    @Environment(\.dismiss) private var dismiss
    @FocusState private var isInputFocused: Bool
    
    private let exampleQueries = [
        "Easy 2-hour walk with a pub",
        "Something close with views",
        "Half-day hike, don't mind mud",
        "Quick walk near Box Hill"
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.15, blue: 0.2)
                    .ignoresSafeArea()
                
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("What are you looking for?")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Describe your ideal walk and we'll find matches")
                            .font(.system(size: 15))
                            .foregroundColor(.white.opacity(0.7))
                    }
                    
                    // Text input
                    HStack {
                        TextField("e.g., easy walk with a pub lunch", text: $inputText)
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .focused($isInputFocused)
                        
                        if !inputText.isEmpty {
                            Button {
                                inputText = ""
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.5))
                            }
                            .padding(.trailing, 12)
                        }
                    }
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Example queries
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Try something like:")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        
                        ForEach(exampleQueries, id: \.self) { query in
                            Button {
                                inputText = query
                            } label: {
                                HStack {
                                    Text(query)
                                        .font(.system(size: 14))
                                        .foregroundColor(.white.opacity(0.8))
                                    Spacer()
                                    Image(systemName: "arrow.up.left")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.4))
                                }
                                .padding(.vertical, 8)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Submit button
                    Button {
                        queryText = inputText.isEmpty ? nil : inputText
                        onSubmit()
                    } label: {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 16))
                            Text(inputText.isEmpty ? "Show all walks" : "Find walks")
                                .font(.system(size: 17, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            inputText.isEmpty 
                                ? Color.white.opacity(0.15)
                                : Color.blue
                        )
                        .cornerRadius(14)
                    }
                }
                .padding(20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
            .onAppear {
                isInputFocused = true
            }
        }
    }
}

#Preview {
    AskInputView(queryText: .constant(nil), onSubmit: {})
}
