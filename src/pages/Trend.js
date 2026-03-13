// src/pages/Trend.js
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SideNavbar from '../components/sidenavbar';
import Topbar from '../components/topbar';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toJpeg } from "html-to-image";

const BASE_URL = 'https://arcsplemapi.genuineitsolution.com';

const Trend = () => {
  const [mode, setMode] = useState('Live');
  const [selectedParameter, setSelectedParameter] = useState('ALL');
  const [intervalValue, setIntervalValue] = useState('10 sec');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chartRef = useRef(null);
  const wsRef = useRef(null);
  const mountedRef = useRef(true);
  
const lastUpdateRef = useRef(0);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ---------- Helpers ----------
  const parseNumber = (v) => {
    if (v === undefined || v === null) return 0;
    // sometimes API returns numbers as strings, sometimes empty string
    const n = parseFloat(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  // Try multiple key variants on an object and return first defined value
  const getFirstDefined = (obj, keys = []) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
        return obj[k];
      }
    }
    return undefined;
  };

  // Build common key variants for a field like "r_Phase_Current"
  const buildVariants = (field) => {
    const firstCap = field.charAt(0).toUpperCase() + field.slice(1);
    const lower = field.toLowerCase();
    const snakeFromCamel = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    const camel = field.split('_').map((s, i) => i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('');
    // include some common typo variants used by API
    const typos = [];
    if (field.toLowerCase().includes('apparent')) typos.push('apperent_power', 'apperent_Power', 'apperent_Power_KVA');
    if (field.toLowerCase().includes('react')) typos.push('react_Power', 'reactivePower', 'react_power');
    if (field.toLowerCase().includes('frequency')) typos.push('freqency', 'freq');
    return [field, firstCap, lower, snakeFromCamel, camel, ...typos];
  };

  const getIntervalSeconds = (label) => ({
    '10 sec': 10,
    '30 sec': 30,
    '1 min': 60,
    '5 min': 300,
    '10 min': 600,
    '15 min': 900,
    '20 min': 1200,
    '30 min': 1800,
    '1 hour': 3600
  }[label] || 10);

  const trimData = (arr, max = 300) => arr.slice(-max);

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return String(date);
    }
  };

  // Parameters config (no UI change)
  const parameters = [
    { value: 'ALL', label: 'All Parameters', color: '#06b6d4' },

    // Voltages
    { value: 'r_Phase_Voltage', label: 'R Phase Voltage', color: '#ef4444' },
    { value: 'y_Phase_Voltage', label: 'Y Phase Voltage', color: '#eab308' },
    { value: 'b_Phase_Voltage', label: 'B Phase Voltage', color: '#3b82f6' },

    // Currents
    { value: 'r_Phase_Current', label: 'R Phase Current (A)', color: '#ef4444' },
    { value: 'y_Phase_Current', label: 'Y Phase Current (A)', color: '#eab308' },
    { value: 'b_Phase_Current', label: 'B Phase Current (A)', color: '#3b82f6' },

    // Power
    { value: 'active_Power_KW', label: 'Active Power (kW)', color: '#10b981' },
    { value: 'reactive_Power_KW', label: 'Reactive Power (kVAR)', color: '#f97316' },
    { value: 'apparent_Power_KVA', label: 'Apparent Power (kVA)', color: '#a855f7' },

    // PF & Frequency
    { value: 'power_Factor', label: 'Power Factor', color: '#ec4899' },
    { value: 'frequency', label: 'Frequency (Hz)', color: '#6366f1' },
  ];


  // Format values just like Report page
