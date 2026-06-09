import type { WeatherData, GeoLocation, AppSettings } from '../core/types'
import { getIcon, getLabel, getWeatherIcon } from '../core/wmo'
import { formatTemp, formatWind, formatWindDir, formatTime, formatDay, formatHour } from '../utils/format'

// ─── Root render ──────────────────────────────────────────────────────────────

export function renderApp(
  root: HTMLElement,
  geo: GeoLocation,
  data: WeatherData,
  settings: AppSettings
): void {
  const { current, hourly, daily } = data
  const icon = getIcon(current.weatherCode, current.isDay)
  const label = getLabel(current.weatherCode)
  const bgClass = getWeatherIcon(current.weatherCode, current.isDay).bg

  root.innerHTML = `
    <div class="min-h-screen font-sans text-white transition-all duration-1000 ${bgTheme(bgClass, current.isDay)}">
      <!-- Header -->
      <header class="flex items-center justify-between px-6 pt-8 pb-4 max-w-2xl mx-auto">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] uppercase text-white/40">⚡ Tempestus Fulgor</p>
          <h1 class="text-2xl font-bold mt-1">${geo.city}<span class="text-white/40 font-normal text-base ml-2">${geo.country}</span></h1>
        </div>
        <button id="search-btn" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Search city">
          🔍
        </button>
      </header>

      <!-- Current -->
      <section class="px-6 py-6 max-w-2xl mx-auto">
        <div class="flex items-end gap-4 mb-2">
          <span class="text-8xl leading-none">${icon}</span>
          <div>
            <div class="text-7xl font-bold leading-none">${formatTemp(current.temperature, settings.tempUnit)}</div>
            <div class="text-white/60 text-sm mt-1">Feels like ${formatTemp(current.feelsLike, settings.tempUnit)}</div>
          </div>
        </div>
        <p class="text-xl text-white/80 mt-3">${label}</p>

        <!-- Stats row -->
        <div class="grid grid-cols-4 gap-3 mt-6">
          ${statCard('💧', `${current.humidity}%`, 'Humidity')}
          ${statCard('💨', formatWind(current.windSpeed, settings.speedUnit), `Wind ${formatWindDir(current.windDirection)}`)}
          ${statCard('🌡️', `${current.pressure}hPa`, 'Pressure')}
          ${statCard('☀️', `UV ${current.uvIndex}`, 'UV Index')}
        </div>

        <!-- Sunrise / Sunset -->
        <div class="flex gap-4 mt-4">
          <div class="flex items-center gap-2 text-sm text-white/60">
            <span>🌅</span> ${formatTime(daily.sunrise[0])}
          </div>
          <div class="flex items-center gap-2 text-sm text-white/60">
            <span>🌇</span> ${formatTime(daily.sunset[0])}
          </div>
        </div>
      </section>

      <!-- Hourly -->
      <section class="px-6 pb-4 max-w-2xl mx-auto">
        <p class="font-mono text-xs tracking-widest text-white/40 uppercase mb-3">Next 24 hours</p>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          ${hourly.time.slice(0, 24).map((t, i) => hourlyCard(t, hourly, i, settings)).join('')}
        </div>
      </section>

      <!-- Daily -->
      <section class="px-6 pb-10 max-w-2xl mx-auto">
        <p class="font-mono text-xs tracking-widest text-white/40 uppercase mb-3">7-Day Forecast</p>
        <div class="space-y-2">
          ${daily.time.map((t, i) => dailyRow(t, daily, i, current.isDay, settings)).join('')}
        </div>
      </section>

      <!-- Footer -->
      <footer class="text-center pb-8 font-mono text-xs text-white/20">
        The storm knows.
      </footer>
    </div>
  `
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export function renderLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#030308] text-white">
      <div class="text-6xl mb-4 animate-pulse">⚡</div>
      <p class="font-mono text-sm text-white/40 tracking-widest">READING THE SKY...</p>
    </div>
  `
}

// ─── Error ────────────────────────────────────────────────────────────────────

export function renderError(root: HTMLElement, message: string): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#030308] text-white gap-4 px-6 text-center">
      <div class="text-5xl">🌩️</div>
      <p class="text-white/60">${message}</p>
      <button id="retry-btn" class="mt-4 px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors font-mono text-sm">
        Try again
      </button>
    </div>
  `
}

