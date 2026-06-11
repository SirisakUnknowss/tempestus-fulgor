import type { WeatherData, GeoLocation, AppSettings, AirQuality } from '../core/types'
import { getIcon, getLabel, getWeatherIcon } from '../core/wmo'
import {
  formatTemp,
  formatWind,
  formatWindDir,
  formatTime,
  formatDay,
  formatHour,
} from '../utils/format'

// ─── Animation States ─────────────────────────────────────────────────────────

let lightningTimeout: ReturnType<typeof setTimeout> | null = null

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
    <div class="min-h-screen font-sans text-white transition-all duration-1000 ${bgTheme(bgClass, current.isDay)} relative overflow-hidden">
      <!-- Particle and Storm Overlays -->
      <div id="rain-particles" class="fixed inset-0 pointer-events-none overflow-hidden z-0"></div>
      <div id="snow-particles" class="fixed inset-0 pointer-events-none overflow-hidden z-0"></div>
      <div id="lightning-flash" class="fixed inset-0 pointer-events-none z-20"></div>

      <!-- Layout Wrapper -->
      <div class="relative z-10 flex flex-col min-h-screen justify-between">
        <!-- Header -->
        <header class="flex items-center justify-between px-6 pt-8 pb-4 max-w-2xl mx-auto w-full animate-fade-in-up">
          <div>
            <p class="font-mono text-xs tracking-[0.2em] uppercase text-white/40">⚡ Tempestus Fulgor</p>
            <h1 class="text-2xl font-bold mt-1">${geo.city}<span class="text-white/40 font-normal text-base ml-2">${geo.country}</span></h1>
          </div>
          <div class="flex items-center gap-2">
            <button id="temp-toggle-btn" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-mono font-medium border border-white/5 cursor-pointer" title="Toggle Temperature Unit">
              ${settings.tempUnit === 'C' ? '°C' : '°F'}
            </button>
            <button id="speed-toggle-btn" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-mono font-medium border border-white/5 cursor-pointer" title="Toggle Wind Speed Unit">
              ${settings.speedUnit === 'kmh' ? 'km/h' : settings.speedUnit === 'mph' ? 'mph' : 'm/s'}
            </button>
            <button id="search-btn" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/5 cursor-pointer" title="Search city">
              🔍
            </button>
          </div>
        </header>

        <!-- Current -->
        <section class="px-6 py-6 max-w-2xl mx-auto w-full animate-fade-in-up delay-100">
          <div class="flex items-end gap-4 mb-2">
            <span class="text-8xl leading-none select-none">${icon}</span>
            <div>
              <div id="current-temp-val" class="text-7xl font-bold leading-none">${formatTemp(current.temperature, settings.tempUnit)}</div>
              <div class="text-white/60 text-sm mt-1">Feels like ${formatTemp(current.feelsLike, settings.tempUnit)}</div>
            </div>
          </div>
          <p class="text-xl text-white/80 mt-3">${label}</p>

          <!-- Stats row -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            ${statCard('💧', `${current.humidity}%`, 'Humidity')}
            ${statCard('💨', formatWind(current.windSpeed, settings.speedUnit), `Wind ${formatWindDir(current.windDirection)}`)}
            ${statCard('🌡️', `${current.pressure}hPa`, 'Pressure')}
            ${statCard('☀️', `UV ${current.uvIndex}`, 'UV Index')}
            ${aqiCard(data.aqi)}
          </div>

          <!-- Sunrise / Sunset -->
          <div class="flex gap-4 mt-4">
            <div class="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
              <span>🌅</span> ${formatTime(daily.sunrise[0])}
            </div>
            <div class="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
              <span>🌇</span> ${formatTime(daily.sunset[0])}
            </div>
          </div>
        </section>

        <!-- Hourly -->
        <section class="px-6 pb-4 max-w-2xl mx-auto w-full animate-fade-in-up delay-200">
          <p class="font-mono text-xs tracking-widest text-white/40 uppercase mb-3">Next 24 hours</p>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            ${hourly.time
              .slice(0, 24)
              .map((t, i) => hourlyCard(t, hourly, i, settings))
              .join('')}
          </div>
        </section>

        <!-- Daily -->
        <section class="px-6 pb-10 max-w-2xl mx-auto w-full animate-fade-in-up delay-300">
          <p class="font-mono text-xs tracking-widest text-white/40 uppercase mb-3">7-Day Forecast</p>
          <div class="space-y-2">
            ${daily.time.map((t, i) => dailyRow(t, daily, i, current.isDay, settings)).join('')}
          </div>
        </section>

        <!-- Footer -->
        <footer class="text-center pb-8 font-mono text-xs text-white/20 animate-fade-in-up delay-350">
          The storm knows.
        </footer>
      </div>
    </div>
  `

  // ─── Initialize Animations ──────────────────────────────────────────────────
  initRainParticles(current.weatherCode)
  initSnowParticles(current.weatherCode)
  initLightningFlash(current.weatherCode)

  const endTemp =
    settings.tempUnit === 'F'
      ? Math.round((current.temperature * 9) / 5 + 32)
      : Math.round(current.temperature)
  setTimeout(() => {
    animateValue('current-temp-val', 0, endTemp, 800, settings.tempUnit)
  }, 50)
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export function renderLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#030308] text-white">
      <div class="text-6xl mb-4 animate-pulse select-none">⚡</div>
      <p class="font-mono text-sm text-white/40 tracking-widest animate-pulse">READING THE SKY...</p>
    </div>
  `
}

