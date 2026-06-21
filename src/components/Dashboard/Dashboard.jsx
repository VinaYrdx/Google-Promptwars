import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { INDIA_AVG_TONNES, GLOBAL_AVG_TONNES } from '../../utils/emissions';

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#f97316'];
const LABELS = ['Transport', 'Diet', 'Energy', 'Flights'];
const DIFFICULTY_COLOR = { easy: 'text-green-400', medium: 'text-amber-400', hard: 'text-red-400' };

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-800 rounded-xl h-24" />
      ))}
    </div>
  );
}

export default function Dashboard({ footprint, geminiData, loading, error, completed, onToggle, onRefresh, onReset }) {
  const chartData = [
    { name: 'Transport', value: footprint.transport_kg },
    { name: 'Diet', value: footprint.diet_kg },
    { name: 'Energy', value: footprint.energy_kg },
    { name: 'Flights', value: footprint.flights_kg },
  ].filter(d => d.value > 0);

  const savedKg = completed.reduce((s, a) => s + (a.impact_kg || 0), 0);
  const allDone = geminiData?.actions?.every(a => completed.find(c => c.title === a.title));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div>
          <div className="text-xl font-semibold">🌱 CarbonMind</div>
          <div className="text-gray-400 text-xs">Your carbon footprint analysis</div>
        </div>
        <button onClick={onReset} className="text-gray-500 text-xs hover:text-gray-400 border border-gray-700 px-3 py-1 rounded-lg">
          Retake quiz
        </button>
      </div>

      {/* Big number */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <div className="text-gray-400 text-sm mb-1">Your annual footprint</div>
        <div className="text-5xl font-bold text-white mb-1">{footprint.total_tonnes}t</div>
        <div className="text-gray-400 text-sm">CO₂ equivalent / year</div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className={`text-lg font-semibold ${footprint.total_tonnes > INDIA_AVG_TONNES ? 'text-amber-400' : 'text-green-400'}`}>
              {INDIA_AVG_TONNES}t
            </div>
            <div className="text-gray-500 text-xs">India avg</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${footprint.total_tonnes > GLOBAL_AVG_TONNES ? 'text-red-400' : 'text-green-400'}`}>
              {GLOBAL_AVG_TONNES}t
            </div>
            <div className="text-gray-500 text-xs">Global avg</div>
          </div>
          {savedKg > 0 && (
            <div className="text-center ml-auto">
              <div className="text-lg font-semibold text-green-400">-{savedKg}kg</div>
              <div className="text-gray-500 text-xs">saved so far</div>
            </div>
          )}
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
        <div className="text-sm text-gray-400 mb-3">Breakdown by category</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              isAnimationActive
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${Math.round(v)}kg`, n]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
              {d.name}: {Math.round(d.value)}kg
            </div>
          ))}
        </div>
      </div>

      {/* Action plan */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-white">Your action plan</div>
          <div className="text-xs text-gray-500">powered by Gemini AI</div>
        </div>

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs p-3 rounded-xl mb-3">
            {error}
          </div>
        )}

        {loading ? <Skeleton /> : (
          <div className="space-y-3">
            {geminiData?.actions?.map((action, i) => {
              const done = !!completed.find(c => c.title === action.title);
              return (
                <div
                  key={i}
                  onClick={() => onToggle(action)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    done
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      done ? 'bg-green-500 border-green-500' : 'border-gray-600'
                    }`}>
                      {done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm mb-1 ${done ? 'line-through text-gray-500' : 'text-white'}`}>
                        {action.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{action.why_this_user}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-400 font-medium">-{action.impact_kg}kg/yr</span>
                        <span className={DIFFICULTY_COLOR[action.difficulty] || 'text-gray-400'}>
                          {action.difficulty}
                        </span>
                        <span className="text-gray-500">{action.timeframe}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allDone && !loading && (
          <button
            onClick={onRefresh}
            className="w-full mt-3 border border-green-600 text-green-400 py-3 rounded-xl text-sm hover:bg-green-600/10 transition-colors"
          >
            ✨ Get new actions from CarbonMind
          </button>
        )}
      </div>

      {/* Summary insight */}
      {geminiData?.insight && !loading && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="text-green-300 text-sm italic">"{geminiData.insight}"</div>
          <div className="text-green-500/60 text-xs mt-1">— CarbonMind AI</div>
        </div>
      )}
    </div>
  );
}
