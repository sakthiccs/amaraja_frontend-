//D:\ccs\Project\React JS\AccessControlPOCFrontEnd\src\App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Suspense, lazy } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import store from "./redux/store/store";
import './assets/css/style.css';
import '../src/style.css';
import { ToastContainer } from 'react-toastify';
import "./assets/css/mobile.css"
// Lazy load components
const Login = lazy(() => import("./pages/login"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const Reading = lazy(() => import("./pages/Reading"));
const Consumption = lazy(() => import("./pages/Consumption"));
const Trend = lazy(() => import("./pages/Trend"));
const Report = lazy(() => import("./pages/Report"));


function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Router>
          <Suspense fallback={<div className="text-center mt-5">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/Dashboard" element={<DashboardPage />} />
              <Route path="/Reading" element={<Reading />} />
              <Route path="/Consumption" element={<Consumption />} />
              <Route path="/Trend" element={<Trend />} />
              <Route path="/Report" element={<Report />} />
            </Routes>
          </Suspense>
        </Router>
        <ToastContainer />
      </div>
    </Provider>
  );
}

export default App;
