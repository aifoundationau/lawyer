import { GeoLocationSettings, DateFormatOption, TimeFormatOption } from '../types';

const STORAGE_KEY_GEO = 'lawyerselect_geo_settings_v1';

export const STATE_CAPITAL_COORDINATES: Record<string, { lat: number; lon: number; capital: string }> = {
  NSW: { lat: -33.8688, lon: 151.2093, capital: 'Sydney' },
  VIC: { lat: -37.8136, lon: 144.9631, capital: 'Melbourne' },
  QLD: { lat: -27.4698, lon: 153.0251, capital: 'Brisbane' },
  WA: { lat: -31.9505, lon: 115.8605, capital: 'Perth' },
  SA: { lat: -34.9285, lon: 138.6007, capital: 'Adelaide' },
  TAS: { lat: -42.8821, lon: 147.3272, capital: 'Hobart' },
  ACT: { lat: -35.2809, lon: 149.1300, capital: 'Canberra' },
  NT: { lat: -12.4634, lon: 130.8456, capital: 'Darwin' },
  NZ: { lat: -36.8485, lon: 174.7633, capital: 'Auckland' },
  OTHER: { lat: -33.8688, lon: 151.2093, capital: 'Sydney' },
};

export function weatherCodeToLabel(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if (code === 1) return { label: 'Mainly Clear', icon: '🌤️' };
  if (code === 2) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { label: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { label: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snow Showers', icon: '🌨️' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Clear', icon: '☀️' };
}

export const DEFAULT_GEO_SETTINGS: GeoLocationSettings = {
  suburb: 'Sydney CBD',
  state: 'NSW',
  country: 'Australia',
  postcode: '2000',
  latitude: -33.8688,
  longitude: 151.2093,
  timezone: 'Australia/Sydney',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  isAutoDetected: false,
  weatherTempC: 22,
  weatherCondition: 'Clear Sky',
  weatherCode: 0,
  audToUsdRate: 0.655, // 3 decimals max
  rateLastUpdated: new Date().toISOString(),
};

class GeoService {
  private settings: GeoLocationSettings = { ...DEFAULT_GEO_SETTINGS };
  private listeners: Array<(s: GeoLocationSettings) => void> = [];

  constructor() {
    this.loadFromStorage();
    this.fetchLiveExchangeRate();
    this.fetchLiveWeather();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GEO);
      if (stored) {
        this.settings = { ...DEFAULT_GEO_SETTINGS, ...JSON.parse(stored) };
      } else {
        // Auto-detect timezone initially
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';
        this.settings.timezone = detectedTz;
      }
    } catch {
      this.settings = { ...DEFAULT_GEO_SETTINGS };
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_GEO, JSON.stringify(this.settings));
      this.notify();
    } catch (e) {
      console.warn('Failed to persist geo settings:', e);
    }
  }

  public getSettings(): GeoLocationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<GeoLocationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
  }

  public subscribe(fn: (s: GeoLocationSettings) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.settings }));
  }

  /**
   * Fetches free daily AUD to USD exchange rate (no key required).
   * Free Open Exchange Rates endpoint or Frankfurter fallback.
   */
  public async fetchLiveExchangeRate(): Promise<number> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/AUD');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && typeof data.rates.USD === 'number') {
          // Strictly format to max 3 decimal places per business rule
          const rawRate = data.rates.USD;
          const rate3Dec = Math.round(rawRate * 1000) / 1000;
          this.updateSettings({
            audToUsdRate: rate3Dec,
            rateLastUpdated: new Date().toISOString(),
          });
          return rate3Dec;
        }
      }
    } catch (err) {
      console.warn('Primary exchange rate API failed, trying fallback...', err);
    }

    try {
      const fb = await fetch('https://api.frankfurter.app/latest?from=AUD&to=USD');
      if (fb.ok) {
        const data = await fb.json();
        if (data && data.rates && typeof data.rates.USD === 'number') {
          const rate3Dec = Math.round(data.rates.USD * 1000) / 1000;
          this.updateSettings({
            audToUsdRate: rate3Dec,
            rateLastUpdated: new Date().toISOString(),
          });
          return rate3Dec;
        }
      }
    } catch {
      // Offline fallback: retains existing or default rate (0.655)
    }

    return this.settings.audToUsdRate;
  }

  /**
   * Fetches current weather from Open-Meteo free API (no key required).
   */
  public async fetchLiveWeather(): Promise<void> {
    try {
      const { latitude, longitude } = this.settings;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          const { label } = weatherCodeToLabel(code);
          this.updateSettings({
            weatherTempC: temp,
            weatherCondition: label,
            weatherCode: code,
          });
        }
      }
    } catch (e) {
      console.warn('Weather fetch note:', e);
    }
  }

  /**
   * Auto-detect location via browser geolocation with reverse geocoding
   */
  public async autoDetectBrowserLocation(): Promise<boolean> {
    if (!navigator.geolocation) {
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';

          let suburb = 'Current Suburb';
          let state = 'NSW';
          let postcode = '2000';

          // Try reverse geocoding with free BigDataCloud client API or Open-Meteo
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              suburb = geoData.locality || geoData.city || geoData.principalSubdivision || 'Local Suburb';
              state = (geoData.principalSubdivisionCode || '').replace('AU-', '') || 'NSW';
              postcode = geoData.postcode || '2000';
            }
          } catch {
            // Coordinate fallback
          }

          this.updateSettings({
            latitude: lat,
            longitude: lon,
            suburb,
            state,
            postcode,
            timezone,
            isAutoDetected: true,
          });

          await this.fetchLiveWeather();
          resolve(true);
        },
        () => {
          resolve(false);
        },
        { timeout: 7000 }
      );
    });
  }

  /**
   * Set location by Australian state or predefined capital
   */
  public setLocationByState(stateCode: string, suburbName?: string) {
    const coords = STATE_CAPITAL_COORDINATES[stateCode] || STATE_CAPITAL_COORDINATES.NSW;
    this.updateSettings({
      state: stateCode,
      suburb: suburbName || coords.capital,
      latitude: coords.lat,
      longitude: coords.lon,
      isAutoDetected: false,
    });
    this.fetchLiveWeather();
  }

  /**
   * Convert AUD to USD at current rate (max 3 decimals for rate, 2 or 3 decimals for converted amount)
   */
  public convertAudToUsd(audAmount: number): { usdAmount: number; rate: number } {
    const rate = this.settings.audToUsdRate || 0.655;
    const usd = Math.round(audAmount * rate * 1000) / 1000;
    return {
      usdAmount: usd,
      rate,
    };
  }

  /**
   * Format current time according to user preferences
   */
  public formatTime(date: Date = new Date()): string {
    const { timeFormat, timezone } = this.settings;
    try {
      return new Intl.DateTimeFormat('en-AU', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat === '12h',
      }).format(date);
    } catch {
      return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h' });
    }
  }

  /**
   * Format current date according to user preferences
   */
  public formatDate(date: Date = new Date()): string {
    const { dateFormat, timezone } = this.settings;
    try {
      const formatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: timezone,
        day: '2-digit',
        month: dateFormat === 'DD MMM YYYY' ? 'short' : '2-digit',
        year: 'numeric',
      });
      const parts = formatter.formatToParts(date);
      const day = parts.find((p) => p.type === 'day')?.value || '01';
      const month = parts.find((p) => p.type === 'month')?.value || '01';
      const year = parts.find((p) => p.type === 'year')?.value || '2026';

      switch (dateFormat) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'DD MMM YYYY':
          return `${day} ${month} ${year}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
        default:
          return `${day}/${month}/${year}`;
      }
    } catch {
      return date.toLocaleDateString('en-AU');
    }
  }
}

export const geoService = new GeoService();

