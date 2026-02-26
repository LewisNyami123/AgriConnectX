// public/js/weather.js
import { apiGet } from './api.js';

export async function renderWeather(lat, lon, containerId='weather') {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="card">Loading weather…</div>';
  try {
    const res = await apiGet(`/resources/weather?lat=${lat}&lon=${lon}`);
    const hourly = res.data.hourly || {};
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const prec = hourly.precipitation || [];
    const html = `<div class="card"><h3>Weather</h3>
      ${times.slice(0,6).map((t,i)=>`<div>${t}: ${temps[i]}°C, ${prec[i] ?? 0} mm</div>`).join('')}
    </div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div class="card">Weather unavailable</div>';
    console.error(err);
  }
}
