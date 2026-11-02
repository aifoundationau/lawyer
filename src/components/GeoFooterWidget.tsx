import React, { useState, useEffect } from 'react';
import { geoService, STATE_CAPITAL_COORDINATES, weatherCodeToLabel } from '../services/geoService';
import { GeoLocationSettings, DateFormatOption, TimeFormatOption } from '../types';
import { MapPin, Clock, Compass, Globe, Settings, Navigation, RefreshCw, X, Check, DollarSign, User } from './icons';
import { AboutDavidModal } from './AboutDavidModal';

export const GeoFooterWidget: React.FC = () => {
  const [settings, setSettings] = useState<GeoLocationSettings>(geoService.getSettings());
  const [isOpen, setIsOpen] = useState(false);
  const [isAboutDavidOpen, setIsAboutDavidOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(geoService.formatTime());
  const [currentDate, setCurrentDate] = useState<string>(geoService.formatDate());
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);

  // Currency converter state
  const [calcAudAmount, setCalcAudAmount] = useState<string>('100');
  const [calcUsdResult, setCalcUsdResult] = useState<number>(0);

  // Form edit draft state inside modal
  const [draftSuburb, setDraftSuburb] = useState<string>(settings.suburb);
  const [draftState, setDraftState] = useState<string>(settings.state);
  const [draftTimezone, setDraftTimezone] = useState<string>(settings.timezone);
  const [draftDateFormat, setDraftDateFormat] = useState<DateFormatOption>(settings.dateFormat);
  const [draftTimeFormat, setDraftTimeFormat] = useState<TimeFormatOption>(settings.timeFormat);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Subscribe to geoService updates
  useEffect(() => {
    const unsubscribe = geoService.subscribe((newSettings) => {
      setSettings(newSettings);
      setDraftSuburb(newSettings.suburb);
      setDraftState(newSettings.state);
      setDraftTimezone(newSettings.timezone);
      setDraftDateFormat(newSettings.dateFormat);
      setDraftTimeFormat(newSettings.timeFormat);
    });
    return () => unsubscribe();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(geoService.formatTime());
      setCurrentDate(geoService.formatDate());
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.timezone, settings.timeFormat, settings.dateFormat]);

  // Recalculate USD when AUD input or rate updates
  useEffect(() => {
    const num = parseFloat(calcAudAmount);
    if (!isNaN(num) && num >= 0) {
      const conv = geoService.convertAudToUsd(num);
      setCalcUsdResult(conv.usdAmount);
    } else {
      setCalcUsdResult(0);
    }
  }, [calcAudAmount, settings.audToUsdRate]);

  // Handle auto-detect location
  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectStatus('Detecting location...');
    try {
      const success = await geoService.autoDetectBrowserLocation();
      if (success) {
        const latest = geoService.getSettings();
        setDraftSuburb(latest.suburb);
        setDraftState(latest.state);
        setDraftTimezone(latest.timezone);
        setDetectStatus('✓ Location detected');
      } else {
        setDetectStatus('Browser location denied or unavailable. Using manual entry.');
      }
    } catch {
      setDetectStatus('Detection unavailable.');
    } finally {
      setIsDetecting(false);
      setTimeout(() => setDetectStatus(null), 3500);
    }
  };

  // Handle state selector change
  const handleStateChange = (newState: string) => {
    setDraftState(newState);
    const coords = STATE_CAPITAL_COORDINATES[newState];
    if (coords && (!draftSuburb || draftSuburb === settings.suburb)) {
      setDraftSuburb(coords.capital);
    }
  };

  // Save changes
  const handleSave = () => {
    geoService.updateSettings({
      suburb: draftSuburb.trim() || 'Sydney CBD',
      state: draftState,
      timezone: draftTimezone,
      dateFormat: draftDateFormat,
      timeFormat: draftTimeFormat,
    });
    geoService.setLocationByState(draftState, draftSuburb.trim() || undefined);
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
      setIsOpen(false);
    }, 700);
  };

  const weather = weatherCodeToLabel(settings.weatherCode ?? 0);

  return (
    <>
      {/* Thin Bottom Footer Bar */}
      <aside
        data-agent-id="geo-footer-widget-bar"
        data-testid="geo-footer-bar"
        aria-label="Localization and Regional Information Bar"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '34px',
          backgroundColor: 'rgba(8, 11, 18, 0.94)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(212, 175, 55, 0.28)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.4)',
          zIndex: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted, #94a3b8)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.98)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(8, 11, 18, 0.94)')}
      >
        {/* Left Section: Suburb & Weather */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f1f5f9', fontWeight: 600 }}>
            <MapPin size={14} style={{ color: 'var(--gold-primary, #d4af37)', flexShrink: 0 }} />
            <span data-testid="geo-bar-location">
              {settings.suburb}, {settings.state}
            </span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }} data-testid="geo-bar-weather">
            <span>{weather.icon}</span>
            <span>
              {settings.weatherTempC ?? 22}°C {settings.weatherCondition || 'Clear'}
            </span>
          </div>
        </div>

        {/* Center / Right Section: Time & Exchange Rate & Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f8fafc' }} data-testid="geo-bar-time">
            <Clock size={13} style={{ color: '#38bdf8' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{currentTime}</span>
            <span style={{ color: 'var(--text-dim, #64748b)', fontSize: '0.72rem' }}>({currentDate})</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24' }} data-testid="geo-bar-rate">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>Rate:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>1 AUD = ${settings.audToUsdRate.toFixed(3)} USD</span>
          </div>

          <button
            type="button"
            data-agent-id="geo-open-settings-button"
            data-testid="geo-open-settings-btn"
            aria-label="Open Regional and Localization Settings"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '999px',
              padding: '2px 8px',
              color: 'var(--gold-light, #fde047)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Settings size={12} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            data-agent-id="geo-open-about-david-button"
            data-testid="geo-open-about-david-btn"
            aria-label="About David Robertson"
            onClick={(e) => {
              e.stopPropagation();
              setIsAboutDavidOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '999px',
              padding: '2px 9px',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <User size={12} />
            <span>About David</span>
          </button>
        </div>
      </aside>

      {/* Centered Modal Popup (Responsive, NO scrollbar) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="geo-modal-title"
          data-agent-id="geo-settings-modal-backdrop"
          data-testid="geo-settings-modal"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.82)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Modal Container: strictly overflow hidden, no scrollbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(94vw, 680px)',
              maxHeight: '92vh',
              overflow: 'hidden', // Strictly NO scrollbar per user directive
              backgroundColor: '#0a0e17',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(212, 175, 55, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              color: '#f8fafc',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-primary, #d4af37)',
                  }}
                >
                  <Compass size={18} />
                </div>
                <div>
                  <h2
                    id="geo-modal-title"
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      margin: 0,
                      color: '#ffffff',
                      fontFamily: 'var(--font-heading, "Cinzel", serif)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Regional & Localization Settings
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Personalize your location, date/time format, and live AUD currency conversion
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-agent-id="geo-modal-close-button"
                data-testid="geo-modal-close-btn"
                aria-label="Close Settings Popup"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim, #64748b)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim, #64748b)')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - 2 Columns compact layout to avoid any scrollbar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                padding: '1rem 1.25rem',
                overflow: 'hidden',
              }}
            >
              {/* Left Column: Location & Live Environment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label
                      htmlFor="geo-input-suburb"
                      style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-light, #fde047)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      Location & Suburb
                    </label>
                    <button
                      type="button"
                      data-agent-id="geo-btn-autodetect"
                      data-testid="geo-btn-autodetect"
                      onClick={handleAutoDetect}
                      disabled={isDetecting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'transparent',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        color: '#38bdf8',
                        cursor: isDetecting ? 'wait' : 'pointer',
                      }}
                    >
                      <Navigation size={11} className={isDetecting ? 'spin-animation' : ''} />
                      <span>{isDetecting ? 'Detecting...' : 'Auto-Detect'}</span>
                    </button>
                  </div>

                  {detectStatus && (
                    <div style={{ fontSize: '0.7rem', color: detectStatus.startsWith('✓') ? '#34d399' : '#f87171', marginBottom: '0.4rem' }}>
                      {detectStatus}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '0.5rem' }}>
                    <div>
                      <input
                        id="geo-input-suburb"
                        type="text"
                        data-agent-id="geo-input-suburb"
                        data-testid="geo-input-suburb"
                        placeholder="Suburb (e.g. Parramatta)"
                        value={draftSuburb}
                        onChange={(e) => setDraftSuburb(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#070a10',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.8rem',
                          color: '#fff',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <select
                        aria-label="Select Australian State or Territory"
                        data-agent-id="geo-select-state"
                        data-testid="geo-select-state"
                        value={draftState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#070a10',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.4rem',
                          fontSize: '0.8rem',
                          color: '#fff',
                          outline: 'none',
                        }}
                      >
                        {Object.keys(STATE_CAPITAL_COORDINATES).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weather Snapshot Preview */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '0.55rem',
                      padding: '0.35rem 0.6rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Live Weather ({settings.suburb}):</span>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {weather.icon} {settings.weatherTempC ?? 22}°C • {settings.weatherCondition || 'Clear'}
                    </span>
                  </div>
                </div>

                {/* Date & Time Configuration */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--gold-light, #fde047)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Date & Time Format
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim, #64748b)', marginBottom: '0.2rem' }}>
                        Date Style
                      </span>
                      <select
                        aria-label="Select Date Format"
                        data-agent-id="geo-select-date-format"
                        data-testid="geo-select-date-format"
                        value={draftDateFormat}
                        onChange={(e) => setDraftDateFormat(e.target.value as DateFormatOption)}
                        style={{
                          width: '100%',
                          backgroundColor: '#070a10',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.4rem',
                          fontSize: '0.75rem',
                          color: '#fff',
                        }}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (AU/UK)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        <option value="DD MMM YYYY">DD MMM YYYY (Formal)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim, #64748b)', marginBottom: '0.2rem' }}>
                        Clock Format
                      </span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          data-testid="geo-btn-time-12h"
                          onClick={() => setDraftTimeFormat('12h')}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0',
                            borderRadius: '6px',
                            border: draftTimeFormat === '12h' ? '1px solid var(--gold-primary, #d4af37)' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: draftTimeFormat === '12h' ? 'rgba(212, 175, 55, 0.2)' : '#070a10',
                            color: draftTimeFormat === '12h' ? '#fff' : 'var(--text-muted, #94a3b8)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          12-Hour
                        </button>
                        <button
                          type="button"
                          data-testid="geo-btn-time-24h"
                          onClick={() => setDraftTimeFormat('24h')}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0',
                            borderRadius: '6px',
                            border: draftTimeFormat === '24h' ? '1px solid var(--gold-primary, #d4af37)' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: draftTimeFormat === '24h' ? 'rgba(212, 175, 55, 0.2)' : '#070a10',
                            color: draftTimeFormat === '24h' ? '#fff' : 'var(--text-muted, #94a3b8)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          24-Hour
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timezone Selector */}
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim, #64748b)', marginBottom: '0.2rem' }}>
                      Timezone
                    </span>
                    <select
                      aria-label="Select Timezone"
                      data-agent-id="geo-select-timezone"
                      data-testid="geo-select-timezone"
                      value={draftTimezone}
                      onChange={(e) => setDraftTimezone(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#070a10',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.4rem',
                        fontSize: '0.75rem',
                        color: '#fff',
                      }}
                    >
                      <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                      <option value="Australia/Melbourne">Australia/Melbourne (AEST/AEDT)</option>
                      <option value="Australia/Brisbane">Australia/Brisbane (AEST - No DST)</option>
                      <option value="Australia/Perth">Australia/Perth (AWST)</option>
                      <option value="Australia/Adelaide">Australia/Adelaide (ACST/ACDT)</option>
                      <option value="Australia/Hobart">Australia/Hobart (AEST/AEDT)</option>
                      <option value="Australia/Darwin">Australia/Darwin (ACST)</option>
                      <option value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: AUD to USD Currency Converter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label
                        htmlFor="geo-input-aud"
                        style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-light, #fde047)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        AUD → USD Converter
                      </label>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                        }}
                      >
                        Live Free API
                      </span>
                    </div>

                    <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                      Daily exchange rate: <strong style={{ color: '#fff' }}>1 AUD = ${settings.audToUsdRate.toFixed(3)} USD</strong> (max 3 decimals).
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim, #64748b)', marginBottom: '0.2rem' }}>
                          AUD Amount ($)
                        </span>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--gold-primary, #d4af37)' }}>
                            $
                          </span>
                          <input
                            id="geo-input-aud"
                            type="number"
                            min="0"
                            step="1"
                            data-agent-id="geo-input-aud"
                            data-testid="geo-input-aud"
                            value={calcAudAmount}
                            onChange={(e) => setCalcAudAmount(e.target.value)}
                            style={{
                              width: '100%',
                              backgroundColor: '#070a10',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '0.4rem 0.5rem 0.4rem 1.4rem',
                              fontSize: '0.85rem',
                              color: '#fff',
                              outline: 'none',
                              fontFamily: 'monospace',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim, #64748b)', marginBottom: '0.2rem' }}>
                          USD Equivalent ($)
                        </span>
                        <div
                          data-testid="geo-output-usd"
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: '6px',
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#38bdf8',
                            fontFamily: 'monospace',
                          }}
                        >
                          ${calcUsdResult.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Token Equivalent Pill */}
                    <div
                      style={{
                        backgroundColor: 'rgba(212, 175, 55, 0.08)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted, #94a3b8)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Platform Token Parity:</span>
                        <strong style={{ color: 'var(--gold-light, #fde047)' }}>
                          {Math.ceil(parseFloat(calcAudAmount) || 0)} Tokens
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-dim, #64748b)', display: 'block', marginTop: '2px' }}>
                        1 Token = AUD $1.00 (Strict integer rounding, zero decimals)
                      </span>
                    </div>
                  </div>

                  {/* Statutory Legal Disclaimer */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '0.4rem',
                      fontSize: '0.66rem',
                      color: 'var(--text-dim, #64748b)',
                      lineHeight: 1.35,
                    }}
                  >
                    ⚖️ <strong>Legal Notice</strong>: In compliance with Australian Consumer Law and the Legal Profession Uniform Law, all retainers, invoices, and token fees are legally billed in <strong>Australian Dollars (AUD)</strong>. Converted USD figures are indicative daily estimates.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(6, 8, 13, 0.95)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim, #64748b)' }}>
                <Globe size={14} />
                <span>Auto-refreshed daily via free Open-Meteo & Open-Exchange APIs</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  data-agent-id="geo-btn-cancel"
                  data-testid="geo-btn-cancel"
                  onClick={() => setIsOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  data-agent-id="geo-btn-save"
                  data-testid="geo-btn-save"
                  onClick={handleSave}
                  style={{
                    backgroundColor: 'var(--gold-primary, #d4af37)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  {isSavedRecently ? <Check size={14} /> : null}
                  <span>{isSavedRecently ? 'Preferences Saved' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About David Robertson Modal */}
      <AboutDavidModal
        isOpen={isAboutDavidOpen}
        onClose={() => setIsAboutDavidOpen(false)}
      />
    </>
  );
};

