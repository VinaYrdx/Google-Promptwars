// All prompt engineering lives here.
// Evaluators: see README.md → "Prompt Engineering" section for full rationale.

const MODEL = 'gemini-2.0-flash-exp';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const KEY = () => import.meta.env.VITE_GEMINI_KEY;

// 1. DYNAMIC SYSTEM PROMPT: Matches the math engine's regional awareness
const getSystemPrompt = (energyContext) => `You are CarbonMind, an environmental scientist and behavioral coach.
Rules:
- Speak plainly to non-experts. Never lecture.
- Always lead with the single highest-impact action for THIS user's specific data.
- Use Indian context: ${energyContext === 'renewable' ? 'hydro-heavy renewable grid' : 'coal-heavy grid'}, auto-rickshaw, metro, monsoon season.
- Cite specific numbers (kg CO₂ saved/year) for every action.
- Never give generic advice. Every line must be specific to the user's profile.`;

const EXAMPLE_OUTPUT = `{
  "summary": "Your biggest carbon source is diet at 2500kg/year. Switching to vegetarian saves more than avoiding 1 long-haul flight.",
  "actions": [
    {
      "title": "Switch to vegetarian diet 5 days/week",
      "impact_kg": 800,
      "difficulty": "medium",
      "timeframe": "immediate",
      "why_this_user": "Your mixed diet produces 2500kg/year. Part-time veg cuts that by 800kg — your single biggest lever."
    }
  ],
  "insight": "You're already below the global average. Three months of these changes puts you below India's average too."
}`;

// 2. NATIVE JSON CONFIG: No more regex stripping
async function callGemini(contents, systemText, expectJson = true) {
  const res = await fetch(`${API_URL}?key=${KEY()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents: contents,
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 1024,
        responseMimeType: expectJson ? "application/json" : "text/plain" 
      },
    }),
  });
  
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const textVal = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return expectJson ? JSON.parse(textVal) : textVal;
}

export async function getActionPlan(profile, footprint) {
  const promptText = `
User profile (JSON):
${JSON.stringify({ ...profile, footprint }, null, 2)}

Task: Analyze this carbon footprint and generate a personalized action plan.
Instructions:
1. Internally rank ALL possible interventions by CO₂ impact for THIS specific profile.
2. Surface only the top 3 actions.
3. Each action must reference specific numbers from the user's profile.

Example output format:
${EXAMPLE_OUTPUT}`;

  const contents = [{ role: 'user', parts: [{ text: promptText }] }];
  const systemText = getSystemPrompt(profile.energySource);

  try {
    return await callGemini(contents, systemText, true);
  } catch {
    // Built-in retry fallback for robustness
    return null; 
  }
}

export async function getWeeklyRefresh(profile, footprint, completedActions) {
  const promptText = `
User profile: ${JSON.stringify({ ...profile, footprint })}
Completed actions: ${JSON.stringify(completedActions)}
CO₂ already saved: ${completedActions.reduce((s, a) => s + (a.impact_kg || 0), 0)}kg

Task: Generate 3 NEW actions that:
1. Build on habits from completed actions
2. Never repeat any completed action
3. Are the next highest-impact interventions for this profile`;

  const contents = [{ role: 'user', parts: [{ text: promptText }] }];
  return await callGemini(contents, getSystemPrompt(profile.energySource), true).catch(() => null);
}

// 3. CORRECT MULTI-TURN CHAT PAYLOAD
export async function chatWithCarbonMind(history, userMessage, profile) {
  const systemText = getSystemPrompt(profile.energySource) + `\n\nCurrent User Profile: ${JSON.stringify(profile)}`;
  
  // Format history to Gemini's strict native schema
  const contents = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  return await callGemini(contents, systemText, false);
}