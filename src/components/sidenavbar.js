import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../assets/css/navbar.css";
import { MdDashboard } from "react-icons/md";
import { FaTachometerAlt } from "react-icons/fa";
import { MdEnergySavingsLeaf } from "react-icons/md";
import { FaArrowTrendUp } from "react-icons/fa6";
import { TbReport } from "react-icons/tb";
import { BiLogOutCircle } from "react-icons/bi";

const SideNavbar = ({ isSidebarOpen, onToggleSidebar }) => {
  const location = useLocation();
  const [openConfig, setOpenConfig] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isConfigSubmenuActive = ["/DeviceMapping", "/Device", "/Seat"].some(
    isActive
  );

  useEffect(() => {
    if (isConfigSubmenuActive) setOpenConfig(true);
  }, [isConfigSubmenuActive]);

  return (
    <>
      <nav
        id="sidebar"
        className={`sidebar sidebar-offcanvas ${isSidebarOpen ? "active" : ""}`}
      >
        <ul className="nav">
          <li className={`nav-item ${isActive("/Dashboard") ? "active" : ""}`}>
            <Link className="nav-link" to="/Dashboard" onClick={onToggleSidebar}>
              <MdDashboard />
              <span className="menu-title ms-2">Dashboard</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive("/Reading") ? "active" : ""}`}>
            <Link className="nav-link" to="/Reading" onClick={onToggleSidebar}>
              <FaTachometerAlt />
              <span className="menu-title ms-2">Reading</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive("/Consumption") ? "active" : ""}`}>
            <Link className="nav-link" to="/Consumption" onClick={onToggleSidebar}>
              <MdEnergySavingsLeaf />
              <span className="menu-title ms-2">Consumption</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive("/Trend") ? "active" : ""}`}>
            <Link className="nav-link" to="/Trend" onClick={onToggleSidebar}>
              <FaArrowTrendUp />
              <span className="menu-title ms-2">Trend</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive("/Report") ? "active" : ""}`}>
            <Link className="nav-link" to="/Report" onClick={onToggleSidebar}>
              <TbReport />
              <span className="menu-title ms-2">Report</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive("/Login") ? "active" : ""}`}>
            <Link className="nav-link" to="/Login" onClick={onToggleSidebar}>
              <BiLogOutCircle />
              <span className="menu-title ms-2">Logout</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Overlay for mobile */}
      <div
        className={`mobile-overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={onToggleSidebar}
      ></div>
    </>
  );
};

export default SideNavbar;
