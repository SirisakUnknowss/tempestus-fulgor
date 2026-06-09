# ⚡ Tempestus Fulgor — Roadmap

> *"The storm knows."*
>
> Weather web app ที่รู้สึกเหมือน spell Harry Potter — พยากรณ์อากาศที่ดูดิบ ลึก และมีพลัง

**Stack:** Vanilla JS · TypeScript · Vite · Tailwind CSS · Open-Meteo API · Supabase (Phase 3+)  
**Deploy:** GitHub Pages → Cloudflare Pages (Phase 4)

---

## Phase 0 — Foundation `[ ]`
> *ตั้งโครงสร้างทุกอย่างให้ถูกต้องก่อนเขียนฟีเจอร์แม้แต่บรรทัดเดียว*

### 0.1 Project Setup
- [ ] `npm create vite@latest . -- --template vanilla-ts`
- [ ] ติดตั้ง Tailwind CSS v4
- [ ] ตั้ง ESLint + Prettier
- [ ] ตั้ง `tsconfig.json` ให้ strict
- [ ] ตั้ง folder structure

```
src/
├── core/           # business logic ไม่มี DOM
│   ├── weather.ts  # fetch + parse Open-Meteo
│   ├── geo.ts      # geolocation + reverse geocode
│   └── types.ts    # TypeScript interfaces
├── ui/             # DOM manipulation
│   ├── render.ts   # render functions
│   └── icons.ts    # weather icons map
├── utils/
│   ├── cache.ts    # localStorage cache
│   └── format.ts   # format temp, wind, time
└── main.ts         # entry point
```

### 0.2 Type Definitions
- [ ] สร้าง `WeatherCurrent` interface
- [ ] สร้าง `WeatherDaily` interface
- [ ] สร้าง `WeatherHourly` interface
- [ ] สร้าง `GeoLocation` interface
- [ ] Map WMO weather code → description + icon name

---

## Phase 1 — Core Weather Engine `[ ]`
> *ทำให้ข้อมูลอากาศไหลเข้ามาได้ก่อน ยังไม่ต้องสวย*

### 1.1 Geolocation
- [ ] `geo.ts` — ขอ GPS จาก `navigator.geolocation`
- [ ] Fallback: ให้ user พิมพ์ชื่อเมืองถ้าปฏิเสธ GPS
- [ ] Reverse geocode ด้วย Nominatim API → ได้ชื่อเมือง
- [ ] Cache พิกัดล่าสุดใน localStorage

```ts
// ตัวอย่าง interface
interface GeoResult {
  lat: number
  lon: number
  city: string
  country: string
}
```

### 1.2 Open-Meteo Fetch
- [ ] `weather.ts` — fetch current weather
- [ ] fetch hourly (24 ชั่วโมง)
- [ ] fetch daily forecast (7 วัน)
- [ ] Parse response → typed object
- [ ] Error handling (network fail, timeout)

```ts
// variables ที่ต้อง fetch
current: [
  'temperature_2m', 'apparent_temperature',
  'relative_humidity_2m', 'weathercode',
  'wind_speed_10m', 'wind_direction_10m',
  'surface_pressure', 'uv_index',
  'is_day'
]
daily: [
  'weathercode', 'temperature_2m_max', 'temperature_2m_min',
  'precipitation_sum', 'precipitation_probability_max',
  'sunrise', 'sunset', 'uv_index_max'
]
hourly: [
  'temperature_2m', 'precipitation_probability',
  'weathercode', 'wind_speed_10m'
]
```

### 1.3 Cache Layer
- [ ] `cache.ts` — เก็บข้อมูลใน localStorage
- [ ] TTL 10 นาที (ไม่ fetch ซ้ำถ้ายังไม่หมด)
- [ ] Cache key = `weather_${lat}_${lon}`
- [ ] invalidate เมื่อเปลี่ยนเมือง

---

## Phase 2 — UI Foundation `[ ]`
> *ทำให้ข้อมูลแสดงผลได้ ยังไม่ต้องสวยมาก แต่ต้องอ่านได้*

### 2.1 Layout Structure
- [ ] HTML skeleton — header, main, footer
- [ ] Responsive grid (mobile-first)
- [ ] Dark theme base (`#030308` — Cosmic)
- [ ] Font: `Inter` (body) + `JetBrains Mono` (numbers/code)

### 2.2 Current Weather Card
- [ ] แสดงชื่อเมือง + ประเทศ
- [ ] อุณหภูมิ (ใหญ่) + Feels Like (เล็ก)
- [ ] Weather condition text
- [ ] ความชื้น, ลม, ความกดอากาศ, UV Index
- [ ] Sunrise / Sunset time

### 2.3 Weather Icon System
- [ ] Map WMO code → emoji หรือ SVG icon
- [ ] แยก day / night (ใช้ `is_day` field)

```ts
const WEATHER_ICONS: Record<number, { day: string; night: string; label: string }> = {
  0:  { day: '☀️', night: '🌙', label: 'Clear sky' },
  1:  { day: '🌤️', night: '🌤️', label: 'Mainly clear' },
  2:  { day: '⛅', night: '⛅', label: 'Partly cloudy' },
  3:  { day: '☁️', night: '☁️', label: 'Overcast' },
  45: { day: '🌫️', night: '🌫️', label: 'Fog' },
  61: { day: '🌧️', night: '🌧️', label: 'Rain' },
  95: { day: '⛈️', night: '⛈️', label: 'Thunderstorm' },
  // ... ครบ WMO table
}
```

### 2.4 7-Day Forecast Row
- [ ] แถว 7 วัน แสดง: วัน, icon, max/min temp
- [ ] Highlight วันนี้
- [ ] แสดง precipitation probability

