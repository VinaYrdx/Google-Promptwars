// Source: IPCC AR6 WG3 Table 10.2, 2022
const TRANSPORT_KG_PER_KM = {
  car: 0.21,       // avg petrol car
  bike: 0.103,     // motorbike
  auto: 0.08,      // auto-rickshaw (India-specific)
  bus: 0.089,
  train: 0.041,
  metro: 0.031,
  walk: 0,
};

// Source: Poore & Nemecek, Science 2018
const DIET_KG_PER_YEAR = {
  'meat-heavy': 3300,
  mixed: 2500,
  vegetarian: 1700,
  vegan: 1500,
};

// Source: CEA India Emission Factor 2023 (India default: coal grid)
const ENERGY_KG_PER_KWH = {
  coal: 0.82,
  mixed: 0.45,
  renewable: 0.05, // Heavy hydro regions (Himachal Pradesh, Uttarakhand)
};

// Source: ICAO Carbon Emissions Calculator + RFI multiplier 1.9
const FLIGHT_KG = {
  short: 260,   // <3hr, per flight
  long: 1500,   // >3hr, per flight × radiative forcing index
};

export const INDIA_DEFAULTS = {
  transport: 'auto',
  weeklyKm: 50,
  diet: 'mixed',
  energySource: 'coal',
  monthlyKwh: 150,
  shortFlights: 2,
  longFlights: 0,
  region: 'general', // Added for dynamic context
};

export const INDIA_AVG_TONNES = 1.9;
export const GLOBAL_AVG_TONNES = 4.7;

export function calculateFootprint(userInput) {
  // 1. DEFENSIVE SHIELD: Ensure we never crash on null/undefined
  // Merge user input with defaults so every variable is guaranteed to exist
  const profile = { ...INDIA_DEFAULTS, ...(userInput || {}) };

  // 2. DYNAMIC CONTEXT: Smart grid routing based on region
  const hydroStates = ['himachal', 'himachal pradesh', 'uttarakhand'];
  if (profile.region && hydroStates.includes(profile.region.toLowerCase())) {
      profile.energySource = 'renewable';
  }

  // 3. SAFE MATH: Parse everything to Floats to prevent NaN errors from string inputs
  const weeklyKm = parseFloat(profile.weeklyKm) || 0;
  const monthlyKwh = parseFloat(profile.monthlyKwh) || 0;
  const shortFlights = parseFloat(profile.shortFlights) || 0;
  const longFlights = parseFloat(profile.longFlights) || 0;

  // 4. EXECUTE CALCULATIONS
  const transport = (TRANSPORT_KG_PER_KM[profile.transport] || TRANSPORT_KG_PER_KM['car']) * weeklyKm * 52;
  const diet = DIET_KG_PER_YEAR[profile.diet] || DIET_KG_PER_YEAR['mixed'];
  const energy = (ENERGY_KG_PER_KWH[profile.energySource] || ENERGY_KG_PER_KWH['coal']) * monthlyKwh * 12;
  const flights = (shortFlights * FLIGHT_KG.short) + (longFlights * FLIGHT_KG.long);

  const total = transport + diet + energy + flights;

  return {
    transport_kg: Math.round(transport),
    diet_kg: Math.round(diet),
    energy_kg: Math.round(energy),
    flights_kg: Math.round(flights),
    total_kg: Math.round(total),
    total_tonnes: parseFloat((total / 1000).toFixed(2)),
  };
}