// ─── Error ────────────────────────────────────────────────────────────────────

export function renderError(root: HTMLElement, message: string): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#030308] text-white gap-4 px-6 text-center">
      <div class="text-5xl animate-bounce select-none">🌩️</div>
      <p class="text-white/60 font-mono text-sm max-w-md leading-relaxed">${message}</p>
      <button id="retry-btn" class="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-mono text-sm border border-indigo-400/30 cursor-pointer shadow-lg shadow-indigo-600/20">
        Try again
      </button>
    </div>
  `
}

// ─── Search UI ────────────────────────────────────────────────────────────────

export function renderSearch(root: HTMLElement): void {
  const overlay = document.createElement('div')
  overlay.id = 'search-overlay'
  overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-start justify-center pt-0 px-0 sm:pt-8 sm:px-6 animate-fade-in'
  overlay.innerHTML = `
    <div class="w-full max-w-md bg-[#0a0818]/95 rounded-b-2xl sm:rounded-2xl border-b border-x sm:border border-white/10 overflow-hidden shadow-2xl animate-slide-down">
      <div class="flex items-center gap-3 p-4 border-b border-white/10">
        <span>🔍</span>
        <input
          id="search-input"
          type="text"
          placeholder="Search city..."
          class="flex-1 bg-transparent outline-none text-white placeholder-white/30 font-mono text-sm"
          autofocus
        />
        <button id="search-close" class="text-white/40 hover:text-white font-mono cursor-pointer">✕</button>
      </div>
      <div id="search-results" class="max-h-60 overflow-y-auto scrollbar-none"></div>
    </div>
  `
  root.appendChild(overlay)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statCard(icon: string, value: string, label: string): string {
  return `
    <div class="bg-white/10 rounded-2xl p-3 text-center border border-white/5 backdrop-blur-md flex flex-col justify-between">
      <div class="text-xl mb-1 select-none">${icon}</div>
      <div class="font-mono text-sm font-semibold">${value}</div>
      <div class="text-white/40 text-xs mt-0.5">${label}</div>
    </div>
  `
}

function getAqiInfo(aqi: number) {
  if (aqi <= 50) return { label: 'Good', color: 'text-emerald-400' }
  if (aqi <= 100) return { label: 'Moderate', color: 'text-amber-400' }
  if (aqi <= 150) return { label: 'Sensitive', color: 'text-orange-400' }
  return { label: 'Unhealthy', color: 'text-rose-400' }
}

function aqiCard(aqi: AirQuality): string {
  const info = getAqiInfo(aqi.aqi)
  return `
    <div class="bg-white/10 rounded-2xl p-3 text-center border border-white/5 backdrop-blur-md flex flex-col justify-between col-span-2 md:col-span-1">
      <div class="text-xl mb-1 select-none">🍃</div>
      <div class="font-mono text-sm font-semibold">${aqi.aqi} <span class="text-[10px] ${info.color} font-sans block leading-none mt-0.5">${info.label}</span></div>
      <div class="text-white/40 text-xs mt-0.5">Air Quality</div>
    </div>
  `
}

function hourlyCard(
  time: string,
  hourly: WeatherData['hourly'],
  i: number,
  settings: AppSettings
): string {
  const icon = getIcon(hourly.weatherCode[i], true)
  const rain = hourly.precipitationProbability[i]
  return `
    <div class="flex-shrink-0 flex flex-col items-center gap-1 bg-white/10 rounded-2xl px-4 py-3 min-w-[68px] border border-white/5 backdrop-blur-md">
      <span class="font-mono text-xs text-white/50">${formatHour(time)}</span>
      <span class="text-2xl select-none">${icon}</span>
      <span class="font-mono text-sm font-medium">${formatTemp(hourly.temperature[i], settings.tempUnit)}</span>
      ${rain > 0 ? `<span class="font-mono text-xs text-blue-300 font-semibold">${rain}%</span>` : '<span class="text-xs text-white/0 select-none">0%</span>'}
    </div>
  `
}

function dailyRow(
  time: string,
  daily: WeatherData['daily'],
  i: number,
  isDay: boolean,
  settings: AppSettings
): string {
  const icon = getIcon(daily.weatherCode[i], isDay)
  const isToday = i === 0
  return `
    <div class="flex items-center gap-4 px-4 py-3 rounded-2xl ${isToday ? 'bg-white/15' : 'bg-white/5'} hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-md">
      <span class="w-16 font-mono text-sm ${isToday ? 'text-white font-semibold' : 'text-white/60'}">${formatDay(time, true)}</span>
      <span class="text-2xl select-none">${icon}</span>
      <span class="flex-1 text-sm text-white/60 truncate">${getLabel(daily.weatherCode[i])}</span>
      ${
        daily.precipitationProbabilityMax[i] > 10
          ? `<span class="font-mono text-xs text-blue-300 font-semibold">${daily.precipitationProbabilityMax[i]}%</span>`
          : ''
      }
      <div class="font-mono text-sm text-right">
        <span class="text-white font-medium">${formatTemp(daily.tempMax[i], settings.tempUnit)}</span>
        <span class="text-white/40 ml-2 font-medium">${formatTemp(daily.tempMin[i], settings.tempUnit)}</span>
      </div>
    </div>
  `
}

function bgTheme(bg: string, isDay: boolean): string {
  const themes: Record<string, string> = {
    'bg-clear-day': isDay
      ? 'bg-gradient-to-b from-sky-500 via-blue-400 to-indigo-600'
      : 'bg-gradient-to-b from-[#020617] via-[#0a0a2e] to-[#030308]',
    'bg-cloudy': 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900',
    'bg-fog': 'bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800',
    'bg-rain': 'bg-gradient-to-b from-slate-700 via-blue-900 to-slate-900',
    'bg-storm': 'bg-gradient-to-b from-[#0a0a0a] via-[#1a0a2e] to-[#030308]',
    'bg-snow': 'bg-gradient-to-b from-slate-800 via-blue-950 to-slate-900',
    'bg-default': 'bg-gradient-to-b from-[#030308] to-[#0a0818]',
  }
  return themes[bg] ?? themes['bg-default']
}

// ─── Animation Utilities ─────────────────────────────────────────────────────

function animateValue(
  id: string,
  start: number,
  end: number,
  duration: number,
  unit: string
): void {
  const obj = document.getElementById(id)
  if (!obj) return
  const element: HTMLElement = obj
  const range = end - start
  const startTime = performance.now()

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = progress * (2 - progress) // Ease out quad
    const current = start + range * ease
    element.innerHTML = `${Math.round(current)}°${unit}`
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

function initRainParticles(code: number): void {
  const container = document.getElementById('rain-particles')
  if (!container) return

  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]
  if (!rainCodes.includes(code)) {
    container.innerHTML = ''
    return
  }

  let dropCount = 40
  if ([55, 65, 82, 99].includes(code)) {
    dropCount = 100 // Heavy
  } else if ([53, 63, 81, 95, 96].includes(code)) {
    dropCount = 70 // Moderate
  }

  let html = ''
  for (let i = 0; i < dropCount; i++) {
    const left = Math.random() * 100
    const duration = 0.45 + Math.random() * 0.4
    const delay = Math.random() * -2
    const opacity = 0.15 + Math.random() * 0.4
    const height = 30 + Math.random() * 40
    html += `<div class="rain-drop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s; opacity: ${opacity}; height: ${height}px;"></div>`
  }
  container.innerHTML = html
}

function initSnowParticles(code: number): void {
  const container = document.getElementById('snow-particles')
  if (!container) return

  const snowCodes = [71, 73, 75, 77, 85, 86]
  if (!snowCodes.includes(code)) {
    container.innerHTML = ''
    return
  }

  let flakeCount = 25
  if ([75, 86].includes(code)) {
    flakeCount = 70 // Heavy
  } else if ([73, 85].includes(code)) {
    flakeCount = 45 // Moderate
  }

  let html = ''
  for (let i = 0; i < flakeCount; i++) {
    const left = Math.random() * 100
    const size = 3 + Math.random() * 5
    const duration = 2.5 + Math.random() * 3
    const delay = Math.random() * -5
    const opacity = 0.3 + Math.random() * 0.45
    html += `<div class="snow-flake" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-duration: ${duration}s; animation-delay: ${delay}s; opacity: ${opacity};"></div>`
  }
  container.innerHTML = html
}

function initLightningFlash(code: number): void {
  if (lightningTimeout) {
    clearTimeout(lightningTimeout)
    lightningTimeout = null
  }

  const stormCodes = [82, 95, 96, 99]
  if (!stormCodes.includes(code)) return

  const flashEl = document.getElementById('lightning-flash')
  if (!flashEl) return

  function flash() {
    if (!document.getElementById('lightning-flash')) return

    flashEl!.style.opacity = '0.8'
    setTimeout(() => {
      flashEl!.style.opacity = '0.15'
      setTimeout(() => {
        flashEl!.style.opacity = '0.9'
        setTimeout(() => {
          flashEl!.style.opacity = '0'
        }, 50)
      }, 30)
    }, 40)

    const delay = 4000 + Math.random() * 8000
    lightningTimeout = setTimeout(flash, delay)
  }

  lightningTimeout = setTimeout(flash, 2000 + Math.random() * 3000)
}
