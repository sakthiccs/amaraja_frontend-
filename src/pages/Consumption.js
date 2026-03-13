import { useState,useRef  } from "react";
import SideNavbar from "../components/sidenavbar";
import Topbar from "../components/topbar";
import { Calendar, Clock, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toJpeg } from "html-to-image";


const API_BASE_URL = "https://ARCSPLEMapi.genuineitsolution.com";

const Consumption = () => {
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [currentMonth] = useState(new Date());
  const [timeInterval, setTimeInterval] = useState("30 minutes");
    const [selectedParameter, setSelectedParameter] = useState("Active_Import_KWh");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
      const [sidebarOpen, setSidebarOpen] = useState(false);
      const chartRef = useRef(null);


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const timeIntervals = [
    "10 sec",
    "30 sec",
    "1 min",
    "5 min",
    "15 min",
    "30 min",
    "1 hour",
  ];


const parameters = [
  { value: "Active_Import_KWh", label: "Active Import (kWh)" },
  { value: "Active_Import_KVAh", label: "Apparent Import (kVAh)" },
];


const parameterColors = {
  Active_Import_KWh: "#06b6d4",
  Active_Import_KVAh: "#a855f7",
};


const downloadChartImage = () => {
  if (!chartRef.current) return;

  toJpeg(chartRef.current, { quality: 0.95 })
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `consumption_chart_${Date.now()}.jpeg`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => console.error("Image Export Error:", err));
};

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

const handleDateClick = (day) => {
  const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

  // Case 1: no start date selected yet
  if (!selectedRange.start) {
    setSelectedRange({ start: clickedDate, end: null });
    return;
  }

  // Case 2: both start & end already exist → reset and start fresh
  if (selectedRange.start && selectedRange.end) {
    setSelectedRange({ start: clickedDate, end: null });
    return;
  }

  // Case 3: selecting the end date
  if (clickedDate < selectedRange.start) {
    setSelectedRange({ start: clickedDate, end: selectedRange.start });
  } else {
    setSelectedRange({ ...selectedRange, end: clickedDate });
  }
};

const formatDateTime = (date) => {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = "00";
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss}`;
};

  const generateTimeSlots = (start, end, seconds) => {
    const slots = [];
    let curr = new Date(start);
    while (curr <= end) {
      slots.push(new Date(curr));
      curr = new Date(curr.getTime() + seconds * 1000);
    }
    return slots;
  };


const handleShowConsumption = async () => {
  if (!selectedRange.start || !selectedRange.end) {
    alert("Please select a start and end date!");
    return;
  }


  // PROTECTIVE FILTER: avoid raw meter spike values


  const from = formatDateTime(selectedRange.start);
  const to = formatDateTime(selectedRange.end);
const param = selectedParameter;

  const intervalMap = {
    "10 sec": 10,
    "30 sec": 30,
    "1 min": 60,
    "5 min": 300,
    "15 min": 900,
    "30 min": 1800,
    "1 hour": 3600,
  };

  const intervalSeconds = intervalMap[timeInterval] || 30;

  try {
    setLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/api/Meter/consumption?from=${from}&to=${to}&param=${param}&interval=${intervalSeconds}`
    );

    let apiData = await res.json();

    // MAKE API MAP
    const mapped = {};
    apiData.forEach((d) => {
      mapped[new Date(d.intervalStart).getTime()] = d;
    });

    const sortedApiTimes = Object.keys(mapped)
      .map((t) => parseInt(t))
      .sort((a, b) => a - b);

    // CREATE TIME SLOTS
    const slots = generateTimeSlots(
      selectedRange.start,
      selectedRange.end,
      intervalSeconds
    );

    // FIND LATEST API READING BEFORE START RANGE
    let prevReading = null;
    for (let i = 0; i < sortedApiTimes.length; i++) {
      if (sortedApiTimes[i] < selectedRange.start.getTime()) {
        prevReading = mapped[sortedApiTimes[i]];
      }
    }

    // INITIAL PREVIOUS VALUES (NULL allowed)
    let prevKWh = prevReading?.active_Import_KWh ?? null;
    let prevKVAh = prevReading?.active_Import_KVAh ?? null;

    // FIXED: BEST-NEAREST MATCHING (ALWAYS PICK LAST BEFORE SLOT)
   const findNearest = (slot) => {
  const slotMs = slot.getTime();

  // find the latest timestamp <= slot
  for (let i = sortedApiTimes.length - 1; i >= 0; i--) {
    if (sortedApiTimes[i] <= slotMs) {
      return mapped[sortedApiTimes[i]];
    }
  }
  return null;
};

    let finalData = [];

