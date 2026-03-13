import { setConnectionStatus, updateDashboardData } from "../slicer/dashboardSlice";

let ws = null;
let reconnectTimer = null;

export const connectWebSocket = () => (dispatch) => {
  if (ws) ws.close();

  ws = new WebSocket("wss://ARCSPLEMapi.genuineitsolution.com/ws");

  ws.onopen = () => {
    console.log("✅ WebSocket connected");
    dispatch(setConnectionStatus(true));
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      dispatch(updateDashboardData(data));
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    dispatch(setConnectionStatus(false));
  };

  ws.onclose = () => {
    console.warn("🔌 Disconnected, retrying in 3s...");
    dispatch(setConnectionStatus(false));
    reconnectTimer = setTimeout(() => {
      dispatch(connectWebSocket());
    }, 3000);
  };
};
