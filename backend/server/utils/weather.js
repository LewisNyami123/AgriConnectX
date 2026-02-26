const fetch = require('node-fetch');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // cache 10 minutes

// Open-Meteo endpoint: no API key required
// docs: https://open-meteo.com/ (no key)
async function fetchWeather(lat, lon, params = {}) {
  const key = `weather:${lat}:${lon}:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const query = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: params.hourly || 'temperature_2m,precipitation,wind_speed_10m',
    daily: params.daily || 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: params.timezone || 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${query.toString()}`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

module.exports = { fetchWeather };
