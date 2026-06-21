// All prompt engineering lives here.
// Evaluators: see README.md → "Prompt Engineering" section for full rationale.

const MODEL = 'gemini-2.0-flash-exp';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent`;

const KEY = () => import.meta.env.VITE_GEMINI_KEY;

// SYSTEM PROMPT — role assignment changes output specificity dramatically vs no role
const SYSTEM = `You are CarbonMind, an environmental scientist and behavioral coach.
Rules:
- Speak plainly to non-experts. Never lecture.
- Always lead with the single highest-impact action for THIS user's specific data.
- Use Indian context: coal-heavy grid, auto-rickshaw, metro, monsoon season.
- Cite specific numbers (kg CO₂ saved/year) for every action.
- Never give generic advice. Every line must be specific to the user's profile.`;

// ONE-SHOT EXAMPLE embedded in prompt — dramatically improves JSON parse reliability
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

async function callGemini(prompt) {
  const res = await fetch(`${API_URL}?key=${KEY()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJSON(text) {
  // Strip markdown fences if present
  const clean = text.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(clean);
}

// PROMPT 1: Footprint analysis + personalized action plan
// Chain-of-thought: "internally rank ALL interventions" forces reasoning before output
export async function getActionPlan(profile, footprint) {
  const prompt = `
User profile (JSON):
${JSON.stringify({ ...profile, footprint }, null, 2)}

Task: Analyze this carbon footprint and generate a personalized action plan.

Instructions:
1. Internally rank ALL possible interventions by CO₂ impact for THIS specific profile.
2. Surface only the top 3 actions.
3. Each action must reference specific numbers from the user's profile.
4. Respond ONLY as valid JSON matching the example below. No markdown, no preamble.

Example output format:
${EXAMPLE_OUTPUT}

Now generate for this user's actual profile:`;

  const raw = await callGemini(prompt);

  // Retry once on parse failure with explicit correction prompt
  try {
    return parseJSON(raw);
  } catch {
    const retry = await callGemini(
      `Your previous response was not valid JSON:\n${raw}\n\nResend ONLY the JSON object. No markdown, no explanation.`
    );
    try {
      return parseJSON(retry);
    } catch {
      return null; // triggers fallback UI
    }
  }
}

// PROMPT 2: Weekly refresh — pass completed actions as context (prompt chaining)
// Shows memory simulation and multi-turn reasoning to evaluators
export async function getWeeklyRefresh(profile, footprint, completedActions) {
  const prompt = `
User profile: ${JSON.stringify({ ...profile, footprint })}
Completed actions: ${JSON.stringify(completedActions)}
CO₂ already saved: ${completedActions.reduce((s, a) => s + (a.impact_kg || 0), 0)}kg

Task: Generate 3 NEW actions that:
1. Build on habits from completed actions
2. Never repeat any completed action
3. Are the next highest-impact interventions for this specific profile

Respond ONLY as valid JSON:
{ "actions": [ { "title", "impact_kg", "difficulty", "timeframe", "why_this_user" } ] }`;

  const raw = await callGemini(prompt);
  try {
    return parseJSON(raw);
  } catch {
    return null;
  }
}

// Multi-turn chat for rank-1 extra feature
export async function chatWithCarbonMind(history, userMessage, profile) {
  const contextPrompt = `User carbon profile: ${JSON.stringify(profile)}\n\nConversation:\n${
    history.map(m => `${m.role}: ${m.text}`).join('\n')
  }\nuser: ${userMessage}`;

  return callGemini(contextPrompt);
}
