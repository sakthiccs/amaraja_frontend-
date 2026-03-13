import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isConnected: false,
  dashboardData: {
    voltage: {
      rPhase: { value: 0, min: 0, max: 33000, unit: 'V' },
      yPhase: { value: 0, min: 0, max: 33000, unit: 'V' },
      bPhase: { value: 0, min: 0, max: 33000, unit: 'V' }
    },
    current: {
      rPhase: { value: 0, min: 0, max: 500, unit: 'A' },
      yPhase: { value: 0, min: 0, max: 500, unit: 'A' },
      bPhase: { value: 0, min: 0, max: 500, unit: 'A' }
    },
    voltageBetweenPhases: {
      v1v2: { value: 0, min: 0, max: 35000, unit: 'V' },
      v2v3: { value: 0, min: 0, max: 35000, unit: 'V' },
      v3v1: { value: 0, min: 0, max: 35000, unit: 'V' }
    },
    power: {
      apparent: { value: 0, min: 0, max: 12000, unit: 'kVA' },
      active: { value: 0, min: 0, max: 10000, unit: 'kW' },
      reactive: { value: 0, min: 0, max: 10000, unit: 'kVAR' }
    },
    energy: {
      activeImport: { value: 0, min: 0, max: 5000000, unit: 'kWh' },
      activeExport: { value: 0, min: 0, max: 500000, unit: 'kWh' },
      apparentImport: { value: 0, min: 0, max: 5000000, unit: 'kVAh' },
      apparentExport: { value: 0, min: 0, max: 500000, unit: 'kVAh' }
    },
    systemMetrics: {
      powerFactor: { value: 0, min: 0, max: 1, unit: '' },
      avgPhaseVoltage: { value: 0, min: 0, max: 110, unit: '%' },
      frequency: { value: 0, min: 42, max: 65, unit: 'Hz' }
    }
  }
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    updateDashboardData: (state, action) => {
      const data = action.payload;
      // Assign values safely
      state.dashboardData.voltage.rPhase.value = parseFloat(data.r_Phase_Voltage) || 0;
      state.dashboardData.voltage.yPhase.value = parseFloat(data.y_Phase_Voltage) || 0;
      state.dashboardData.voltage.bPhase.value = parseFloat(data.b_Phase_Voltage) || 0;
      state.dashboardData.current.rPhase.value = parseFloat(data.r_Phase_Current) || 0;
      state.dashboardData.current.yPhase.value = parseFloat(data.y_Phase_Current) || 0;
      state.dashboardData.current.bPhase.value = parseFloat(data.b_Phase_Current) || 0;
      state.dashboardData.voltageBetweenPhases.v1v2.value = parseFloat(data.v1_V2_Phase_Voltage) || 0;
      state.dashboardData.voltageBetweenPhases.v2v3.value = parseFloat(data.v2_V3_Phase_Voltage) || 0;
      state.dashboardData.voltageBetweenPhases.v3v1.value = parseFloat(data.v3_V1_Phase_Voltage) || 0;
      state.dashboardData.power.apparent.value = parseFloat(data.apperent_Power) || 0;
      state.dashboardData.power.active.value = parseFloat(data.active_Power_KW) || 0;
      state.dashboardData.power.reactive.value = parseFloat(data.react_Power) || 0;
      state.dashboardData.energy.activeImport.value = parseFloat(data.active_Import_KWh) || 0;
      state.dashboardData.energy.activeExport.value = parseFloat(data.active_Export_KWh) || 0;
      state.dashboardData.energy.apparentImport.value = parseFloat(data.active_Import_KVAh) || 0;
      state.dashboardData.energy.apparentExport.value = parseFloat(data.active_Export_KVAh) || 0;
      state.dashboardData.systemMetrics.powerFactor.value = parseFloat(data.power_Factor) || 0;
      state.dashboardData.systemMetrics.avgPhaseVoltage.value = parseFloat(data.avg_Phase_Voltage_In_Percent) || 0;
      state.dashboardData.systemMetrics.frequency.value = parseFloat(data.freqency) || 0;
    }
  }
});

export const { setConnectionStatus, updateDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
