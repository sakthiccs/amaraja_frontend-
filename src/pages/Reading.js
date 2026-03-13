import { useState, useEffect, useRef } from 'react';
import SideNavbar from '../components/sidenavbar';
import Topbar from '../components/topbar';
import { Zap, Activity, Square, Gauge, Droplet, BarChart3, Wrench } from 'lucide-react';

const Reading = () => {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
        const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const [dashboardData, setDashboardData] = useState({
        rybVoltages: { rPhase: 0, yPhase: 0, bPhase: 0 },
        rybCurrents: { rPhase: 0, yPhase: 0, bPhase: 0 },
        voltageBetweenPhases: { v1v2: 0, v2v3: 0, v3v1: 0 },
        power: { apparent: 0, resistive: 0, reactive: 0 },
        energy: {
            activeImportKW: 0,
            activeExportKW: 0,
            activeImportKVAH: 0,
            activeExportKVAH: 0
        },
        systemMetrics: { powerFactor: 0, avgPhaseVoltage: 0, frequency: 0 },
        activePower: 0
    });


   
    // WebSocket connection
    const connectWebSocket = () => {
        try {
            if (wsRef.current) wsRef.current.close();

            const ws = new WebSocket("wss://ARCSPLEMapi.genuineitsolution.com/ws");

            ws.onopen = () => {
                console.log("✅ WebSocket Connected (Reading Page)");
                setIsConnected(true);
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            };

            ws.onmessage = (event) => {
                try {
                    const rawData = JSON.parse(event.data);
                    console.log("📡 Reading Data Received:", rawData);

                    const mappedData = {
                        rPhaseV: parseFloat(rawData.r_Phase_Voltage) || 0,
                        yPhaseV: parseFloat(rawData.y_Phase_Voltage) || 0,
                        bPhaseV: parseFloat(rawData.b_Phase_Voltage) || 0,

                        rPhaseA: parseFloat(rawData.r_Phase_Current) || 0,
                        yPhaseA: parseFloat(rawData.y_Phase_Current) || 0,
                        bPhaseA: parseFloat(rawData.b_Phase_Current) || 0,

                        v1v2: parseFloat(rawData.v1_V2_Phase_Voltage) || 0,
                        v2v3: parseFloat(rawData.v2_V3_Phase_Voltage) || 0,
                        v3v1: parseFloat(rawData.v3_V1_Phase_Voltage) || 0,

                        apparentPower: parseFloat(rawData.apperent_Power) || 0,
                        resistivePower: parseFloat(rawData.resistive_Power) || 0,
                        reactivePower: parseFloat(rawData.react_Power) || 0,

                        activeImportKW: parseFloat(rawData.active_Import_KWh) || 0,
                        activeExportKW: parseFloat(rawData.active_Export_KWh) || 0,
                        activeImportKVAH: parseFloat(rawData.active_Import_KVAh) || 0,
                        activeExportKVAH: parseFloat(rawData.active_Export_KVAh) || 0,

 powerFactor:
  rawData.apperent_Power && parseFloat(rawData.apperent_Power) !== 0
    ? parseFloat(rawData.active_Power_KW) / parseFloat(rawData.apperent_Power)
    : 0,

                              avgPhaseVoltage: parseFloat(rawData.avg_Phase_Voltage_In_Percent) || 0,
                        frequency: parseFloat(rawData.freqency) || 0,
                        activePower: parseFloat(rawData.active_Power_KW) || 0
                    };

                    setDashboardData({
                        rybVoltages: {
                            rPhase: mappedData.rPhaseV,
                            yPhase: mappedData.yPhaseV,
                            bPhase: mappedData.bPhaseV
                        },
                        rybCurrents: {
                            rPhase: mappedData.rPhaseA,
                            yPhase: mappedData.yPhaseA,
                            bPhase: mappedData.bPhaseA
                        },
                        voltageBetweenPhases: {
                            v1v2: mappedData.v1v2,
                            v2v3: mappedData.v2v3,
                            v3v1: mappedData.v3v1
                        },
                        power: {
                            apparent: mappedData.apparentPower,
                            resistive: mappedData.resistivePower,
                            reactive: mappedData.reactivePower
                        },
                        energy: {
                            activeImportKW: mappedData.activeImportKW,
                            activeExportKW: mappedData.activeExportKW,
                            activeImportKVAH: mappedData.activeImportKVAH,
                            activeExportKVAH: mappedData.activeExportKVAH
                        },
                        systemMetrics: {
                            powerFactor: mappedData.powerFactor,
                            avgPhaseVoltage: mappedData.avgPhaseVoltage,
                            frequency: mappedData.frequency
                        },
                        activePower: mappedData.activePower
                    });

                    setLastUpdated(new Date());
                } catch (err) {
                    console.error("❌ Parsing error:", err);
                }
            };

            ws.onerror = (err) => {
                console.error("❌ WebSocket Error:", err);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log("🔌 WebSocket Disconnected (Reading Page)");
                setIsConnected(false);
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log("🔄 Reconnecting WebSocket...");
                    connectWebSocket();
                }, 3000);
            };

            wsRef.current = ws;
        } catch (err) {
            console.error("❌ WebSocket Connection Failed:", err);
            setIsConnected(false);
        }
    };

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

  const DataRow = ({ label, value, unit }) => {
  let numericValue = parseFloat(value);
  if (isNaN(numericValue)) numericValue = 0;

  let displayValue = numericValue;
  let displayUnit = unit;
   let pfStatus = "";

  if (unit === "V" && numericValue >= 1000) {
    displayValue = numericValue / 1000;
    displayUnit = "kV";
  }

if (label === "Power Factor") {

    let pfRaw = numericValue;   
    let pfDisplay = 0;
    let pfLabel = "";

    // PF 0–1 → Lag
    if (pfRaw <= 1) {
        pfLabel = " Lag";
        pfDisplay = pfRaw;   // keep number
    }

    // PF > 1 → Lead (Ungal Logic)
    else {
        const step1 = pfRaw - 1;       
        const step2 = 1 - step1;       
        pfDisplay = -step2;            // keep number
        pfLabel = " Lead";
    }

    displayValue = pfDisplay;   // 🔥 DO NOT USE toFixed HERE
    pfStatus = pfLabel;
}



  


  const formattedValue = displayValue.toFixed(2);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #2d3748',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d3748')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ color: '#e5e7eb', fontSize: '14px' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
        {formattedValue} {displayUnit}{pfStatus}
      </span>
    </div>
  );
};



    const SectionCard = ({ icon: Icon, title, iconColor, children }) => (
        <div style={{
            background: '#1a202c',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #2d3748',
            marginBottom: '16px'
        }}>
            <div style={{
                background: '#2d3748',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <Icon style={{ width: '18px', height: '18px', color: iconColor }} />
                <h3 style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: 0
                }}>{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <main className='container-wrapper page-alerts'>
                <Topbar onToggleSidebar={toggleSidebar} />


            <div className="container-fluid page-body-wrapper">
                    <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />


                <div className="main-panel">
                    <div className="content-wrapper" style={{ background: '#ffffff', minHeight: '100vh' }}>
                        {/* Connection Status */}
                        <div style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 1000,
                            background: isConnected ? '#10b981' : '#ef4444',
                            color: 'white',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            {lastUpdated && (
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                    Updated: {lastUpdated.toLocaleTimeString()}
                                </div>
                            )}
                        </div>

                        <div className="container-fluid">
                            <div className="row">
                                {/* Left Column */}
                                <div className="col-lg-6">
                                    <SectionCard icon={Zap} title="RYB Voltages" iconColor="#f59e0b">
                                        <DataRow label="R Phase Voltage" value={dashboardData.rybVoltages.rPhase} unit="V" />
                                        <DataRow label="Y Phase Voltage" value={dashboardData.rybVoltages.yPhase} unit="V" />
                                        <DataRow label="B Phase Voltage" value={dashboardData.rybVoltages.bPhase} unit="V" />
                                    </SectionCard>

                                    <SectionCard icon={Square} title="Voltage Between Phases" iconColor="#8b5cf6">
                                        <DataRow label=" R–Y Voltage" value={dashboardData.voltageBetweenPhases.v1v2} unit="V" />
                                        <DataRow label=" Y–B Voltage" value={dashboardData.voltageBetweenPhases.v2v3} unit="V" />
                                        <DataRow label="B–R Voltage" value={dashboardData.voltageBetweenPhases.v3v1} unit="V" />
                                    </SectionCard>

                                    <SectionCard icon={Droplet} title="Energy (Import)" iconColor="#3b82f6">
                                        <DataRow label="Active Import KW" value={dashboardData.energy.activeImportKW} unit="kWh" />
                                        <DataRow label="Apparent Import KVAH" value={dashboardData.energy.activeImportKVAH} unit="kVAh" />
                                    </SectionCard>

                                
                                </div>

                                {/* Right Column */}
                                <div className="col-lg-6">
                                    <SectionCard icon={Activity} title="RYB Currents" iconColor="#f59e0b">
                                        <DataRow label="R Phase Current" value={dashboardData.rybCurrents.rPhase} unit="A" />
                                        <DataRow label="Y Phase Current" value={dashboardData.rybCurrents.yPhase} unit="A" />
                                        <DataRow label="B Phase Current" value={dashboardData.rybCurrents.bPhase} unit="A" />
                                    </SectionCard>

                                    <SectionCard icon={Gauge} title="Power" iconColor="#10b981">
                                        <DataRow label="Apparent Power" value={dashboardData.power.apparent} unit="kVA" />
                                        <DataRow label="Active Power" value={dashboardData.power.resistive} unit="kW" />
                                        <DataRow label="Reactive Power" value={dashboardData.power.reactive} unit="kVAR" />
                                    </SectionCard>

                                    <SectionCard icon={BarChart3} title="System Metrics" iconColor="#6366f1">
                                        <DataRow label="Power Factor" value={dashboardData.systemMetrics.powerFactor} unit="" />
                                        <DataRow label="Frequency" value={dashboardData.systemMetrics.frequency} unit="Hz" />
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Reading;
