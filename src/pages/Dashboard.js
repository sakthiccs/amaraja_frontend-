import { useState, useEffect, useRef } from 'react';
import SideNavbar from '../components/sidenavbar';
import Topbar from '../components/topbar';
import { Activity, Zap, Battery, TrendingUp, Power, RefreshCw } from 'lucide-react';

const Dashboard = () => {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);
      const [sidebarOpen, setSidebarOpen] = useState(false);

      

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  

    // Initial dashboard data with default values
    const [dashboardData, setDashboardData] = useState({
        voltage: {
            rPhase: { value: 0.00, min: 0, max: 33000, unit: 'V' },
            yPhase: { value: 0.00, min: 0, max: 33000, unit: 'V' },
            bPhase: { value: 0.00, min: 0, max: 33000, unit: 'V' }
        },
        current: {
            rPhase: { value: 0.00, min: 0, max: 100, unit: 'A' },
            yPhase: { value: 0.00, min: 0, max: 100, unit: 'A' },
            bPhase: { value: 0.00, min: 0, max: 100, unit: 'A' }
        },
        voltageBetweenPhases: {
            v1v2: { value: 0.00, min: 0, max: 35000, unit: 'V' },
            v2v3: { value: 0.00, min: 0, max: 35000, unit: 'V' },
            v3v1: { value: 0.00, min: 0, max: 35000, unit: 'V' }
        },
        power: {
            apparent: { value: 0.00, min: 0, max: 1000, unit: 'kVA' },
            active: { value: 0.00, min: 0, max: 10000, unit: 'kW' },
            reactive: { value: 0.00, min: 0, max: 10000, unit: 'kVAR' }
        },
        energy: {
            activeImport: { value: 0.00, min: 0, max:"No Limit" , unit: 'kWh' },
            activeExport: { value: 0.00, min: 0, max: "No Limit", unit: 'kWh' },
            apparentImport: { value: 0.00, min: 0, max: "No Limit", unit: 'kVAh' },
            apparentExport: { value: 0.00, min: 0, max: "No Limit", unit: 'kVAh' }
        },
        systemMetrics: {
            powerFactor: { value: 0.00, min: 0, max: 1, unit: '' },
            avgPhaseVoltage: { value: 0.00, min: 0, max: 110, unit: '%' },
            frequency: { value: 0.00 }
        }
    });

    // WebSocket connection for real-time data
    const connectWebSocket = () => {
        try {
            if (wsRef.current) {
                wsRef.current.close();
            }

            // Use wss:// for secure WebSocket connection
           // const ws = new WebSocket("ws://localhost:5210/ws");
           const ws = new WebSocket("wss:/ARCSPLEMapi.genuineitsolution.com/ws");

            ws.onopen = () => {
                console.log("✅ WebSocket Connected to Server");
                setIsConnected(true);
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const rawData = JSON.parse(event.data);
                    console.log("📊 WebSocket data received:", rawData);

                    // ✅ COMPLETE MAPPING LOGIC - Based on your backend model
                    const mappedData = {
                        meterID: rawData.meterID,
                        R_Phase_V: parseFloat(rawData.r_Phase_Voltage) || 0,
                        Y_Phase_V: parseFloat(rawData.y_Phase_Voltage) || 0,
                        B_Phase_V: parseFloat(rawData.b_Phase_Voltage) || 0,
                        V1_V2_Phase_V: parseFloat(rawData.v1_V2_Phase_Voltage) || 0,
                        V2_V3_Phase_V: parseFloat(rawData.v2_V3_Phase_Voltage) || 0,
                        V3_V1_Phase_V: parseFloat(rawData.v3_V1_Phase_Voltage) || 0,
                        R_Phase_Current: parseFloat(rawData.r_Phase_Current) || 0,
                        Y_Phase_Current: parseFloat(rawData.y_Phase_Current) || 0,
                        B_Phase_Current: parseFloat(rawData.b_Phase_Current) || 0,
                        Resistive_Power: parseFloat(rawData.resistive_Power) || 0,
                        React_Power: parseFloat(rawData.react_Power) || 0,
                        Apperent_Power: parseFloat(rawData.apperent_Power) || 0,
                        Avg_Phase_Voltage_In_Percent: parseFloat(rawData.avg_Phase_Voltage_In_Percent) || 0,
         Power_Factor:
  parseFloat(rawData.apperent_Power) !== 0
    ? parseFloat(rawData.active_Power_KW) / parseFloat(rawData.apperent_Power)
    : 0,
Power_Factor_Label:
  parseFloat(rawData.react_Power) >= 0 ? 'LG' : 'LD',


                        Frequency: parseFloat(rawData.freqency) || 0,
                        Active_Import_KWh: parseFloat(rawData.active_Import_KWh) || 0,
                        Active_Export_KWh: parseFloat(rawData.active_Export_KWh) || 0,
                        Active_Import_KVAh: parseFloat(rawData.active_Import_KVAh) || 0,
                        Active_Export_KVAh: parseFloat(rawData.active_Export_KVAh) || 0,
                        Active_Power_KW: parseFloat(rawData.active_Power_KW) || 0
                    };

                    console.log("🗺️ Mapped data:", mappedData);
                    updateDashboardData(mappedData);
                    setLastUpdated(new Date());
                } catch (error) {
                    console.error("❌ Error parsing WebSocket message:", error);
                    console.log("📨 Raw message that failed:", event.data);
                }
            };

            ws.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log("🔌 WebSocket disconnected. Attempting to reconnect...");
                setIsConnected(false);

                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log("🔄 Reconnecting WebSocket...");
                    connectWebSocket();
                }, 3000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error("❌ Error creating WebSocket:", error);
            setIsConnected(false);

            reconnectTimeoutRef.current = setTimeout(() => {
                connectWebSocket();
            }, 3000);
        }
    };
    

    // Update dashboard data with WebSocket values
    const updateDashboardData = (data) => {
        console.log("🔄 Updating dashboard with:", data);

        setDashboardData(prevData => ({
            voltage: {
                rPhase: { ...prevData.voltage.rPhase, value: data.R_Phase_V },
                yPhase: { ...prevData.voltage.yPhase, value: data.Y_Phase_V },
                bPhase: { ...prevData.voltage.bPhase, value: data.B_Phase_V }
            },
            current: {
                rPhase: { ...prevData.current.rPhase, value: data.R_Phase_Current },
                yPhase: { ...prevData.current.yPhase, value: data.Y_Phase_Current },
                bPhase: { ...prevData.current.bPhase, value: data.B_Phase_Current }
            },
            voltageBetweenPhases: {
                v1v2: { ...prevData.voltageBetweenPhases.v1v2, value: data.V1_V2_Phase_V },
                v2v3: { ...prevData.voltageBetweenPhases.v2v3, value: data.V2_V3_Phase_V },
                v3v1: { ...prevData.voltageBetweenPhases.v3v1, value: data.V3_V1_Phase_V }
            },
            power: {
                apparent: { ...prevData.power.apparent, value: data.Apperent_Power },
                active: { ...prevData.power.active, value: data.Active_Power_KW },
                reactive: { ...prevData.power.reactive, value: data.React_Power }
            },
            energy: {
                activeImport: { ...prevData.energy.activeImport, value: data.Active_Import_KWh },
                activeExport: { ...prevData.energy.activeExport, value: data.Active_Export_KWh },
                apparentImport: { ...prevData.energy.apparentImport, value: data.Active_Import_KVAh },
                apparentExport: { ...prevData.energy.apparentExport, value: data.Active_Export_KVAh }
            },
            systemMetrics: {
                powerFactor: { ...prevData.systemMetrics.powerFactor, value: data.Power_Factor },
                avgPhaseVoltage: { ...prevData.systemMetrics.avgPhaseVoltage, value: data.Avg_Phase_Voltage_In_Percent },
                frequency: { ...prevData.systemMetrics.frequency, value: data.Frequency }
            }
        }));
    };

    // Manual reconnect function
    const handleManualReconnect = () => {
        console.log("🔄 Manual reconnect triggered");
        connectWebSocket();
    };

    useEffect(() => {
        // Start with WebSocket connection only
        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Rest of your component remains the same...
    const getPercentage = (value, min, max) => {
        return ((value - min) / (max - min)) * 100;
    };

    const getColorStyles = (color) => {
        const colors = {
            red: { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
            yellow: { stroke: '#eab308', bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308' },
            blue: { stroke: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
            green: { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
            orange: { stroke: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
            purple: { stroke: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' },
            cyan: { stroke: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)', text: '#06b6d4' },
            pink: { stroke: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', text: '#ec4899' },
            indigo: { stroke: '#6366f1', bg: 'rgba(99, 102, 241, 0.2)', text: '#6366f1' }
        };
        return colors[color] || colors.blue;
    };

    const EnergyCircle = ({ title, value, color }) => {
  const colorStyle = getColorStyles(color);

  return (
    <div style={{
      background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #374151',
      textAlign: 'center'
    }}>
      <h3 style={{
        color: '#9ca3af',
        fontSize: '11px',
        fontWeight: '500',
        marginBottom: '12px',
        textTransform: 'uppercase'
      }}>
        {title}
      </h3>

      <div style={{
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        margin: 'auto',
        border: `8px solid ${colorStyle.stroke}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>
            {value.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            {title.includes("ACTIVE") ? "kWh" : "kVAh"}
          </div>
        </div>
      </div>
    </div>
  );
};


const FrequencyGauge = ({ value }) => {
  return (
    <div style={{
      background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #374151',
      textAlign: 'center'
    }}>
      <h3 style={{
        color: '#9ca3af',
        fontSize: '11px',
        fontWeight: '500',
        marginBottom: '12px',
        textTransform: 'uppercase'
      }}>
        FREQUENCY (Hz)
      </h3>

      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        margin: 'auto',
        background: 'rgba(99,102,241,0.2)',
        border: '6px solid #6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{
          color: '#fff',
          fontSize: '20px',
          fontWeight: '700'
        }}>
          {value.toFixed(2)} Hz
        </span>
      </div>
    </div>
  );
};


    const GaugeCard = ({ title, value, min, max, unit, color = "blue" }) => {
        const percentage = getPercentage(value, min, max);
        const colorStyle = getColorStyles(color);

        return (
            <div style={{
                background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #374151',
                transition: 'all 0.3s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{
                    color: '#9ca3af',
                    fontSize: '11px',
                    fontWeight: '500',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>{title}</h3>

                <div style={{ position: 'relative', width: '112px', height: '112px', margin: '0 auto 12px' }}>
                    <svg style={{ transform: 'rotate(-90deg)', width: '112px', height: '112px' }}>
                        <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="#374151"
                            strokeWidth="6"
                            fill="none"
                        />
                        <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke={colorStyle.stroke}
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 48}`}
                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                            strokeLinecap="round"
                            style={{ transition: 'all 1s ease' }}
                        />
                    </svg>
                <div style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}}>
    <span style={{
      fontSize: unit === 'kWh' || unit === 'kVAh' ? '10px' : '10px',
      fontWeight: 'bold',
      color: 'white',
      lineHeight: 1.2
    }}>
      {(unit === 'V' ? (value / 1000).toFixed(1) : value.toFixed(2))} {unit === 'V' ? 'kV' : unit}
    </span>
</div>

                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '8px'
                }}>
                  <span>{unit === 'V' ? (min / 1000).toFixed(0) : min} {unit === 'V' ? 'kV' : unit}</span>
<span style={{ color: colorStyle.text, fontWeight: '600' }}>{percentage.toFixed(0)}%</span>
<span>{unit === 'V' ? (max / 1000).toFixed(0) : max} {unit === 'V' ? 'kV' : unit}</span>

                </div>
            </div>
        );
    };


    // Add a computed flag to check data validity


    // Add this component before your Dashboard component
const PowerFactorGauge = ({ value }) => {

  let pfValue = value;
  let displayValue = 0;
  let label = "";
  let pf = 0;

  // --- PF 0–1 → LAG ---
  if (pfValue <= 1) {
    label = "Lag";
    displayValue = pfValue.toFixed(2);
    pf = pfValue;
  }

  // --- PF > 1 → LEAD (FINAL UNGAL LOGIC) ---
  else {
    label = "Lead";

    const step1 = pfValue - 1;     // ex: 1.06 - 1 = 0.06
    const deviation = 1 - step1;   // ex: 1 - 0.06 = 0.94

    displayValue = (-deviation).toFixed(2);  // UI = -0.94
    pf = Math.abs(deviation);                // needle = 0.94
  }

  pf = Math.min(1, Math.max(0, pf));

  const angle = label === "Lead"
    ? -90 - (pf * 180)
    : -90 + (pf * 180);


  return (
    <div style={{
      background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
      borderRadius: "8px",
      padding: "16px",
      border: "1px solid #374151"
    }}>
      
      <h3 style={{
        color: "#9ca3af",
        fontSize: "11px",
        fontWeight: "500",
        textAlign: "center",
        marginBottom: "12px"
      }}>
        POWER FACTOR ({label})
      </h3>

      <div style={{ position: "relative", width: "200px", height: "120px", margin: "0 auto" }}>
        
        <svg viewBox="0 0 200 120" style={{ width: "100%" }}>
          {/* Background arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none" stroke="#374151" strokeWidth="16" />

          {/* PF arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none" stroke="#ec4899" strokeWidth="16"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - pf)}
                style={{ transition: "1s ease" }} />

          {/* Needle */}
          <g transform={`rotate(${angle} 100 100)`} style={{ transition: "1s ease" }}>
            <line x1="100" y1="100" x2="100" y2="35" stroke="#3b82f6" strokeWidth="3" />
            <circle cx="100" cy="100" r="8" fill="#3b82f6" />
          </g>

        </svg>

        {/* Display PF */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "20px",
          fontWeight: "bold",
          color: "white"
        }}>
          {displayValue}
        </div>
      </div>

    </div>
  );
};





// Then replace your power factor GaugeCard with:
<div className="col-md-6 data-card">
  <PowerFactorGauge
    value={dashboardData.systemMetrics.powerFactor.value}
    label={dashboardData.systemMetrics.powerFactor.value >= 0 ? 'LG' : 'LD'}
  />
</div>

    const SectionHeader = ({ icon: Icon, title, color = "blue" }) => {
        const colorStyle = getColorStyles(color);

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                    background: colorStyle.bg,
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon style={{ width: '20px', height: '20px', color: colorStyle.text }} />
                </div>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0
                }}>{title}</h2>
            </div>
        );

        // Add this component before your Dashboard component

    };


    

    return (
        <main className='container-wrapper page-alerts'>
   <Topbar onToggleSidebar={toggleSidebar} />
 
<div className="container-fluid page-body-wrapper">
    <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

  {/* ✅ Mobile Overlay */}
  <div
    className="mobile-overlay"
    onClick={() => {
      document.querySelector("#sidebar").classList.remove("active");
      document.querySelector(".mobile-overlay").classList.remove("show");
      document.body.classList.remove("sidebar-open");
    }}
  ></div>


    {/* ✅ Mobile overlay */}
    <div
      className="mobile-overlay"
      onClick={() => {
        document.querySelector(".sidebar").classList.remove("active");
        document.querySelector(".mobile-overlay").classList.remove("show");
        document.body.classList.remove("sidebar-open");
      }}
    ></div>

                <div className="main-panel">
                    <div className="content-wrapper">
                        {/* Connection Status Indicator */}
                 {/* ✅ Connection Status Indicator */}




                        {/* Your existing gauge layout */}
                        <div className="container-fluid">
                            <div className="row" style={{ marginBottom: '24px' }}>
                                {/* Voltage Section */}
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={Zap} title="VOLTAGE (Values in KV)" color="yellow" />
                                        <div className="row g-3">
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="R PHASE VOLTAGE"
                                                    value={dashboardData.voltage.rPhase.value}
                                                    min={dashboardData.voltage.rPhase.min}
                                                    max={dashboardData.voltage.rPhase.max}
                                                    unit={dashboardData.voltage.rPhase.unit}
                                                    color="red"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="Y PHASE VOLTAGE"
                                                    value={dashboardData.voltage.yPhase.value}
                                                    min={dashboardData.voltage.yPhase.min}
                                                    max={dashboardData.voltage.yPhase.max}
                                                    unit={dashboardData.voltage.yPhase.unit}
                                                    color="yellow"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="B PHASE VOLTAGE"
                                                    value={dashboardData.voltage.bPhase.value}
                                                    min={dashboardData.voltage.bPhase.min}
                                                    max={dashboardData.voltage.bPhase.max}
                                                    unit={dashboardData.voltage.bPhase.unit}
                                                    color="blue"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Section */}
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={Activity} title="Current" color="orange" />
                                        <div className="row g-3">
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="R PHASE CURRENT"
                                                    value={dashboardData.current.rPhase.value}
                                                    min={dashboardData.current.rPhase.min}
                                                    max={dashboardData.current.rPhase.max}
                                                    unit={dashboardData.current.rPhase.unit}
                                                    color="red"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="Y PHASE CURRENT"
                                                    value={dashboardData.current.yPhase.value}
                                                    min={dashboardData.current.yPhase.min}
                                                    max={dashboardData.current.yPhase.max}
                                                    unit={dashboardData.current.yPhase.unit}
                                                    color="yellow"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="B PHASE CURRENT"
                                                    value={dashboardData.current.bPhase.value}
                                                    min={dashboardData.current.bPhase.min}
                                                    max={dashboardData.current.bPhase.max}
                                                    unit={dashboardData.current.bPhase.unit}
                                                    color="blue"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Voltage Between Phases */}
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={Zap} title="Voltage Between Phases" color="cyan" />
                                        <div className="row g-3">
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="R–Y VOLTAGE"
                                                    value={dashboardData.voltageBetweenPhases.v1v2.value}
                                                    min={dashboardData.voltageBetweenPhases.v1v2.min}
                                                    max={dashboardData.voltageBetweenPhases.v1v2.max}
                                                    unit={dashboardData.voltageBetweenPhases.v1v2.unit}
                                                    color="cyan"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="Y–B VOLTAGE"
                                                    value={dashboardData.voltageBetweenPhases.v2v3.value}
                                                    min={dashboardData.voltageBetweenPhases.v2v3.min}
                                                    max={dashboardData.voltageBetweenPhases.v2v3.max}
                                                    unit={dashboardData.voltageBetweenPhases.v2v3.unit}
                                                    color="cyan"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="B–R  VOLTAGE"
                                                    value={dashboardData.voltageBetweenPhases.v3v1.value}
                                                    min={dashboardData.voltageBetweenPhases.v3v1.min}
                                                    max={dashboardData.voltageBetweenPhases.v3v1.max}
                                                    unit={dashboardData.voltageBetweenPhases.v3v1.unit}
                                                    color="cyan"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={Power} title="Power" color="green" />
                                        <div className="row g-3">
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="APPARENT POWER"
                                                    value={dashboardData.power.apparent.value}
                                                    min={dashboardData.power.apparent.min}
                                                    max={dashboardData.power.apparent.max}
                                                    unit={dashboardData.power.apparent.unit}
                                                    color="purple"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="ACTIVE POWER"
                                                    value={dashboardData.power.active.value}
                                                    min={dashboardData.power.active.min}
                                                    max={dashboardData.power.active.max}
                                                    unit={dashboardData.power.active.unit}
                                                    color="green"
                                                />
                                            </div>
                                            <div className="col-md-4 data-card">
                                                <GaugeCard
                                                    title="REACTIVE POWER"
                                                    value={dashboardData.power.reactive.value}
                                                    min={dashboardData.power.reactive.min}
                                                    max={dashboardData.power.reactive.max}
                                                    unit={dashboardData.power.reactive.unit}
                                                    color="orange"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Energy Section */}
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={Battery} title="Energy (Import)" color="indigo" />
                                        <div className="row g-3">
                                            <div className="col-md-6 data-card">
                                                <EnergyCircle
                                                    title="ACTIVE IMPORT"
                                                    value={dashboardData.energy.activeImport.value}
                                                    
                                                    
                                                    color="green"
                                                />
                                            </div>
                                        
                                            <div className="col-md-6 data-card">
                                                <EnergyCircle
                                                    title="APPARENT IMPORT"
                                                    value={dashboardData.energy.apparentImport.value}
                                                  
                                                   
                                                    color="blue"
                                                />
                                            </div>
                                           
                                        </div>
                                    </div>
                                </div>

                                {/* System Metrics Section */}
                                <div className="col-lg-6" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        height: '100%'
                                    }}>
                                        <SectionHeader icon={TrendingUp} title="System Metrics" color="pink" />
                                        <div className="row g-3">
    <div className="col-md-6 data-card">
  <PowerFactorGauge
    value={dashboardData.systemMetrics.powerFactor.value}
    label={dashboardData.systemMetrics.powerFactor.value >= 0 ? 'LG' : 'LD'}
  />
</div>
                                  
                                        
                                            <div className="col-md-6 data-card">
<FrequencyGauge value={dashboardData.systemMetrics.frequency.value} />

</div>

                                        </div>
                                    </div>
                                </div>
                            </div>





                            {/* Power Section */}



                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </main>
    );
};

export default Dashboard;