import type { WeatherData, GeoLocation, AppSettings } from '../core/types'
import { getIcon, getLabel } from '../core/wmo'
import {
  formatTemp,
  formatDay,
  formatHour,
  formatWind,
  formatWindDir,
  formatTime
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
  
  const label = getLabel(current.weatherCode)

  root.innerHTML = `
    <div class="min-h-screen font-sans text-slate-800 transition-all duration-1000 ${bgTheme('', true)} relative overflow-hidden">
      <!-- Particle Overlays -->
      <div id="rain-particles" class="fixed inset-0 pointer-events-none overflow-hidden z-0"></div>
      <div id="snow-particles" class="fixed inset-0 pointer-events-none overflow-hidden z-0"></div>
      <div id="lightning-flash" class="fixed inset-0 pointer-events-none z-20"></div>

      <!-- Layout Wrapper -->
      <div class="relative z-10 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="flex items-center justify-between px-6 pt-12 pb-4 max-w-2xl mx-auto w-full animate-fade-in-up">
          <div class="flex items-center gap-1.5 bg-white px-4 py-2.5 rounded-full shadow-sm text-[#ff8e59] font-medium text-sm">
            <i class="ph-fill ph-map-pin text-lg"></i> <span class="text-slate-700">${geo.city}</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="temp-toggle-btn" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 cursor-pointer font-bold font-mono text-sm" title="Toggle Temp">
              ${settings.tempUnit === 'C' ? '°C' : '°F'}
            </button>
            <button id="hamburger-btn" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 cursor-pointer" title="Search & Menu">
              <i class="ph-bold ph-magnifying-glass text-lg"></i>
            </button>
          </div>
        </header>

        <!-- Current -->
        <section class="px-6 max-w-2xl mx-auto w-full animate-fade-in-up delay-100 relative mt-2">
          <div class="bg-gradient-to-br from-[#8ba1fa] to-[#b39cff] rounded-[2.5rem] p-7 text-white shadow-lg relative h-[220px] flex flex-col justify-center">
            <p class="text-white/90 font-medium mb-1">ตอนนี้ใน${geo.city}</p>
            <div id="current-temp-val" class="text-[5.5rem] font-bold leading-none mb-2">${formatTemp(current.temperature, settings.tempUnit)}</div>
            <p class="text-white font-medium text-lg mb-4">${label}</p>
            <div class="flex gap-2 text-xs font-medium">
              <span class="bg-white/20 px-3 py-1.5 rounded-full">▲ ${formatTemp(daily.tempMax[0], settings.tempUnit)}</span>
              <span class="bg-white/20 px-3 py-1.5 rounded-full">▼ ${formatTemp(daily.tempMin[0], settings.tempUnit)}</span>
              <span class="bg-white/20 px-3 py-1.5 rounded-full">รู้สึก ${formatTemp(current.feelsLike, settings.tempUnit)}</span>
            </div>
            <!-- Big cute icon SVG -->
            <img src="./lightning.svg" class="absolute -top-10 -right-6 w-[140px] h-[140px] drop-shadow-2xl select-none pointer-events-none" alt="Weather" />
          </div>
        </section>

        <!-- Hourly -->
        <section class="px-6 py-6 max-w-2xl mx-auto w-full animate-fade-in-up delay-200">
          <div class="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 -mx-1 scrollbar-none">
            ${hourly.time.slice(0, 24).map((t, i) => hourlyCard(t, hourly, i, settings)).join('')}
          </div>
        </section>

        <!-- Daily -->
        <section class="px-6 pb-6 max-w-2xl mx-auto w-full animate-fade-in-up delay-300">
          <div class="bg-white/80 backdrop-blur-md rounded-[2rem] p-5 shadow-sm border border-white/50">
            <div class="space-y-1">
              ${daily.time.map((t, i) => dailyRow(t, daily, i, current.isDay, settings)).join('')}
            </div>
          </div>
        </section>

        <!-- Details Button -->
        <section class="px-6 pb-12 max-w-2xl mx-auto w-full animate-fade-in-up delay-350">
          <button id="details-btn" class="w-full py-4 rounded-full bg-gradient-to-r from-[#ffae6e] to-[#ffd06e] text-white font-bold text-lg shadow-md hover:opacity-90 transition-opacity">
            ดูรายละเอียดอากาศ +
          </button>
        </section>
      </div>
    </div>
  `

  initRainParticles(current.weatherCode)
  initSnowParticles(current.weatherCode)
  initLightningFlash(current.weatherCode)

  const endTemp = settings.tempUnit === 'F' ? Math.round((current.temperature * 9) / 5 + 32) : Math.round(current.temperature)
  setTimeout(() => {
    animateValue('current-temp-val', 0, endTemp, 800, settings.tempUnit)
  }, 50)
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export function renderLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <div class="text-6xl mb-4 animate-pulse select-none"><i class="ph-duotone ph-lightning"></i></div>
      <p class="font-mono text-sm text-slate-800/40 tracking-widest animate-pulse">READING THE SKY...</p>
    </div>
  `
}

// ─── Error ────────────────────────────────────────────────────────────────────

export function renderError(root: HTMLElement, message: string): void {
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 gap-4 px-6 text-center">
      <div class="text-5xl animate-bounce select-none"><i class="ph-duotone ph-cloud-lightning"></i></div>
      <p class="text-slate-800/60 font-mono text-sm max-w-md leading-relaxed">${message}</p>
      <button id="retry-btn" class="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-mono text-sm border border-indigo-400/30 cursor-pointer shadow-lg shadow-indigo-600/20">
        Try again
      </button>
    </div>
  `
}