### 2.5 24-Hour Hourly Strip
- [ ] scroll แนวนอน
- [ ] แต่ละ slot: เวลา, icon, อุณหภูมิ
- [ ] bar เล็ก ๆ แสดง rain probability

---

## Phase 3 — Polish & Feel `[ ]`
> *ทำให้มันรู้สึก "Tempestus Fulgor" จริง ๆ — มีพลัง ดูดิบ*

### 3.1 Dynamic Background
- [ ] background เปลี่ยนตาม weather condition
  - Clear day → gradient ส้ม/ทอง
  - Clear night → gradient กรมท่า/ดำ + ดาว
  - Rain → gradient เทาเข้ม + rain animation
  - Thunderstorm → ดำ + flash lightning effect
  - Fog → gradient เทาหม่น

### 3.2 Micro Animations
- [ ] Rain particle animation (CSS only)
- [ ] Lightning flash ตอน thunderstorm (random interval)
- [ ] Temperature number count-up เมื่อโหลดครั้งแรก
- [ ] Card fade-in staggered

### 3.3 Search City
- [ ] input + debounce search
- [ ] Nominatim autocomplete suggestion
- [ ] เลือกเมืองแล้ว fetch ใหม่ทันที

### 3.4 Unit Toggle
- [ ] °C / °F toggle
- [ ] km/h / mph / m/s (wind)
- [ ] บันทึก preference ใน localStorage

### 3.5 Air Quality (AQI)
- [ ] ต่อ Open-Meteo Air Quality API
- [ ] แสดง PM2.5, PM10, US AQI
- [ ] color-coded badge (Good / Moderate / Unhealthy)

---

## Phase 4 — PWA & Performance `[ ]`
> *ทำให้ใช้งานได้แม้ไม่มีเน็ต และโหลดเร็วมาก*

### 4.1 PWA Setup
- [ ] `vite-plugin-pwa` config
- [ ] Web App Manifest (`manifest.json`)
  - name, short_name, icons, theme_color
- [ ] Service Worker — cache strategy
  - Network-first สำหรับ API
  - Cache-first สำหรับ assets
- [ ] Offline page — แสดงข้อมูลที่ cache ไว้ล่าสุด
- [ ] Install prompt (Add to Home Screen)

### 4.2 Performance
- [ ] Lighthouse score ≥ 90 ทุก category
- [ ] Lazy load charts
- [ ] Image optimization (icon SVG inline)
- [ ] Bundle size < 100KB gzip

### 4.3 Deploy
- [ ] GitHub Actions CI/CD
- [ ] Deploy to GitHub Pages อัตโนมัติ
- [ ] Custom domain (ถ้ามี)

---

## Phase 5 — Supabase Integration `[ ]`
> *เพิ่ม personalization และ social features*

### 5.1 Auth
- [ ] Supabase Auth — login ด้วย Google / GitHub
- [ ] Passkey login (ต่อยอดจาก Passkey project)

### 5.2 Saved Locations
- [ ] บันทึกเมืองโปรด (ต้อง login)
- [ ] sync ทุก device
- [ ] quick-switch ระหว่างเมือง

### 5.3 Weather History
- [ ] เก็บ log ข้อมูลอากาศ ณ ตำแหน่งของ user ทุกวัน
- [ ] แสดง historical chart ย้อนหลัง 30 วัน
- [ ] "วันนี้เทียบกับปีที่แล้ว"

### 5.4 Weather Alerts
- [ ] user ตั้ง alert condition ("แจ้งเมื่ออุณหภูมิ < 20°C")
- [ ] Supabase Edge Function + pg_cron เช็คทุกชั่วโมง
- [ ] Push notification (Web Push API)

---

## Phase 6 — Advanced Features `[ ]`
> *ถ้าอยากไปต่อ*

### 6.1 Weather Map
- [ ] ต่อ Leaflet.js + OpenStreetMap
- [ ] Overlay layer: ฝน, ลม, อุณหภูมิ
- [ ] คลิกบนแผนที่ → ดูอากาศจุดนั้น

### 6.2 Compare Cities
- [ ] เปรียบอากาศ 2 เมืองพร้อมกัน
- [ ] Recharts side-by-side comparison

### 6.3 Astronomy
- [ ] Moon phase
- [ ] Golden hour / Blue hour
- [ ] ดาวเคราะห์มองเห็นได้คืนนี้

### 6.4 Mobile App (Capacitor)
- [ ] Wrap เป็น Android / iOS
- [ ] Widget หน้าจอหลัก (Native widget)
- [ ] Background location update

---

## 📅 Timeline (ประมาณการ)

| Phase | เนื้อหา | เวลาประมาณ |
|-------|--------|-----------|
| 0 | Foundation | 1 วัน |
| 1 | Core Engine | 2–3 วัน |
| 2 | UI Foundation | 3–5 วัน |
| 3 | Polish | 3–5 วัน |
| 4 | PWA | 2–3 วัน |
| 5 | Supabase | 1–2 สัปดาห์ |
| 6 | Advanced | ตามต้องการ |

**MVP (Phase 0–3) = ~2 สัปดาห์**  
**Portfolio-ready (Phase 0–4) = ~3 สัปดาห์**

---

## ✅ Definition of Done แต่ละ Phase

- **Phase 1 done** = `console.log` ข้อมูลอากาศออกมาได้ครบ
- **Phase 2 done** = render ข้อมูลใน browser ได้อ่านได้
- **Phase 3 done** = เพื่อนเห็นแล้วบอกว่าสวย
- **Phase 4 done** = Lighthouse ≥ 90, ติดตั้งเป็น PWA ได้
- **Phase 5 done** = login แล้ว save เมืองได้
- **Phase 6 done** = มีแผนที่และ mobile app

---

*Last updated: 2026-06-09*
