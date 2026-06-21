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
  renewable: 0.05,
};

// Source: ICAO Carbon Emissions Calculator + RFI multiplier 1.9
const FLIGHT_KG = {
  short: 260,   // <3hr, per flight
  long: 1500,   // >3hr, per flight × radiative forcing index
};

// India averages for defaults
export const INDIA_DEFAULTS = {
  transport: 'auto',
  weeklyKm: 50,
  diet: 'mixed',
  energySource: 'coal',
  monthlyKwh: 150,
  shortFlights: 2,
  longFlights: 0,
};

export const INDIA_AVG_TONNES = 1.9;
export const GLOBAL_AVG_TONNES = 4.7;

export function calculateFootprint(profile) {
  const transport = (TRANSPORT_KG_PER_KM[profile.transport] || 0.21)
    * (profile.weeklyKm || 0) * 52;

  const diet = DIET_KG_PER_YEAR[profile.diet] || 2500;

  const energy = (ENERGY_KG_PER_KWH[profile.energySource] || 0.82)
    * (profile.monthlyKwh || 150) * 12;

  const flights =
    (profile.shortFlights || 0) * FLIGHT_KG.short +
    (profile.longFlights || 0) * FLIGHT_KG.long;

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