// ─── Locations Drawer UI ──────────────────────────────────────────────────────

export function renderDrawer(root: HTMLElement): void {
  if (document.getElementById('drawer-backdrop')) return

  const backdrop = document.createElement('div')
  backdrop.id = 'drawer-backdrop'
  backdrop.className = 'drawer-backdrop fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex justify-start'
  backdrop.innerHTML = `
    <div id="drawer-container" class="drawer-content w-full max-w-xs sm:max-w-sm bg-white/90 border-r border-white/40 h-full flex flex-col shadow-2xl">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/30">
        <h2 class="text-lg font-bold tracking-wide text-slate-800">Locations</h2>
        <button id="drawer-close" class="text-slate-800/40 hover:text-slate-800 text-lg font-mono cursor-pointer p-1">✕</button>
      </div>

      <!-- Search Section inside Drawer -->
      <div class="px-4 py-3 border-b border-white/30">
        <div class="flex items-center gap-2 px-3 py-2 bg-white/40 rounded-xl border border-white/40">
          <span class="text-sm"><i class="ph-duotone ph-magnifying-glass"></i></span>
          <input
            id="drawer-search-input"
            type="text"
            placeholder="Search city..."
            class="flex-1 bg-transparent outline-none text-slate-800 placeholder-white/30 font-mono text-sm"
            autocomplete="off"
          />
        </div>
        <!-- Search Results (hidden when empty) -->
        <div id="drawer-search-results" class="mt-2 max-h-48 overflow-y-auto scrollbar-none divide-y divide-white/5"></div>
      </div>

      <!-- Locations List (Current + Pinned) -->
      <div id="drawer-locations-list" class="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `
  root.appendChild(backdrop)

  // Trigger transition
  setTimeout(() => {
    backdrop.classList.add('open')
  }, 10)
}

