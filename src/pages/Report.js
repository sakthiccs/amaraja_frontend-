import { useState } from 'react';
import SideNavbar from '../components/sidenavbar';
import Topbar from '../components/topbar';
import { Download, Loader, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Report = () => {

  const [selectedParameters, setSelectedParameters] = useState([
    'powerFactor',
    'activeImport',
    'rPhaseVoltage',
    'bPhaseVoltage',
    'yPhaseVoltage',
    'r_y_voltage',
    'y_b_voltage',
    'b_r_voltage',
    'rPhaseCurrent',
    'yPhaseCurrent',
    'reactivePower',
    'apparentPower',
    'activeImport2',
    'activePower',
  ]);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [interval, setInterval] = useState('1 min');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  /** FORMAT DATE LIKE TREND API EXPECTS */
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };


  /** MAIN REPORT GENERATOR USING HISTORY API */
/** FINAL PERFECT generateReportData() */
const generateReportData = async () => {
  const from = formatDateTime(fromDate);
  const to = formatDateTime(toDate);

  const intervalMap = {
    "10 sec": 10,
    "30 sec": 30,
    "1 min": 60,
    "5 min": 300,
    "15 min": 900,
    "30 min": 1800,
    "1 hour": 3600,
  };
  const intervalSec = intervalMap[interval] || 60;

  const url = `https://arcsplemapi.genuineitsolution.com/api/Meter/trend?from=${from}&to=${to}&param=ALL&interval=${intervalSec}&mode=history`;

  const resp = await fetch(url);
  const apiData = await resp.json();

  if (!Array.isArray(apiData)) return [];

  /** Sort readings */
  const readings = apiData
    .map((r) => ({ time: new Date(r.intervalStart), ...r }))
    .sort((a, b) => a.time - b.time);

  /** Build interval start times */
  const intervalsArr = [];
  let t = new Date(fromDate);
  while (t < toDate) {
    intervalsArr.push(new Date(t));
    t = new Date(t.getTime() + intervalSec * 1000);
  }

  /** Helpers */
  const getBefore = (target) => {
    let best = null;
    for (let r of readings) if (r.time <= target) best = r;
    return best;
  };

  const getAfter = (target) => {
    for (let r of readings) if (r.time >= target) return r;
    return null;
  };

  const one = (v) => Number(v).toFixed(1);

  /** FINAL REPORT OUTPUT */
  const report = [];

  for (let i = 0; i < intervalsArr.length - 1; i++) {
    const startTime = intervalsArr[i];
    const endTime = intervalsArr[i + 1];

    const startReading = getBefore(startTime);
    const endReading = getAfter(endTime);

    if (!startReading || !endReading) continue;

    /** ENERGY DIFFERENCE */
    const sKWh = Number(startReading.active_Import_KWh || 0);
    const eKWh = Number(endReading.active_Import_KWh || 0);
    const sKVAh = Number(startReading.active_Import_KVAh || 0);
    const eKVAh = Number(endReading.active_Import_KVAh || 0);

    const diffKWh = Math.max(0, Math.round(eKWh - sKWh));
    const diffKVAh = Math.max(0, Math.round(eKVAh - sKVAh));

    

    /** Skip first useless interval */
    if (i === 0 && diffKWh === 0) continue;

    /** Main row */
 // 1️⃣ Default time
const singleTime = startTime.toLocaleTimeString("en-GB", { hour12: false });

// 2️⃣ Interval time for energy
const intervalTime =
  `${startTime.toLocaleTimeString("en-GB", { hour12: false })} - ` +
  `${endTime.toLocaleTimeString("en-GB", { hour12: false })}`;

// 3️⃣ Energy Selected?
const energySelected =
  selectedParameters.includes("activeImport") ||
  selectedParameters.includes("activeImport2");

// 4️⃣ Time value
let timeValue = energySelected ? intervalTime : singleTime;

// 5️⃣ Base row
const row = {
  Date: startTime.toLocaleDateString("en-GB"),
  Time: timeValue,
};

// 6️⃣ Add energy only when selected
if (selectedParameters.includes("activeImport")) {
  row["Active Import (kWh)"] = `${diffKWh} `;
}
if (selectedParameters.includes("activeImport2")) {
  row["Apparent Import (kVAh)"] = `${diffKVAh} `;
}


    /** SINGLE READING PARAMETERS COME FROM startReading */
    const R = startReading;

    const VRY = ((R.r_Phase_Voltage || 0) / 1000) * 1.732;
    const VYB = ((R.y_Phase_Voltage || 0) / 1000) * 1.732;
    const VBR = ((R.b_Phase_Voltage || 0) / 1000) * 1.732;

    const fullRow = {
      "Power Factor": (() => {
        const active = Number(R.active_Power_KW) || 0;
        const apparent = Number(R.apparent_Power_KVA) || 0;
        let pf = apparent !== 0 ? active / apparent : 0;
        if (pf <= 1) return `${pf.toFixed(3)} `;
        const dev = 1 - (pf - 1);
        return `${(-dev).toFixed(3)} `;
      })(),

      "R Phase Voltage (kV)": `${one((R.r_Phase_Voltage || 0) / 1000)} `,
      "Y Phase Voltage (kV)": `${one((R.y_Phase_Voltage || 0) / 1000)} `,
      "B Phase Voltage (kV)": `${one((R.b_Phase_Voltage || 0) / 1000)} `,

      "R-Y Voltage (kV)": `${one(VRY)} `,
      "Y-B Voltage (kV)": `${one(VYB)} `,
      "B-R Voltage (kV)": `${one(VBR)} `,

      "R Phase Current (A)": `${one(R.r_phase_current ?? 0)} `,
      "Y Phase Current (A)": `${one(R.y_phase_current ?? 0)} `,
      "B Phase Current (A)": `${one(R.b_phase_current ?? 0)} `,

      "Active Power (kW)": `${one(R.active_Power_KW ?? 0)} `,
      "Apparent Power (kVA)": `${one(R.apparent_Power_KVA ?? 0)} `,
      "Reactive Power (kVAR)": `${one(R.reactive_Power_KW ?? 0)} `,

      "Frequency (Hz)": `${one(R.frequency ?? 0)} `,
    };

    /** Add only selected parameters */
/** ENERGY VALUES — ONLY IF SELECTED */


/** ADD OTHER PARAMETERS WITHOUT CHANGING TIME */
selectedParameters.forEach((id) => {
  const label = getParamLabel(id);
  if (fullRow[label]) {
    row[label] = fullRow[label];
  }
});


    report.push(row);
  }

  return report;
};




  /** LABEL MAPPING (NO CHANGE IN UI) */
const parameters = [
  { id: 'powerFactor', label: 'Power Factor' },

  { id: 'activeImport', label: 'Active Import (kWh)' },
  { id: 'activeImport2', label: 'Apparent Import (kVAh)' },

  // VOLTAGES --- FIXED to match fullRow keys
  { id: 'rPhaseVoltage', label: 'R Phase Voltage (kV)' },
  { id: 'yPhaseVoltage', label: 'Y Phase Voltage (kV)' },
  { id: 'bPhaseVoltage', label: 'B Phase Voltage (kV)' },

  // LINE VOLTAGE (derived)
  { id: 'r_y_voltage', label: 'R-Y Voltage (kV)' },
  { id: 'y_b_voltage', label: 'Y-B Voltage (kV)' },
  { id: 'b_r_voltage', label: 'B-R Voltage (kV)' },

  // CURRENT
  { id: 'rPhaseCurrent', label: 'R Phase Current (A)' },
  { id: 'yPhaseCurrent', label: 'Y Phase Current (A)' },
  { id: 'bPhaseCurrent', label: 'B Phase Current (A)' },

  // POWER
  { id: 'reactivePower', label: 'Reactive Power (kVAR)' },
  { id: 'apparentPower', label: 'Apparent Power (kVA)' },
  { id: 'activePower', label: 'Active Power (kW)' },

  { id: 'frequency', label: 'Frequency (Hz)' },
];






  const intervals = ['10 sec', '30 sec', '1 min', '5 min', '15 min', '30 min', '1 hour'];

  const getParamLabel = (id) => {
    return parameters.find(p => p.id === id)?.label || id;
  };

  /** DOWNLOAD EXCEL */
  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) return alert("Select date range");
    if (selectedParameters.length === 0) return alert("Select at least one parameter");

    setIsGenerating(true);

    try {
      const reportData = await generateReportData();

      const filename = `EMS_Report_${Date.now()}.xlsx`;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);

      ws['!cols'] = Object.keys(reportData[0]).map((key) => ({
        wch: Math.max(15, key.length + 5),
      }));

      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, filename);
    } catch (e) {
      console.error(e);
      alert("Failed to generate report");
    }

    setIsGenerating(false);
  };

  const getIntervalMs = (interval) => {
  const map = {
    '10 sec': 10000,
    '30 sec': 30000,
    '1 min': 60000,
    '5 min': 300000,
    '15 min': 900000,
    '30 min': 1800000,
    '1 hour': 3600000
  };
  return map[interval] || 60000;
};




    const toggleParameter = (id) => {
        setSelectedParameters(prev => 
            prev.includes(id) 
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

 

const ParameterCheckbox = ({ param }) => {
  const isChecked = selectedParameters.includes(param.id);

  return (
    <div
      onClick={() => toggleParameter(param.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "8px",
        border: `1px solid ${isChecked ? "#06b6d4" : "#374151"}`,
        backgroundColor: isChecked ? "rgba(6, 182, 212, 0.15)" : "#1f2937",
        cursor: "pointer",
        transition: "all 0.2s ease",
        userSelect: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.25)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = isChecked
          ? "rgba(6, 182, 212, 0.15)"
          : "#1f2937")
      }
    >
      {/* Checkbox Square */}
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: `2px solid ${isChecked ? "#06b6d4" : "#6b7280"}`,
          backgroundColor: isChecked ? "#06b6d4" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Label Text */}
      <span
        style={{
          color: "#f9fafb",
          fontSize: "14px",
          fontWeight: isChecked ? "600" : "400",
          letterSpacing: "0.02em",
        }}
      >
        {param.label}
      </span>
    </div>
  );
};


    return (
        <main className='container-wrapper page-alerts'>
               <Topbar onToggleSidebar={toggleSidebar} />

            <div className="container-fluid page-body-wrapper">
                    <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />


                <div className="main-panel">
                    <div className="content-wrapper" style={{ background: '#ffffff', minHeight: '100vh', padding: '24px' }}>
                        <div className="container-fluid">
                            {/* Select Parameters Section */}


                            
                            <div style={{
                                background: '#1a202c',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #2d3748',
                                marginBottom: '24px'
                            }}>
                               

                                <div style={{ marginBottom: "12px" }}>
                                     <h3 style={{
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    marginBottom: '16px'
                                }}>Select Parameters</h3>
  <button
    onClick={() => setSelectedParameters(parameters.map(p => p.id))}
    style={{
      padding: "8px 16px",
      background: "#06b6d4",
      border: "none",
      borderRadius: "6px",
      color: "white",
      fontSize: "13px",
      marginRight: "8px",
      cursor: "pointer"
    }}
  >
    Select All
  </button>
  <button
    onClick={() => setSelectedParameters([])}
    style={{
      padding: "8px 16px",
      background: "#ef4444",
      border: "none",
      borderRadius: "6px",
      color: "white",
      fontSize: "13px",
      cursor: "pointer"
    }}
  >
    Deselect All
  </button>
</div>

                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '8px'
                                }}>
                                    {parameters.map(param => (
                                        <ParameterCheckbox key={param.id} param={param} />
                                    ))}
                                </div>
                            </div>

                            {/* Date Range Section */}
                         {/* Date Range Section */}
