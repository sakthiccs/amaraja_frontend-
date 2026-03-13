import logo from "../assets/images/logo.jpg";
import "../assets/css/topbar.css";
import { useEffect, useState, useRef } from "react";
import { Menu } from "lucide-react"; // Hamburger icon

const Topbar = ({ onToggleSidebar }) => {
  const [time, setTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [hasValidData, setHasValidData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 🕒 Live time updater
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🌐 WebSocket Connection + Status
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        if (wsRef.current) wsRef.current.close();
        const ws = new WebSocket("wss://ARCSPLEMapi.genuineitsolution.com/ws");

        ws.onopen = () => {
          setIsConnected(true);
          if (reconnectTimeoutRef.current)
            clearTimeout(reconnectTimeoutRef.current);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const allZero =
              (!data.r_Phase_Voltage ||
                parseFloat(data.r_Phase_Voltage) === 0) &&
              (!data.y_Phase_Voltage ||
                parseFloat(data.y_Phase_Voltage) === 0) &&
              (!data.b_Phase_Voltage ||
                parseFloat(data.b_Phase_Voltage) === 0);
            setHasValidData(!allZero);
            setLastUpdated(new Date());
          } catch (err) {
            console.error("Error parsing WS data:", err);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
        wsRef.current = ws;
      } catch {
        setIsConnected(false);
      }
    };

    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // 🟢 Status logic
  let connectionLabel = "🔴 Disconnected";
  let connectionColor = "#ef4444";

  if (isConnected && hasValidData) {
    connectionLabel = "🟢 Connected";
    connectionColor = "#10b981";
  } else if (isConnected && !hasValidData) {
    connectionLabel = "⚠️ No Data from Energy Meter";
    connectionColor = "#facc15";
  }

  const formattedDate = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <nav
      className="navbar fixed-top d-flex justify-content-between align-items-center px-3 flex-wrap"
      style={{
        background: "#06121a",
        height: "90px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 1500,
      }}
    >
      {/* ✅ Left - Logo + Hamburger */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn text-white d-lg-none"
          onClick={onToggleSidebar}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          <Menu />
        </button>

        <a className="navbar-brand brand-logo" href="#">
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "50px",
              width: "auto",
              objectFit: "contain",
            }}
          />
        </a>
      </div>

      {/* ✅ Right - Connection & Last Updated */}
      <div
        className="topbar-status text-end"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          flex: "1",
          minWidth: "200px",
          paddingRight: "15px",
        }}
      >
        <div
          style={{
            background: connectionColor,
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "6px",
            minWidth: "200px",
            textAlign: "center",
            animation:
              connectionLabel === "⚠️ No Data from Energy Meter"
                ? "pulse 1.5s infinite"
                : "none",
          }}
        >
          {connectionLabel}
        </div>

        <div style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.3" }}>
          <span style={{ color: "#fff", fontWeight: "500" }}>Last Updated:</span>{" "}
          <span style={{ color: "#fff", fontWeight: "600" }}>
            {lastUpdated
              ? `${lastUpdated.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })} | ${lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : `${formattedDate} | ${formattedTime}`}
          </span>
        </div>
      </div>

      {/* 🔄 Pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }

          @media (max-width: 768px) {
            .navbar {
              flex-direction: row;
              justify-content: space-between !important;
              height: auto !important;
              padding-top: 10px;
              padding-bottom: 10px;
            }

            .topbar-status {
              width: 100%;
              align-items: flex-end !important;
              text-align: right !important;
              margin-top: 5px;
            }
          }
        `}
      </style>
    </nav>
  );
};

export default Topbar;