export function renderLocationCardHTML(
  loc: GeoLocation,
  isCurrent: boolean,
  weather: WeatherData | null,
  settings: AppSettings
): string {
  if (weather) {
    const icon = getIcon(weather.current.weatherCode, weather.current.isDay)
    const temp = formatTemp(weather.current.temperature, settings.tempUnit)
    const label = getLabel(weather.current.weatherCode)

    return `
      <div 
        class="location-card flex items-center justify-between p-4 rounded-2xl bg-white/40 hover:bg-white/50 border border-white/30 hover:border-white/40 transition-all cursor-pointer group"
        data-lat="${loc.lat}"
        data-lon="${loc.lon}"
        data-city="${loc.city}"
        data-country="${loc.country}"
      >
        <div class="flex-1 min-w-0 pr-2">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-semibold text-slate-800 truncate">${loc.city}</span>
            ${isCurrent ? '<span class="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-medium shrink-0"><i class="ph-duotone ph-map-pin"></i> Current</span>' : ''}
          </div>
          <p class="text-xs text-slate-800/40 mt-0.5 truncate">${loc.country || 'Unknown Country'}</p>
          <p class="text-xs text-slate-800/60 mt-1 truncate">${label}</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <span class="text-2xl select-none block leading-none">${icon}</span>
            <span class="text-base font-bold font-mono text-slate-800 mt-1 block leading-none">${temp}</span>
          </div>
          ${!isCurrent ? `
            <button 
              class="unpin-btn p-1.5 rounded-lg text-slate-800/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              data-city="${loc.city}"
              data-country="${loc.country}"
              title="Delete location"
            >
              <i class="ph-duotone ph-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `
  } else {
    // Shimmering skeleton loader
    return `
      <div class="shimmer p-4 rounded-2xl border border-white/30 flex items-center justify-between h-[76px]">
        <div class="space-y-2 flex-1">
          <div class="h-4 bg-white/50 rounded-md w-1/2"></div>
          <div class="h-3 bg-white/50 rounded-md w-1/3"></div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-white/50 rounded-full"></div>
          <div class="w-8 h-6 bg-white/50 rounded-md"></div>
        </div>
      </div>
    `
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



function hourlyCard(
  time: string,
  hourly: WeatherData['hourly'],
  i: number,
  settings: AppSettings
): string {
  const icon = getIcon(hourly.weatherCode[i], true)
  const rain = hourly.precipitationProbability[i]
  const isNow = i === 0
  return `
    <div class="flex-shrink-0 flex flex-col items-center gap-1.5 ${isNow ? 'bg-white shadow-sm' : 'bg-white/50'} rounded-full px-4 py-5 min-w-[76px] transition-colors">
      <span class="font-mono text-[11px] ${isNow ? 'text-slate-400 font-semibold' : 'text-slate-400'}">${isNow ? 'ตอนนี้' : formatHour(time)}</span>
      <span class="text-3xl select-none drop-shadow-sm mt-1">${icon}</span>
      <span class="font-mono text-[10px] text-blue-400 font-bold h-3">${rain > 0 ? rain + '%' : ''}</span>
      <span class="font-mono text-lg font-bold text-slate-800 mt-1">${formatTemp(hourly.temperature[i], settings.tempUnit)}</span>
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
  const rain = daily.precipitationProbabilityMax[i]
  
  // Calculate relative bar position
  const minOfWeek = Math.min(...daily.tempMin)
  const maxOfWeek = Math.max(...daily.tempMax)
  const range = maxOfWeek - minOfWeek
  const leftPercent = ((daily.tempMin[i] - minOfWeek) / range) * 100
  const widthPercent = ((daily.tempMax[i] - daily.tempMin[i]) / range) * 100
  
  return `
    <div class="flex items-center gap-2 py-2.5 border-b border-slate-100/60 last:border-0">
      <span class="w-16 font-mono text-[15px] ${isToday ? 'text-slate-800 font-bold' : 'text-slate-700 font-medium'}">${isToday ? 'วันนี้' : formatDay(time, true)}</span>
      <span class="text-2xl select-none drop-shadow-sm w-8 text-center">${icon}</span>
      <span class="font-mono text-[11px] text-blue-400 font-bold w-8 text-left">${rain > 0 ? rain + '%' : ''}</span>
      
      <span class="text-slate-400 font-mono text-sm font-medium w-8 text-right">${formatTemp(daily.tempMin[i], settings.tempUnit)}</span>
      
      <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-2 relative">
         <div class="absolute h-full bg-gradient-to-r from-blue-300 to-orange-300 rounded-full opacity-80" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
      </div>
      
      <span class="text-slate-800 font-mono text-base font-bold w-8 text-right">${formatTemp(daily.tempMax[i], settings.tempUnit)}</span>
    </div>
  `
}

function bgTheme(_bg: string, _isDay: boolean): string {
  // Use a global pastel theme like the design
  return 'bg-gradient-to-b from-[#eef0ff] via-[#f7ebff] to-[#fdfbfb]'
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

export function renderDetailsDrawer(root: HTMLElement, data: WeatherData, settings: AppSettings): void {
  const backdrop = document.createElement('div')
  backdrop.id = 'details-backdrop'
  backdrop.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] opacity-0 transition-opacity flex items-end sm:items-center justify-center'

  const { current, daily } = data

  const getAqiInfo = (aqi: number) => {
    if (aqi <= 50) return { label: 'ดี', color: 'text-emerald-500' }
    if (aqi <= 100) return { label: 'ปานกลาง', color: 'text-amber-500' }
    if (aqi <= 150) return { label: 'เริ่มมีผลกระทบ', color: 'text-orange-500' }
    return { label: 'มีผลกระทบ', color: 'text-rose-500' }
  }
  const aqi = getAqiInfo(data.aqi.aqi)

  backdrop.innerHTML = `
    <div class="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl transform translate-y-full sm:translate-y-4 sm:scale-95 transition-transform duration-300 relative">
      <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
      <button id="details-close" class="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors">
        <i class="ph-bold ph-x"></i>
      </button>

      <h2 class="text-xl font-bold text-slate-800 mb-6 px-2">รายละเอียดอากาศ</h2>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center text-center">
          <i class="ph-duotone ph-drop text-3xl text-blue-400 mb-2"></i>
          <span class="text-xs text-slate-500 mb-1">ความชื้น</span>
          <span class="font-bold text-slate-800 text-lg">${current.humidity}%</span>
        </div>
        <div class="bg-emerald-50/50 rounded-2xl p-4 flex flex-col items-center text-center">
          <i class="ph-duotone ph-wind text-3xl text-emerald-400 mb-2"></i>
          <span class="text-xs text-slate-500 mb-1">ลม (${formatWindDir(current.windDirection)})</span>
          <span class="font-bold text-slate-800 text-lg">${formatWind(current.windSpeed, settings.speedUnit)}</span>
        </div>
        <div class="bg-purple-50/50 rounded-2xl p-4 flex flex-col items-center text-center">
          <i class="ph-duotone ph-gauge text-3xl text-purple-400 mb-2"></i>
          <span class="text-xs text-slate-500 mb-1">ความกดอากาศ</span>
          <span class="font-bold text-slate-800 text-lg">${current.pressure} hPa</span>
        </div>
        <div class="bg-orange-50/50 rounded-2xl p-4 flex flex-col items-center text-center">
          <i class="ph-duotone ph-sun text-3xl text-orange-400 mb-2"></i>
          <span class="text-xs text-slate-500 mb-1">UV Index</span>
          <span class="font-bold text-slate-800 text-lg">${current.uvIndex}</span>
        </div>
        <div class="bg-rose-50/50 rounded-2xl p-4 flex flex-col items-center text-center col-span-2">
          <i class="ph-duotone ph-leaf text-3xl ${aqi.color} mb-2"></i>
          <span class="text-xs text-slate-500 mb-1">คุณภาพอากาศ (AQI: ${data.aqi.aqi})</span>
          <span class="font-bold ${aqi.color} text-lg">${aqi.label}</span>
        </div>
      </div>

      <div class="flex gap-4 px-2">
        <div class="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl flex-1 justify-center">
          <i class="ph-duotone ph-sun-horizon text-orange-400 text-lg"></i> ${formatTime(daily.sunrise[0])}
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl flex-1 justify-center">
          <i class="ph-duotone ph-sun-dim text-indigo-400 text-lg"></i> ${formatTime(daily.sunset[0])}
        </div>
      </div>
    </div>
  `

  root.appendChild(backdrop)

  // animate in
  requestAnimationFrame(() => {
    backdrop.classList.add('opacity-100')
    const sheet = backdrop.querySelector('div')
    sheet?.classList.remove('translate-y-full', 'sm:translate-y-4', 'sm:scale-95')
  })

  const closeDrawer = () => {
    backdrop.classList.remove('opacity-100')
    const sheet = backdrop.querySelector('div')
    sheet?.classList.add('translate-y-full', 'sm:translate-y-4', 'sm:scale-95')
    setTimeout(() => backdrop.remove(), 300)
  }

  backdrop.querySelector('#details-close')?.addEventListener('click', closeDrawer)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer()
  })
}