<div style={{
  background: '#1a202c',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #2d3748',
  marginBottom: '24px'
}}>
  <h3 style={{
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <Calendar style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
    Select Date & Time Range
  </h3>

  <div className="row g-3 align-items-center">
    <div className="col-md-6">
      <label style={{
        color: '#9ca3af',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '8px',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>From (Date & Time)</label>
   <DatePicker
  selected={fromDate}
  onChange={(date) => setFromDate(date)}
  showTimeSelect
  timeFormat="HH:mm"
  timeIntervals={15}
  dateFormat="dd/MM/yyyy HH:mm"
  placeholderText="Select start date & time"
  className="form-control"
/>

    </div>
    <div className="col-md-6">
      <label style={{
        color: '#9ca3af',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '8px',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>To (Date & Time)</label>
    <DatePicker
  selected={toDate}
  onChange={(date) => setToDate(date)}
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


                            {/* Interval Selection */}
                            <div style={{
                                background: '#1a202c',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #2d3748',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    marginBottom: '12px'
                                }}>Select Interval</h3>
                                
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    style={{
                                        width: '200px',
                                        padding: '10px 12px',
                                        background: '#2d3748',
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    {intervals.map((int) => (
                                        <option key={int} value={int}>{int}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Generate Report Button */}
                            <button
                                onClick={handleGenerateReport}
                                disabled={isGenerating || selectedParameters.length === 0}
                                style={{
                                    padding: '12px 32px',
                                    background: isGenerating || selectedParameters.length === 0 ? '#4b5563' : '#06b6d4',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isGenerating || selectedParameters.length === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    boxShadow: isGenerating || selectedParameters.length === 0 ? 'none' : '0 2px 4px rgba(6, 182, 212, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isGenerating && selectedParameters.length > 0) {
                                        e.currentTarget.style.background = '#0891b2';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isGenerating && selectedParameters.length > 0) {
                                        e.currentTarget.style.background = '#06b6d4';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                                        Generating Excel...
                                    </>
                                ) : (
                                    <>
                                        <Download style={{ width: '18px', height: '18px' }} />
                                        Generate Report (Excel)
                                    </>
                                )}
                            </button>

                            {/* Summary Info */}
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                background: '#1a202c',
                                borderRadius: '8px',
                                border: '1px solid #2d3748'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>Selected Parameters: </span>
                                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                                            {selectedParameters.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>From Date: </span>
                                    <span style={{ color: '#fff' }}>
  {fromDate.toLocaleString("en-GB")}
</span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>To Date: </span>
                             <span style={{ color: '#fff' }}>
  {toDate.toLocaleString("en-GB")}
</span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>Interval: </span>
                                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                                            {interval}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
            `}</style>
        </main>
    );
};

export default Report;