slots.forEach((slotTime) => {
  const nearest = findNearest(slotTime);

// DIFF CALCULATION (FIXED)
let consumptionKWh = 0;
let consumptionKVAh = 0;

if (nearest) {
  // Using cumulative values
  if (nearest.active_Import_KWh != null && prevKWh != null) {
    consumptionKWh = nearest.active_Import_KWh - prevKWh;
  }
  if (nearest.active_Import_KVAh != null && prevKVAh != null) {
    consumptionKVAh = nearest.active_Import_KVAh - prevKVAh;
  }

  // Update previous cumulative values
  prevKWh = nearest.active_Import_KWh ?? prevKWh;
  prevKVAh = nearest.active_Import_KVAh ?? prevKVAh;
}

// Prevent negative & unrealistic spikes
if (consumptionKWh < 0) consumptionKWh = 0;
if (consumptionKVAh < 0) consumptionKVAh = 0;

// Final row
finalData.push({
  time: slotTime.toLocaleString(),
  Active_Import_KWh: Number(consumptionKWh.toFixed(3)),
  Active_Import_KVAh: Number(consumptionKVAh.toFixed(3)),
});

}

);

    setChartData(finalData);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    setLoading(false);
  }
};






  
  
  const isInRange = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!selectedRange.start) return false;
    if (selectedRange.start && !selectedRange.end)
      return date.getTime() === selectedRange.start.getTime();
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const renderCalendar = () => {
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
    const cells = [];

    weekDays.forEach((day, i) => {
      cells.push(
        <div
          key={`header-${i}`}
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#9ca3af",
            fontWeight: 600,
          }}
        >
          {day}
        </div>
      );
    });

    

    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isInRange(day);
      cells.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            padding: 8,
            textAlign: "center",
            borderRadius: "50%",
            cursor: "pointer",
            color: selected ? "#fff" : "#e5e7eb",
            backgroundColor: selected ? "#06b6d4" : "transparent",
            transition: "0.2s",
          }}
        >
          {day}
        </div>
      );
    }
    return cells;
  };



  return (
    <main className="container-wrapper page-alerts">
         <Topbar onToggleSidebar={toggleSidebar} />

      <div className="container-fluid page-body-wrapper">
            <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />


        <div className="main-panel">
     <div
  className="content-wrapper"
  style={{
    background: "#f9fafb",
    minHeight: "100vh",
    padding: 24,
  }}
>
       <div
  className="consumption-layout"
  style={{
    display: "flex",
    gap: 24,
    flexWrap: "nowrap",
    alignItems: "stretch",  // ⭐ FIX
  }}
>

              {/* Left Panel */}
              <div
      className="consumption-sidebar"
      style={{
        flex: "0 0 400px",
        background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
        border: "1px solid #374151",
        borderRadius: 12,
        padding: 20,
      }}
    >
                <div style={{ background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
border: "1px solid #374151"
, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Calendar color="#06b6d4" />
                    <h3 style={{ color: "#fff", fontSize: 16 }}>Select Date Range</h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {renderCalendar()}
                  </div>
             <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
  From: {selectedRange.start ? formatDateTime (selectedRange.start) : "--"} <br />
  To: {selectedRange.end ? formatDateTime (selectedRange.end) : "--"}
</p>

                </div>


                <div style={{ background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
border: "1px solid #374151"
, borderRadius: 12, padding: 20, marginBottom: 20 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
    <Calendar color="#06b6d4" />
    <h3 style={{ color: "#fff", fontSize: 16 }}>Select Date Range</h3>
  </div>

  <div className="d-flex gap-3 align-items-center">
    <div>
      <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>
        From (Date & Time)
      </label>
      <DatePicker
        selected={selectedRange.start}
        onChange={(date) => setSelectedRange({ ...selectedRange, start: date })}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="dd/MM/yyyy HH:mm"
        placeholderText="Select start date & time"
        className="form-control"
      />
    </div>
    <div>
      <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>
        To (Date & Time)
      </label>
      <DatePicker
        selected={selectedRange.end}
        onChange={(date) => setSelectedRange({ ...selectedRange, end: date })}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="dd/MM/yyyy HH:mm"
        placeholderText="Select end date & time"
        className="form-control"
      />
    </div>
  </div>

  <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
    From: {selectedRange.start ? selectedRange.start.toLocaleString() : "--"} <br />
    To: {selectedRange.end ? selectedRange.end.toLocaleString() : "--"}
  </p>
</div>

{/* 🔽 Parameter Selection */}
<div
  style={{
    background:
      "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
    border: "1px solid #374151",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    }}
  >
    <BarChart3 color="#06b6d4" />
    <h3 style={{ color: "#fff", fontSize: 16, margin: 0 }}>
      Select Parameter
    </h3>
  </div>

  <select
    value={selectedParameter}
    onChange={(e) => setSelectedParameter(e.target.value)}
    style={{
      width: "100%",
      padding: "10px 12px",
      background: "#2d3748",
      color: "#fff",
      border: "1px solid #374151",
      borderRadius: 6,
    }}
  >
    {parameters.map((p) => (
      <option key={p.value} value={p.value}>
        {p.label}
      </option>
    ))}
  </select>
</div>


<button
  onClick={downloadChartImage}
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
  Export Image (JPEG)
</button>





                <div style={{ background: "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
border: "1px solid #374151"
, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Clock color="#06b6d4" />
                    <label style={{ color: "#e5e7eb" }}>Time Interval</label>
                  </div>
                  <select
                    value={timeInterval}
                    onChange={(e) => setTimeInterval(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#2d3748",
                      color: "#fff",
                      border: "1px solid #374151",
                      borderRadius: 6,
                    }}
                  >
                    {timeIntervals.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleShowConsumption}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "#06b6d4",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Loading..." : (
                    <>
                      <BarChart3 style={{ width: 18, height: 18, marginRight: 6 }} />
                      Show Consumption
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel - Fixed beside left panel */}
            <div
  className="consumption-chart"
   ref={chartRef}
  style={{
    flex: 1,
    background:
      "linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(15,58,83,1) 100%)",
    border: "1px solid #374151",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
   
  }}
>
  <h3 style={{ color: "#fff", marginBottom: 20 }}>
    Energy Consumption
  </h3>

  {chartData.length > 0 ? (
    <div style={{
  flex: 1,
  overflowX: "auto",   // ⬅️ Only horizontal scroll
  overflowY: "hidden", // ⬅️ Prevent vertical scroll
  minHeight: 0,
  whiteSpace: "nowrap" // ⬅️ Prevent wrapping
}}>

      <div
        style={{
          display: "inline-block",
          minWidth: Math.max(800, chartData.length * 120),
          height: 500,
        }}
      >
   <LineChart 
  data={chartData} 
  width={Math.max(800, chartData.length * 100)} 
  height={500}
>
  <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
  <XAxis 
    dataKey="time" 
    stroke="#9ca3af"
    angle={-45}
    textAnchor="end"
    height={80}
    interval={0}
    tick={{ fontSize: 12 }}
  />
  <YAxis stroke="#9ca3af" />
  <Tooltip
    formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]}
    contentStyle={{
      background: "#111827",
      border: "1px solid #374151",
      color: "#fff",
    }}
  />
  <Legend />

  {/* ⭐ ONLY ONE LINE BASED ON SELECTED PARAMETER */}
  <Line
    type="monotone"
    dataKey={selectedParameter}
    stroke={parameterColors[selectedParameter]}
    strokeWidth={2}
    dot={false}
    name={parameters.find(p => p.value === selectedParameter)?.label}
  />

</LineChart>


                     </div>
    </div>
  ) : (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
      }}
    >
      <p>{loading ? "Fetching data..." : "No data to display."}</p>
    </div>
  )}
</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Consumption;