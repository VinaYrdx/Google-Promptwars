🌱 CarbonMind

Your personal, hyper-local carbon coach. CarbonMind isn't just a calculator; it's a context-aware AI assistant that uses dynamic environmental data and personalized tracking to help you reduce your footprint.

🚀 High-Impact Features & Architecture

1. Dynamic Regional Math Engine

CarbonMind features a context-aware math engine that dynamically adjusts emission factors based on the user's location.

Smart Grid Routing: If a user is located in heavy hydroelectric regions (e.g., Himachal Pradesh, Uttarakhand), the energy emission factor automatically drops from the national coal average (0.82 kg/kWh) to a renewable baseline (0.05 kg/kWh).

Scientific Sourcing: All baseline math strictly adheres to verified sources:

Transport: IPCC AR6 WG3 Table 10.2 (2022)

Diet: Poore & Nemecek, Science (2018)

Energy: CEA India Emission Factor (2023)

Flights: ICAO Carbon Emissions Calculator

2. Advanced AI Integration (PromptWars Strategy)

We engineered a robust pipeline using the gemini-2.0-flash-exp model, optimized for strict JSON output and contextual accuracy.

Strict Persona: The system prompt forces the AI to act as a behavioral coach that speaks plainly and focuses purely on high-impact, actionable insights.

Native JSON Schema: Instead of relying on brittle regex parsing, we enforce native JSON structures via the Gemini API configuration, ensuring the app never breaks from malformed markdown.

Multi-turn Memory: Weekly refreshes pass completed actions back to the AI as context, preventing repetitive advice and proving multi-turn reasoning and memory simulation.

🛠️ Local Setup

Clone the repository.

Install dependencies: npm install

Create a .env file in the root directory and add your API key:

VITE_GEMINI_KEY=your_gemini_api_key_here


Start the development server: npm run dev