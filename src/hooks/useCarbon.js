import { useState, useCallback } from 'react';
import { calculateFootprint, INDIA_DEFAULTS } from '../utils/emissions';
import { getActionPlan, getWeeklyRefresh } from '../services/gemini';

const STORAGE_KEY = 'carbonmind_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// FIXED: Moved outside the hook entirely to prevent stale closures and unnecessary re-evaluations
function getFallback(fp, userProfile) {
  const isHydro = ['himachal', 'himachal pradesh', 'uttarakhand'].includes((userProfile.region || '').toLowerCase());
  const gridContext = isHydro ? "your local renewable grid" : "India's coal grid";

  return {
    summary: 'Here are your top actions based on your footprint data.',
    actions: [
      { title: 'Reduce meat consumption by 3 days/week', impact_kg: 600, difficulty: 'medium', timeframe: '1 month', why_this_user: `Your diet contributes ${fp.diet_kg}kg/year — cutting 3 days saves ~600kg.` },
      { title: 'Switch to metro/bus for daily commute', impact_kg: Math.round(fp.transport_kg * 0.6), difficulty: 'easy', timeframe: 'immediate', why_this_user: `Your transport emits ${fp.transport_kg}kg/year. Public transit cuts this by 60%.` },
      { title: 'Optimize AC usage', impact_kg: isHydro ? 20 : 200, difficulty: 'easy', timeframe: 'immediate', why_this_user: `On ${gridContext}, 2hrs less AC/day saves ~${isHydro ? 20 : 200}kg/year.` },
    ],
    insight: 'Small consistent changes compound. Start with the easiest one today.',
  };
}

export function useCarbon() {
  const saved = load();

  const [step, setStep] = useState(saved.profile ? 'dashboard' : 'quiz');
  const [profile, setProfile] = useState(saved.profile || null);
  const [footprint, setFootprint] = useState(saved.footprint || null);
  const [geminiData, setGeminiData] = useState(saved.geminiData || null);
  const [completed, setCompleted] = useState(saved.completed || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitQuiz = useCallback(async (profileData) => {
    const fp = calculateFootprint(profileData);
    setProfile(profileData);
    setFootprint(fp);
    setStep('dashboard');
    setLoading(true);
    setError(null);

    try {
      const data = await getActionPlan(profileData, fp);
      const result = data || getFallback(fp, profileData);
      setGeminiData(result);
      save({ profile: profileData, footprint: fp, geminiData: result, completed });
    } catch {
      const fallback = getFallback(fp, profileData);
      setGeminiData(fallback);
      setError('AI coach offline — showing calculated recommendations.');
      save({ profile: profileData, footprint: fp, geminiData: fallback, completed });
    } finally {
      setLoading(false);
    }
  }, [completed]);

  const toggleAction = useCallback((action) => {
    setCompleted(prev => {
      const exists = prev.find(a => a.title === action.title);
      const next = exists
        ? prev.filter(a => a.title !== action.title)
        : [...prev, action];
      save({ profile, footprint, geminiData, completed: next });
      return next;
    });
  }, [profile, footprint, geminiData]);

  const refreshActions = useCallback(async () => {
    if (!profile || !footprint) return;
    setLoading(true);
    try {
      const data = await getWeeklyRefresh(profile, footprint, completed);
      if (data) {
        const next = { ...geminiData, actions: data.actions };
        setGeminiData(next);
        save({ profile, footprint, geminiData: next, completed });
      }
    } catch {
      setError('Could not refresh actions. Try again.');
    } finally {
      setLoading(false);
    }
  }, [profile, footprint, completed, geminiData]);

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep('quiz'); setProfile(null); setFootprint(null);
    setGeminiData(null); setCompleted([]); setError(null);
  };

  const savedKg = completed.reduce((s, a) => s + (a.impact_kg || 0), 0);

  return {
    step, profile, footprint, geminiData, completed,
    loading, error, savedKg,
    submitQuiz, toggleAction, refreshActions, reset,
  };
}