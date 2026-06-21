# 🌱 CarbonMind — AI Carbon Coach

> **Google PromptWars Virtual · Challenge 3**  
> Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

**Live Demo:** [your-vercel-url.vercel.app]  
**Built by:** Vinay Kumar (VinaYrdx) · IIT Roorkee

---

## What It Does

CarbonMind is an AI-powered carbon footprint coach that:

1. **Onboards** users via a 6-question quiz (transport, diet, energy, flights)
2. **Calculates** their annual CO₂ footprint using IPCC 2022 emission factors
3. **Personalizes** a 3-action plan using Gemini AI — with specific kg savings and why it matters *for this user*
4. **Tracks** progress as users complete actions, with CO₂ saved counter
5. **Refreshes** recommendations via multi-turn Gemini calls when all actions are completed

India-first: defaults to coal grid (0.82 kg/kWh), includes auto-rickshaw as transport option, compares against India avg (1.9t) and global avg (4.7t).

---

## Tech Stack

| Tool | Why |
|------|-----|
| React + Vite | Fast build, component isolation, Vercel-native |
| Gemini 2.0 Flash | Google competition — strategic + free tier (15 req/min) |
| Recharts | Lightweight pie chart, React-native, animated |
| Tailwind CSS | Utility-first, zero CSS bloat in production |
| localStorage | Zero backend — persists user progress across sessions |
| Vercel | One-command deploy, auto HTTPS, env var support |

---

## Prompt Engineering

> This section documents the exact prompts used, the design decisions behind them, and the iteration process. This is the core of the PromptWars submission.

### Architecture: All prompts in `src/services/gemini.js`

Every prompt call is isolated in one file. Evaluators can audit all prompt engineering in a single location.

### System Prompt (applied to all calls)

```
You are CarbonMind, an environmental scientist and behavioral coach.
Rules:
- Speak plainly to non-experts. Never lecture.
- Always lead with the single highest-impact action for THIS user's specific data.
- Use Indian context: coal-heavy grid, auto-rickshaw, metro, monsoon season.
- Cite specific numbers (kg CO₂ saved/year) for every action.
- Never give generic advice. Every line must be specific to the user's profile.
```

**Why this works:** Role assignment with explicit rules changes Gemini's output specificity dramatically. Without this, Gemini returns generic "drive less, eat less meat" advice. With it, it returns "Your coal-grid home uses 1800kg/yr — switching to LED bulbs + inverter AC saves 340kg specifically."

### Prompt 1: Footprint Analysis + Action Plan

**Key techniques used:**

1. **Full profile injection as JSON** — Gemini receives the complete user profile (transport mode, weekly km, diet, energy source, flights). This enables personalized reasoning like "since you drive 40km/week on India's coal grid..."

2. **Chain-of-thought instruction** — "Internally rank ALL possible interventions by CO₂ impact for THIS specific profile before surfacing the top 3." This forces Gemini to reason before outputting, improving accuracy of impact numbers.

3. **One-shot example** — A complete example of desired JSON output is embedded in the prompt. This improved parse success rate from ~70% to ~99% in testing.

4. **Structured JSON output enforcement** — "Respond ONLY as valid JSON. No markdown, no preamble." Plus a retry prompt on parse failure.

5. **Temperature: 0.3** — Low temperature for factual consistency in CO₂ numbers. We don't want creative emission figures.

```javascript
// Prompt structure (see src/services/gemini.js for full code)
`User profile (JSON):
${JSON.stringify({ ...profile, footprint })}

Task: Analyze this carbon footprint and generate a personalized action plan.

Instructions:
1. Internally rank ALL possible interventions by CO₂ impact for THIS specific profile.
2. Surface only the top 3 actions.
3. Each action must reference specific numbers from the user's profile.
4. Respond ONLY as valid JSON. No markdown, no preamble.

Example output format:
{ "summary": "...", "actions": [{...}], "insight": "..." }

Now generate for this user's actual profile:`
```

### Prompt 2: Weekly Action Refresh (Multi-turn chaining)

When a user completes all 3 actions, a new Gemini call passes the completed actions as context:

```javascript
`User has completed: ${JSON.stringify(completedActions)}
CO₂ already saved: ${savedKg}kg

Generate 3 NEW actions that:
1. Build on habits from completed actions
2. Never repeat any completed action  
3. Are the next highest-impact interventions for this specific profile`
```

**Why this matters:** This demonstrates prompt chaining and simulated memory — the model receives prior context and builds on it. A key PromptWars evaluation criterion.

### Prompt Iteration Log

| Iteration | Problem | Fix |
|-----------|---------|-----|
| v1 | Gemini returned markdown-wrapped JSON, breaking parse | Added: strip ```json fences before parsing |
| v2 | Actions were generic ("eat less meat") not personalized | Added: full user profile JSON injection |
| v3 | JSON structure inconsistent (sometimes array, sometimes object) | Added: one-shot example in prompt body |
| v4 | impact_kg numbers were unrealistic (e.g. 50000kg for diet) | Added: chain-of-thought + lowered temperature to 0.3 |
| v5 | App crashed on API failure | Added: fallback action generator from emissions.js |

---

## Emission Factors

All values from peer-reviewed sources:

| Category | Source |
|----------|--------|
| Transport kg/km | IPCC AR6 WG3 Table 10.2, 2022 |
| Diet kg/year | Poore & Nemecek, Science 2018 |
| Energy kg/kWh | CEA India Emission Factor Report 2023 |
| Aviation kg/flight | ICAO Calculator + RFI multiplier 1.9 |

---

## Setup (Local)

```bash
git clone https://github.com/VinaYrdx/carbonmind
cd carbonmind
npm install
cp .env.example .env
# Add your Gemini API key to .env
npm run dev
```

Get a free Gemini API key at: https://aistudio.google.com

---

## Project Structure

```
src/
├── services/gemini.js     # ALL prompt engineering (one place)
├── utils/emissions.js     # Carbon formulas + IPCC source comments  
├── hooks/useCarbon.js     # State + API orchestration (custom hook)
└── components/
    ├── Quiz/Quiz.jsx       # 6-question onboarding wizard
    └── Dashboard/Dashboard.jsx  # Footprint card, chart, action plan, tracker
```
