# 🌤 ระบบพยากรณ์อากาศ — Weather Forecast System

> เอกสารนี้อธิบาย architecture, stack, และสิ่งที่ต้องใช้ในการสร้างระบบพยากรณ์อากาศตั้งแต่ต้น

---

## 📌 ระดับของระบบ (เลือกได้ 3 ระดับ)

| ระดับ | คำอธิบาย | เวลาทำ |
|-------|---------|--------|
| **Level 1** — Consumer App | แสดงข้อมูลจาก API สำเร็จรูป (OpenWeather, Tomorrow.io) | 1–3 วัน |
| **Level 2** — Data Pipeline | ดึงข้อมูลดิบ → process → visualize เอง | 1–2 สัปดาห์ |
| **Level 3** — ML Forecast | train model จากข้อมูลย้อนหลัง → ทำนายเอง | 1–3 เดือน |

---

## 🏗 Level 1 — Consumer App (เหมาะกับ Portfolio)

### สิ่งที่ต้องมี

#### API ข้อมูลอากาศ (เลือก 1)

| API | Free Tier | ข้อมูลที่ได้ |
|-----|-----------|------------|
| [OpenWeatherMap](https://openweathermap.org/api) | 1,000 calls/วัน | current, forecast 5 วัน, air quality |
| [Tomorrow.io](https://tomorrow.io) | 500 calls/วัน | ละเอียดมาก, realtime |
| [Open-Meteo](https://open-meteo.com) | ฟรีไม่จำกัด (OSS) | forecast 16 วัน, historical |
| [WeatherAPI](https://weatherapi.com) | 1M calls/เดือน | ง่าย, ราคาถูก |

> **แนะนำ: Open-Meteo** — ฟรีไม่จำกัด ไม่ต้องมี API key ข้อมูลละเอียด

#### Stack แนะนำ

```
Frontend        : Vanilla JS / React
Styling         : Tailwind CSS
Charts          : Recharts / Chart.js / D3.js
Geolocation     : browser navigator.geolocation API
Reverse Geocode : OpenStreetMap Nominatim (ฟรี)
Deploy          : GitHub Pages / Cloudflare Pages
```

#### ฟีเจอร์หลัก

- [ ] ดูอากาศปัจจุบัน (อุณหภูมิ, ความชื้น, ลม, UV index)
- [ ] Forecast 7 วัน
- [ ] Hourly forecast 24 ชั่วโมง
- [ ] ค้นหาเมือง
- [ ] ใช้ GPS อัตโนมัติ
- [ ] แสดงผลหน้าจอสวยตาม condition (ฝน/แดด/หมอก)
- [ ] PWA — เปิดออฟไลน์ได้ (cache ข้อมูลล่าสุด)

---

## 🔧 Level 2 — Data Pipeline

### สิ่งที่ต้องมี

#### แหล่งข้อมูลดิบ

| แหล่ง | ประเภท | รายละเอียด |
|-------|--------|-----------|
| [NOAA](https://www.ncdc.noaa.gov/data-access) | Historical | ข้อมูลสถานีตรวจอากาศทั่วโลก |
| [ERA5 (ECMWF)](https://cds.climate.copernicus.eu) | Reanalysis | ข้อมูลย้อนหลัง 80 ปี ละเอียดมาก |
| [Thai Meteorological Dept](https://www.tmd.go.th) | Thailand specific | ข้อมูลประเทศไทยโดยตรง |
| Open-Meteo Historical API | Historical | ใช้งานง่ายที่สุด |

#### Stack

```
Ingestion       : Python (requests / httpx)
Storage         : Supabase PostgreSQL + TimescaleDB extension
Processing      : Python pandas / polars
Visualization   : React + Recharts / D3.js
Scheduling      : Supabase Edge Functions + pg_cron
```

#### Architecture

```
[Weather API]
     ↓ cron ทุก 1 ชั่วโมง
[Supabase Edge Function] ← fetch + transform
     ↓
[PostgreSQL / TimescaleDB] ← store time-series
     ↓
[REST API / Realtime]
     ↓
[React Frontend] ← visualize
```

---

## 🤖 Level 3 — ML Forecast (ทำนายเอง)

### สิ่งที่ต้องมี

#### ความรู้ที่ต้องการ

- Time Series Analysis (ARIMA, SARIMA)
- Deep Learning (LSTM, Transformer)
- Python ML stack (pandas, scikit-learn, PyTorch / TensorFlow)
- Feature Engineering สำหรับ weather data

#### Model ที่นิยมใช้

| Model | ใช้ทำอะไร | ความยาก |
|-------|---------|---------|
| **ARIMA / SARIMA** | forecast อุณหภูมิ short-term | ปานกลาง |
| **LSTM** | pattern ระยะยาว เช่น seasonal trend | ยาก |
| **XGBoost** | classification (ฝน/ไม่ฝน) | ปานกลาง |
| **Transformer (Informer/PatchTST)** | state-of-art time series | ยากมาก |

#### Stack

```
Data            : ERA5 / Open-Meteo Historical
Processing      : Python + pandas + polars
Training        : PyTorch / scikit-learn
Experiment      : MLflow / Weights & Biases
Serving         : FastAPI + Docker
Frontend        : React + Recharts
Infra           : Supabase + Cloudflare Workers
```

#### Pipeline

```
[Raw Data] → [Clean] → [Feature Engineering]
                              ↓
                        [Train Model]
                              ↓
                    [Evaluate: MAE, RMSE]
                              ↓
                      [Deploy as API]
                              ↓
                    [Frontend Visualization]
```

---

## 📐 Data ที่ต้องเข้าใจ

### Weather Variables หลัก

| Variable | หน่วย | คำอธิบาย |
|---------|------|---------|
| `temperature_2m` | °C | อุณหภูมิที่ความสูง 2 เมตร |
| `relative_humidity_2m` | % | ความชื้นสัมพัทธ์ |
| `precipitation` | mm | ปริมาณน้ำฝน |
| `wind_speed_10m` | km/h | ความเร็วลม |
| `wind_direction_10m` | ° | ทิศทางลม |
| `surface_pressure` | hPa | ความกดอากาศ |
| `cloud_cover` | % | เปอร์เซ็นต์เมฆปกคลุม |
| `uv_index` | 0–11+ | ดัชนี UV |
| `weathercode` | WMO code | รหัสสภาพอากาศ (ฝน/แดด/หิมะ) |

### WMO Weather Code (สำคัญมาก)

```
0       = Clear sky
1,2,3   = Mainly clear, partly cloudy, overcast
45,48   = Fog
51,53,55 = Drizzle (light/moderate/dense)
61,63,65 = Rain (slight/moderate/heavy)
71,73,75 = Snow
80,81,82 = Rain showers
95      = Thunderstorm
```

---

## 🗺 Geolocation Flow

```
User opens app
      ↓
navigator.geolocation.getCurrentPosition()
      ↓
{ lat, lon }
      ↓
Nominatim reverse geocode → ชื่อเมือง
      ↓
Weather API fetch(lat, lon)
      ↓
Display
```

### ตัวอย่าง Open-Meteo API call

```js
const url = `https://api.open-meteo.com/v1/forecast?
  latitude=13.75&longitude=100.52
  &current=temperature_2m,relative_humidity_2m,weathercode,wind_speed_10m
  &hourly=temperature_2m,precipitation_probability
  &daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum
  &timezone=Asia/Bangkok
  &forecast_days=7`

const res = await fetch(url)
const data = await res.json()
```

**ไม่ต้อง API key เลย** — ยิง URL ตรงได้เลย

---

## 💡 สิ่งที่ทำให้ Weather App โดดเด่น

1. **Dynamic background** — เปลี่ยน gradient/animation ตาม condition (ฝน/แดด/กลางคืน)
2. **Feels Like vs Actual** — แสดงความแตกต่าง
3. **Air Quality Index** — PM2.5 (สำคัญมากสำหรับไทย)
4. **Rain probability chart** — hourly bar chart
5. **Sunrise/Sunset** — แสดง golden hour
6. **Offline mode** — cache ข้อมูลล่าสุดไว้ใน PWA

---

## 🚀 ถ้าจะเริ่มทำวันนี้

```bash
# เริ่มจาก Level 1 ก่อน
mkdir weather-app && cd weather-app
npm create vite@latest . -- --template react-ts
npm install recharts lucide-react
```

**ทำแค่นี้ก่อน (Day 1):**
1. ขอ GPS จาก browser
2. ยิง Open-Meteo API
3. แสดงอุณหภูมิ + icon ตาม weathercode

แค่นี้ก็เป็น working app แล้ว — ค่อย polish ทีหลัง

---

## 📚 References

- [Open-Meteo Docs](https://open-meteo.com/en/docs)
- [WMO Weather Code Table](https://open-meteo.com/en/docs#weathervariables)
- [Nominatim Reverse Geocoding](https://nominatim.org/release-docs/develop/api/Reverse/)
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [ERA5 Dataset](https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-single-levels)
