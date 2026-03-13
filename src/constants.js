import React, { useState } from 'react';
import { BarChart3, Zap, TrendingUp, FileText, Settings, Calendar, Clock, Download, Activity, Power, Battery, Gauge, Menu, X } from 'lucide-react';

// ============================================
// CONSTANTS.JS - Data Constants
// ============================================
export const PARAMETERS = {
  powerFactor: { label: 'Power Factor', value: 0.00, unit: '', max: 1 },
  yPhaseVoltage: { label: 'Y Phase Voltage', value: 0.00, unit: 'V', max: 33000 },
  yPhaseCurrent: { label: 'Y Phase Current', value: 0.00, unit: 'A', max: 500 },
  avgPhaseVoltage: { label: 'Avg Phase Voltage', value: 0.00, unit: 'V', max: 33000 },
  activeImport: { label: 'Active Import', value: 0.00, unit: 'kW', max: 2000000 },
  activeExport: { label: 'Active Export', value: 0.00, unit: 'kW', max: 2000000 },
  v1v2Voltage: { label: 'V1-V2 Voltage', value: 0.00, unit: 'V', max: 35000 },
  v2v3Voltage: { label: 'V2-V3 Voltage', value: 0.00, unit: 'V', max: 35000 },
  rPhaseVoltage: { label: 'R Phase Voltage', value: 0.00, unit: 'V', max: 33000 },
  bPhaseVoltage: { label: 'B Phase Voltage', value: 0.00, unit: 'V', max: 33000 },
  v3v1Voltage: { label: 'V3-V1 Voltage', value: 0.00, unit: 'V', max: 35000 },
  rPhaseCurrent: { label: 'R Phase Current', value: 0.00, unit: 'A', max: 500 },
  bPhaseCurrent: { label: 'B Phase Current', value: 0.00, unit: 'A', max: 500 },
  reactivePower: { label: 'Reactive Power', value: 0.00, unit: 'kVAR', max: 10000 },
  frequency: { label: 'Frequency', value: 0.00, unit: 'Hz', max: 65 },
  activePower: { label: 'Active Power', value: 0.00, unit: 'kW', max: 10000 },
  apparentPower: { label: 'Apparent Power', value: 0.00, unit: 'kVA', max: 12000 },
  activeImportKVAH: { label: 'Active Import KVAH', value: 0.00, unit: 'kVAh', max: 2000000 },
  activeExportKVAH: { label: 'Active Export KVAH', value: 0.00, unit: 'kVAh', max: 2000000 }
};

export const REPORT_PARAMETERS = [
  { id: 'powerFactor', label: 'Power Factor' },
  { id: 'yPhaseVoltage', label: 'Y Phase Voltage' },
  { id: 'yPhaseCurrent', label: 'Y Phase Current' },
  { id: 'avgPhaseVoltage', label: 'Avg Phase Voltage' },
  { id: 'activeImport', label: 'Active Import' },
  { id: 'activeExport', label: 'Active Export' },
  { id: 'v1v2Voltage', label: 'V1-V2 Voltage' },
  { id: 'v2v3Voltage', label: 'V2-V3 Voltage' },
  { id: 'rPhaseVoltage', label: 'R Phase Voltage' },
  { id: 'bPhaseVoltage', label: 'B Phase Voltage' },
  { id: 'v3v1Voltage', label: 'V3-V1 Voltage' },
  { id: 'rPhaseCurrent', label: 'R Phase Current' },
  { id: 'bPhaseCurrent', label: 'B Phase Current' },
  { id: 'reactivePower', label: 'Reactive Power' },
  { id: 'frequency', label: 'Frequency' },
  { id: 'activePower', label: 'Active Power' },
  { id: 'apparentPower', label: 'Apparent Power' }
];

export const INTERVALS = ['1 min', '5 min', '15 min', '30 min', '1 hour'];

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'reading', label: 'Reading', icon: Zap },
  { id: 'consumption', label: 'Consumption', icon: Calendar },
  { id: 'trend', label: 'Trend', icon: TrendingUp },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'analysis', label: 'Analysis', icon: Settings }
];