// ─── Search UI ────────────────────────────────────────────────────────────────

export function renderSearch(root: HTMLElement): void {
  const overlay = document.createElement('div')
  overlay.id = 'search-overlay'
  overlay.innerHTML = `
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-6">
      <div class="w-full max-w-md bg-[#0a0818] rounded-2xl border border-white/10 overflow-hidden">
        <div class="flex items-center gap-3 p-4 border-b border-white/10">
          <span>🔍</span>
          <input
            id="search-input"
            type="text"
            placeholder="Search city..."
            class="flex-1 bg-transparent outline-none text-white placeholder-white/30 font-mono text-sm"
            autofocus
          />
          <button id="search-close" class="text-white/40 hover:text-white">✕</button>
        </div>
        <div id="search-results" class="max-h-60 overflow-y-auto"></div>
      </div>
    </div>
  `
  root.appendChild(overlay)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statCard(icon: string, value: string, label: string): string {
  return `
    <div class="bg-white/10 rounded-2xl p-3 text-center">
      <div class="text-xl mb-1">${icon}</div>
      <div class="font-mono text-sm font-semibold">${value}</div>
      <div class="text-white/40 text-xs mt-0.5">${label}</div>
    </div>
  `
}

function hourlyCard(time: string, hourly: WeatherData['hourly'], i: number, settings: AppSettings): string {
  const icon = getIcon(hourly.weatherCode[i], true)
  const rain = hourly.precipitationProbability[i]
  return `
    <div class="flex-shrink-0 flex flex-col items-center gap-1 bg-white/10 rounded-2xl px-4 py-3 min-w-[64px]">
      <span class="font-mono text-xs text-white/50">${formatHour(time)}</span>
      <span class="text-2xl">${icon}</span>
      <span class="font-mono text-sm font-medium">${formatTemp(hourly.temperature[i], settings.tempUnit)}</span>
      ${rain > 0 ? `<span class="font-mono text-xs text-blue-300">${rain}%</span>` : '<span class="text-xs text-white/0">0%</span>'}
    </div>
  `
}

function dailyRow(time: string, daily: WeatherData['daily'], i: number, isDay: boolean, settings: AppSettings): string {
  const icon = getIcon(daily.weatherCode[i], isDay)
  const isToday = i === 0
  return `
    <div class="flex items-center gap-4 px-4 py-3 rounded-2xl ${isToday ? 'bg-white/15' : 'bg-white/5'} hover:bg-white/10 transition-colors">
      <span class="w-16 font-mono text-sm ${isToday ? 'text-white font-semibold' : 'text-white/60'}">${formatDay(time, true)}</span>
      <span class="text-2xl">${icon}</span>
      <span class="flex-1 text-sm text-white/60 truncate">${getLabel(daily.weatherCode[i])}</span>
      ${daily.precipitationProbabilityMax[i] > 10
        ? `<span class="font-mono text-xs text-blue-300">${daily.precipitationProbabilityMax[i]}%</span>`
        : ''}
      <div class="font-mono text-sm text-right">
        <span class="text-white">${formatTemp(daily.tempMax[i], settings.tempUnit)}</span>
        <span class="text-white/40 ml-2">${formatTemp(daily.tempMin[i], settings.tempUnit)}</span>
      </div>
    </div>
  `
}

function bgTheme(bg: string, isDay: boolean): string {
  const themes: Record<string, string> = {
    'bg-clear-day':  isDay
      ? 'bg-gradient-to-b from-sky-500 via-blue-400 to-indigo-600'
      : 'bg-gradient-to-b from-[#020617] via-[#0a0a2e] to-[#030308]',
    'bg-cloudy':     'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900',
    'bg-fog':        'bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800',
    'bg-rain':       'bg-gradient-to-b from-slate-700 via-blue-900 to-slate-900',
    'bg-storm':      'bg-gradient-to-b from-[#0a0a0a] via-[#1a0a2e] to-[#030308]',
    'bg-snow':       'bg-gradient-to-b from-slate-300 via-blue-100 to-slate-400 text-slate-900',
    'bg-default':    'bg-gradient-to-b from-[#030308] to-[#0a0818]',
  }
  return themes[bg] ?? themes['bg-default']
}
