import { useState } from 'react';
import { INDIA_DEFAULTS } from '../../utils/emissions';

const QUESTIONS = [
  {
    id: 'transport',
    label: 'Primary mode of transport?',
    type: 'select',
    options: [
      { value: 'car', label: '🚗 Car' },
      { value: 'bike', label: '🏍️ Motorbike' },
      { value: 'auto', label: '🛺 Auto-rickshaw' },
      { value: 'bus', label: '🚌 Bus' },
      { value: 'metro', label: '🚇 Metro/train' },
      { value: 'walk', label: '🚶 Walk/cycle' },
    ],
  },
  {
    id: 'weeklyKm',
    label: 'How many km do you travel per week?',
    type: 'number',
    placeholder: 'e.g. 50',
    unit: 'km',
  },
  {
    id: 'diet',
    label: 'What best describes your diet?',
    type: 'select',
    options: [
      { value: 'meat-heavy', label: '🥩 Meat most days' },
      { value: 'mixed', label: '🍱 Mixed (some meat)' },
      { value: 'vegetarian', label: '🥗 Vegetarian' },
      { value: 'vegan', label: '🌱 Vegan' },
    ],
  },
  {
    id: 'energySource',
    label: 'Your home electricity source?',
    type: 'select',
    options: [
      { value: 'coal', label: '⚡ State grid (coal-heavy)' },
      { value: 'mixed', label: '🔌 Mixed grid' },
      { value: 'renewable', label: '☀️ Solar / renewables' },
    ],
  },
  {
    id: 'shortFlights',
    label: 'How many short flights per year? (<3 hrs)',
    type: 'number',
    placeholder: 'e.g. 2',
    unit: 'flights',
  },
  {
    id: 'longFlights',
    label: 'How many long flights per year? (>3 hrs)',
    type: 'number',
    placeholder: 'e.g. 0',
    unit: 'flights',
  },
];

export default function Quiz({ onSubmit }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({
    transport: '',
    weeklyKm: '',
    diet: '',
    energySource: '',
    monthlyKwh: 150,
    shortFlights: '',
    longFlights: '',
  });
  const [err, setErr] = useState('');

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  function setValue(val) {
    setAnswers(p => ({ ...p, [q.id]: val }));
    setErr('');
  }

  function next() {
    const val = answers[q.id];
    if (val === '' || val === null || val === undefined) {
      setErr('Please answer this question to continue.');
      return;
    }
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      // Use India defaults for any blank numeric fields
      const final = { ...INDIA_DEFAULTS, ...answers };
      Object.keys(final).forEach(k => {
        if (final[k] === '' || final[k] === null) final[k] = INDIA_DEFAULTS[k];
        if (typeof INDIA_DEFAULTS[k] === 'number') final[k] = Number(final[k]) || INDIA_DEFAULTS[k];
      });
      onSubmit(final);
    }
  }

  function useDefaults() {
    onSubmit(INDIA_DEFAULTS);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-semibold text-white mb-1">🌱 CarbonMind</div>
          <div className="text-gray-400 text-sm">Your personal carbon coach</div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="text-white font-medium text-lg mb-5">{q.label}</div>

          {q.type === 'select' && (
            <div className="grid grid-cols-2 gap-2">
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setValue(opt.value)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all ${
                    answers[q.id] === opt.value
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {q.type === 'number' && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={answers[q.id]}
                onChange={e => setValue(e.target.value)}
                placeholder={q.placeholder}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-green-500"
              />
              {q.unit && <span className="text-gray-400 text-sm">{q.unit}</span>}
            </div>
          )}

          {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}
        </div>

        <button
          onClick={next}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {current < QUESTIONS.length - 1 ? 'Next →' : 'Calculate my footprint'}
        </button>

        <button
          onClick={useDefaults}
          className="w-full mt-3 text-gray-500 text-sm hover:text-gray-400 transition-colors"
        >
          Use India average defaults
        </button>
      </div>
    </div>
  );
}