const formatValue = (param, value) => {
  const v = Number(value) || 0;

  if (param.includes("Voltage")) return (v / 1000).toFixed(1) + " kV";
  if (param.includes("Current")) return v.toFixed(1) + " A";
  if (param.includes("active_Power_KW")) return v.toFixed(1) + " kW";
  if (param.includes("reactive_Power_KW")) return v.toFixed(1) + " kVAR";
  if (param.includes("apparent_Power_KVA")) return v.toFixed(1) + " kVA";
  if (param.includes("frequency")) return v.toFixed(2) + " Hz";
  if (param.includes("power_Factor")) return v.toFixed(3);

  return v.toFixed(2);
};


  const getColor = (param) =>
    parameters.find((p) => p.value === param)?.color || '#06b6d4';

  // ---------- Load today's history (up to now) ----------
  // This function will return an array shaped for the chart:
  // - If selectedParameter === 'ALL' => [{ timestamp, r_Phase_Voltage, ... }, ...]
  // - Else => [{ timestamp, value }, ...] where value is that single parameter
  const loadTodayHistoryBeforeLive = async (selectedParam, intervalSec) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const from = formatDateTime(startOfDay);
      const to = formatDateTime(now);

      const url = `${BASE_URL}/api/Meter/trend?from=${from}&to=${to}&param=${selectedParam === 'ALL' ? 'ALL' : selectedParam}&interval=${intervalSec}&mode=history`;

      const resp = await axios.get(url);
      if (!Array.isArray(resp.data)) return [];

      // Map incoming items -> normalized object
      const mapped = resp.data.map((item) => {
        const timestamp = formatTime(item.intervalStart || item.date || item.created_Date || item.intervalstart || new Date());
        // Use helper getFirstDefined so we support multiple name variants
        const rV = parseNumber(getFirstDefined(item, buildVariants('r_Phase_Voltage')) ?? getFirstDefined(item, ['r_Phase_Voltage', 'r_Phase_voltage', 'r_Phase_Voltage']));
        const yV = parseNumber(getFirstDefined(item, buildVariants('y_Phase_Voltage')));
        const bV = parseNumber(getFirstDefined(item, buildVariants('b_Phase_Voltage')));

        const rI = parseNumber(getFirstDefined(item, ['r_phase_current', 'r_Phase_Current', 'r_Phase_current', 'R_Phase_Current']));
        const yI = parseNumber(getFirstDefined(item, ['y_phase_current', 'y_Phase_Current', 'y_phase_current', 'Y_Phase_Current']));
        const bI = parseNumber(getFirstDefined(item, ['b_phase_current', 'b_Phase_Current', 'b_phase_current', 'B_Phase_Current']));

        const aKW = parseNumber(getFirstDefined(item, buildVariants('active_Power_KW')) ?? getFirstDefined(item, ['active_Power_KW', 'active_Power', 'active_Power'] ));
        const rKW = parseNumber(getFirstDefined(item, buildVariants('reactive_Power_KW')) ?? getFirstDefined(item, ['react_Power', 'reactive_Power']));
        const appKVA = parseNumber(getFirstDefined(item, buildVariants('apparent_Power_KVA')) ?? getFirstDefined(item, ['apperent_Power', 'apperent_power', 'apperent_Power_KVA']));

        // power factor — API sometimes gives scaled value (like 1483). Convert if needed.
        let pfRaw = parseNumber(getFirstDefined(item, ['power_Factor', 'power_factor', 'Power_Factor']));
        if (pfRaw > 1) {
          // convert big integer to fractional pf: 1483 -> 1.483, then cap to 1.0 maximum for display
          pfRaw = pfRaw / 1000;
        }
        if (pfRaw > 1) pfRaw = 1;
        if (pfRaw < -1) pfRaw = -1;

        const freq = parseNumber(getFirstDefined(item, ['frequency', 'freqency', 'Frequency', 'freq']));

        const base = {
          timestamp,
          r_Phase_Voltage: rV,
          y_Phase_Voltage: yV,
          b_Phase_Voltage: bV,

          r_Phase_Current: rI,
          y_Phase_Current: yI,
          b_Phase_Current: bI,

          active_Power_KW: aKW,
          reactive_Power_KW: rKW,
          apparent_Power_KVA: appKVA,

          power_Factor: pfRaw,
          frequency: freq
        };

        if (selectedParam === 'ALL') {
          return base;
        } else {
          // For single param only return {timestamp, value}
          // try to read selectedParam from base (if keys match), else use getFirstDefined on original item
          const keyVariants = buildVariants(selectedParam);
          // direct mapping: selectedParam often equals keys in our base; handle both
          const val =
            (base[selectedParam] !== undefined ? base[selectedParam] : undefined) ??
            parseNumber(getFirstDefined(item, keyVariants));
          return { timestamp, value: val };
        }
      });

      // filter out duplicates by timestamp (keep first occurrence)
      const deduped = [];
      const seen = new Set();
      for (const d of mapped) {
        if (!seen.has(d.timestamp)) {
          deduped.push(d);
          seen.add(d.timestamp);
        }
      }

      return deduped;
    } catch (err) {
      console.error('loadTodayHistoryBeforeLive error', err);
      return [];
    }
  };

  // ---------- Live logic: history first, then single websocket ----------
  useEffect(() => {
    mountedRef.current = true;
    if (mode !== 'Live') {
      // close ws if switching out of live
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) { /* ignore */ }
        wsRef.current = null;
      }
      return;
    }

    const intervalSec = getIntervalSeconds(intervalValue);

    let ws; // will be the single websocket instance

    // helper to add/overwrite last point if timestamp equal
    const pushPointSafely = (setter, newPoint, isAllMode) => {
      setter(prev => {
        if (!prev || prev.length === 0) return trimData([newPoint]);
        const last = prev[prev.length - 1];
        if (last.timestamp === newPoint.timestamp) {
          // overwrite last
          const copy = prev.slice(0, -1);
          return trimData([...copy, newPoint]);
        }
        return trimData([...prev, newPoint]);
      });
    };

    // Start by loading today's history (either ALL or single param)
    loadTodayHistoryBeforeLive(selectedParameter, intervalSec).then((history) => {
      if (!mountedRef.current) return;
      // Set initial dataset (history)
      setChartData(history);

      // Now open websocket to receive new points and append/overwrite
      try {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
  ws = new WebSocket("wss://ARCSPLEMapi.genuineitsolution.com/ws");
  wsRef.current = ws;
}

      } catch (err) {
        console.error('WebSocket init error', err);
        return;
      }

  

      ws.onopen = () => console.log('✅ WebSocket Connected (Live Trend)');

    ws.onmessage = (event) => {
  try {
    const raw = JSON.parse(event.data);
    const now = new Date();
    const nowSec = now.getTime() / 1000;

    // Strict interval rate limit
    if (nowSec - lastUpdateRef.current < intervalSec) return;
    lastUpdateRef.current = nowSec;

    const timestamp = formatTime(raw.date ?? raw.created_Date ?? raw.intervalStart ?? now);

    const cleaned = {
      timestamp,
      r_Phase_Voltage: parseNumber(getFirstDefined(raw, buildVariants('r_Phase_Voltage'))),
      y_Phase_Voltage: parseNumber(getFirstDefined(raw, buildVariants('y_Phase_Voltage'))),
      b_Phase_Voltage: parseNumber(getFirstDefined(raw, buildVariants('b_Phase_Voltage'))),

      r_Phase_Current: parseNumber(getFirstDefined(raw, buildVariants('r_Phase_Current'))),
      y_Phase_Current: parseNumber(getFirstDefined(raw, buildVariants('y_Phase_Current'))),
      b_Phase_Current: parseNumber(getFirstDefined(raw, buildVariants('b_Phase_Current'))),

      active_Power_KW: parseNumber(getFirstDefined(raw, buildVariants('active_Power_KW'))),
      reactive_Power_KW: parseNumber(getFirstDefined(raw, buildVariants('reactive_Power_KW'))),
      apparent_Power_KVA: parseNumber(getFirstDefined(raw, buildVariants('apparent_Power_KVA'))),

      power_Factor: (() => {
        let pf = parseNumber(getFirstDefined(raw, ['power_Factor', 'power_factor']));
        if (pf > 1) pf = pf / 1000;
        if (pf > 1) pf = 1;
        if (pf < -1) pf = -1;
        return pf;
      })(),

      frequency: parseNumber(getFirstDefined(raw, ['frequency', 'freqency', 'Frequency']))
    };

    if (selectedParameter === 'ALL') {
      pushPointSafely(setChartData, cleaned, true);
      return;
    }

    const value =
      cleaned[selectedParameter] ??
      parseNumber(getFirstDefined(raw, buildVariants(selectedParameter)));

    pushPointSafely(setChartData, { timestamp, value }, false);

  } catch (err) {
    console.error("WS message error", err);
  }
};

      ws.onerror = (err) => {
        console.error('WebSocket error', err);
      };

      ws.onclose = () => {
        // clear reference
        if (wsRef.current === ws) wsRef.current = null;
        console.log('🔴 WebSocket Closed');
      };
    }).catch((err) => {
      console.error('Error in loadTodayHistoryBeforeLive flow', err);
    });

   return () => {
  if (!mountedRef.current && wsRef.current) {
    try { wsRef.current.close(); } catch {}
    wsRef.current = null;
  }
};






    // we intentionally re-run this effect when mode, selectedParameter or intervalValue changes
  }, [mode, selectedParameter, intervalValue]);

  // ---------------- Historical Mode (manual fetch) ----------------
  const handleSubmit = async () => {
    if (mode === 'Live') return;
    setError(null);
    setLoading(true);
    setChartData([]);

    if (!startDate || !endDate) {
      setError('Please select a valid date range.');
      setLoading(false);
      return;
    }

    try {
      const from = formatDateTime(startDate);
      const to = formatDateTime(endDate);

      const intervalSec = getIntervalSeconds(intervalValue);
      const url = `${BASE_URL}/api/Meter/trend?from=${from}&to=${to}&param=${selectedParameter === 'ALL' ? 'ALL' : selectedParameter}&interval=${intervalSec}&mode=history`;

      const resp = await axios.get(url);
      if (!Array.isArray(resp.data)) {
        setError('No data found.');
        setLoading(false);
        return;
      }

      // Build dataset consistent with the chart expectations
      const allData = resp.data.map((item) => ({
        timestamp: new Date(item.intervalStart || item.date || item.created_Date || item.intervalstart),
        ...item
      }));

      // Interval filtering (dedupe by requested interval)
      const filtered = [];
      let lastTime = null;
      for (const d of allData) {
        const current = new Date(d.timestamp);
        if (!lastTime || (current - lastTime) / 1000 >= intervalSec) {
          filtered.push(d);
          lastTime = current;
        }
      }

      let mapped = [];

      // Energy difference handling for energy counters (if the user requested those exact params)
      if (selectedParameter === "active_Import_KWh" || selectedParameter === "active_Import_KVAh") {
        let prev = null;
        mapped = filtered.map((item) => {
          const curr = parseNumber(getFirstDefined(item, buildVariants(selectedParameter)));
          let diff = prev !== null ? curr - prev : 0;
          if (diff < 0) diff = 0;
          prev = curr;
          return {
            timestamp: item.timestamp.toLocaleString("en-US", { hour12: false }),
            value: diff
          };
        });
      } else if (selectedParameter === "ALL") {
        mapped = filtered.map((item) => ({
          timestamp: item.timestamp.toLocaleString("en-US", { hour12: false }),

          r_Phase_Voltage: parseNumber(getFirstDefined(item, ['r_Phase_Voltage', 'R_Phase_Voltage', 'r_Phase_voltage'])),
          y_Phase_Voltage: parseNumber(getFirstDefined(item, ['y_Phase_Voltage', 'Y_Phase_Voltage'])),
          b_Phase_Voltage: parseNumber(getFirstDefined(item, ['b_Phase_Voltage', 'B_Phase_Voltage'])),

          r_Phase_Current: parseNumber(getFirstDefined(item, ['r_phase_current', 'r_Phase_Current', 'R_Phase_Current'])),
          y_Phase_Current: parseNumber(getFirstDefined(item, ['y_phase_current', 'y_Phase_Current', 'Y_Phase_Current'])),
          b_Phase_Current: parseNumber(getFirstDefined(item, ['b_phase_current', 'b_Phase_Current', 'B_Phase_Current'])),

          active_Power_KW: parseNumber(getFirstDefined(item, ['active_Power_KW', 'Active_Power_KW'])),
          reactive_Power_KW: parseNumber(getFirstDefined(item, ['reactive_Power_KW', 'Reactive_Power_KW', 'react_Power'])),
          apparent_Power_KVA: parseNumber(getFirstDefined(item, ['apparent_Power_KVA', 'Apparent_Power_KVA', 'apperent_Power'])),

          power_Factor: (() => {
            let pf = parseNumber(getFirstDefined(item, ['power_Factor', 'Power_Factor', 'power_factor']));
            if (pf > 1) pf = pf / 1000;
            if (pf > 1) pf = 1;
            if (pf < -1) pf = -1;
            return pf;
          })(),

          frequency: parseNumber(getFirstDefined(item, ['frequency', 'Frequency', 'freqency']))
        }));
      } else {
        // Single parameter historical mapping
        mapped = filtered.map((item) => {
          const val = parseNumber(getFirstDefined(item, buildVariants(selectedParameter)));
          return {
            timestamp: item.timestamp.toLocaleString("en-US", { hour12: false }),
            value: val
          };
        });
      }

      setChartData(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch historical data.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Utility to format date param used by API ----------
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ---------- UI (unchanged) ----------
  const intervals = [
    '10 sec', '30 sec', '1 min', '5 min',
    '10 min', '15 min', '20 min', '30 min', '1 hour'
  ];

  const downloadTrendImage = () => {
    if (!chartRef.current) return;
    toJpeg(chartRef.current, { quality: 0.95 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `trend_chart_${Date.now()}.jpeg`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Image Export Error:", err));
  };

  return (
    <main className="container-wrapper page-alerts">
      <Topbar onToggleSidebar={toggleSidebar} />

      <div className="container-fluid page-body-wrapper">
        <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />


        <div className="main-panel">
          <div className="content-wrapper" style={{ background: '#fff', minHeight: '100vh', padding: 24 }}>
            <div className="container-fluid">

              {/* Controls */}
              <div style={panelStyle}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-2">
                    <label style={labelStyle}>Mode</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)} style={selectStyle}>
                      <option value="Live">Live</option>
                      <option value="Historical">Historical</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label style={labelStyle}>Parameter</label>
                    <select
                      value={selectedParameter}
                      onChange={(e) => setSelectedParameter(e.target.value)}
                      style={selectStyle}
                    >
                      {parameters.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label style={labelStyle}>Interval</label>
                    <select value={intervalValue} onChange={(e) => setIntervalValue(e.target.value)} style={selectStyle}>
                      {intervals.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={downloadTrendImage}
                    style={{
                      padding: "8px 16px",
                      background: "#06b6d4",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontWeight: 600,
                      marginBottom: 12,
                      cursor: "pointer"
                    }}
                  >
                    Export Trend Image
                  </button>


                  {mode === 'Historical' && (
                    <div className="col-md-4">
                      <label style={labelStyle}>Date Range</label>
                      <div className="d-flex gap-3 align-items-center">
                        <div>
                          <label style={labelStyle}>From (Date & Time)</label>
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => setDateRange([date, endDate])}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd/MM/yyyy HH:mm"
                            placeholderText="Select start date & time"
                            className="form-control"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>To (Date & Time)</label>
                          <DatePicker
                            selected={endDate}
                            onChange={(date) => setDateRange([startDate, date])}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd/MM/yyyy HH:mm"
                            placeholderText="Select end date & time"
                            className="form-control"
                          />
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="col-md-12 mt-3">
                    <button onClick={handleSubmit} style={submitBtnStyle}>
                      {mode === 'Live' ? 'Start Live Data' : 'Fetch Historical'}
                    </button>
                    {loading && <span style={{ color: '#9ca3af', marginLeft: 10 }}>Loading...</span>}
                    {error && <div style={{ color: '#f87171', marginTop: 8 }}>{error}</div>}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div ref={chartRef} style={chartBoxStyle}>
                <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
  <div style={{ width: Math.max(chartData.length * 40, 1200), height: 400 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      domain={
                        selectedParameter === 'frequency'
                          ? [45, 55]
                          : selectedParameter === 'power_Factor'
                            ? [0, 1]
                            : ['auto', 'auto']
                      }
                      ticks={
                        selectedParameter === 'frequency'
                          ? [45, 47, 49, 50, 52, 55]
                          : selectedParameter === 'power_Factor'
                            ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
                            : undefined
                      }
                    />

<Tooltip
  content={({ payload, label }) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div
        style={{
          background: "#1e293b",
          padding: 12,
          borderRadius: 6,
          border: "1px solid #374151",
          color: "#fff"
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>

        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color, marginBottom: 4 }}>
          {p.name} : {formatValue(p.unit || p.dataKey, p.value)}

          </div>
        ))}
      </div>
    );
  }}
/>
                    <Legend />
                    {selectedParameter === 'ALL'
                      ? parameters.filter((p) => p.value !== 'ALL').map((p) => (
                        <Line
                          key={p.value}
                          type="monotone"
                          dataKey={p.value}
                          name={p.label}
                          stroke={p.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))
                      : (
                       <Line
  type="monotone"
  dataKey="value"
  name={parameters.find((p) => p.value === selectedParameter)?.label}
  stroke={getColor(selectedParameter)}
  strokeWidth={2}
  dot={false}
  unit={selectedParameter}   // <---- ADD THIS
/>

                      )}
                  </LineChart>
                </ResponsiveContainer>
                </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ----- Styles -----
const panelStyle = {
  background: '#1a202c',
  borderRadius: 12,
  padding: 20,
  border: '1px solid #2d3748',
  marginBottom: 24
};

const labelStyle = {
  color: '#9ca3af',
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 8,
  display: 'block',
  textTransform: 'uppercase'
};
const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#2d3748',
  border: '1px solid #374151',
  borderRadius: 6,
  color: '#fff',
  fontSize: 14,
  outline: 'none'
};
const submitBtnStyle = {
  width: '200px',
  padding: '10px 20px',
  background: '#06b6d4',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer'
};
const chartBoxStyle = {
  background: '#1a202c',
  borderRadius: 12,
  padding: 20,
  border: '1px solid #2d3748'
};

export default Trend;
