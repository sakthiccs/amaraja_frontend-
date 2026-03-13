import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card } from "react-bootstrap";
import SideNavbar from "../components/sidenavbar";
import Topbar from "../components/topbar";
import "../assets/css/employees.css";
import AddEmployeeModal from "../modelpopups/addEmployeeModal";
import { fetchEmployeesData } from "../redux/Action/Employefetchaction";
import emp_image from "../assets/images/employee.png";

const Employees = () => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await dispatch(fetchEmployeesData()).unwrap();
                if (response) {
                    setEmployees(response);
                } else {
                    console.error("No employee data found in API response");
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
            }
        };

        fetchData();
    }, [dispatch]);

    const handleEmployeeAdded = (newEmployee) => {
        setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
    };

    return (
        <main className='container-wrapper page-employee'>
               <Topbar onToggleSidebar={toggleSidebar} />

            <div className="container-fluid page-body-wrapper">
                    <SideNavbar isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />


                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="container-fluid">
                            <div className="row d-flex align-items-center mb-4">
                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6">
                                    <h2 className="title-1 m-0">All Employees</h2>
                                </div>
                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 text-end">
                                    <button className="btn btn-primary me-0" onClick={() => setShowModal(true)}>Add New Employee</button>
                                </div>
                            </div>
                            <div className="row employee-card-row">
                                {employees.map((employeeData) => (
                                    <div key={employeeData.id} className="col-xl-2 col-lg-4 col-md-6">
                                        <Card className="employee-card p-3">
                                            <div className="text-center">
                                                <img src={emp_image} alt="Employee" className="employee-img mb-3" />
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <h5 className="fw-bold fs-12">{employeeData.firstname} {employeeData.lastname || ""}</h5>
                                                    <p className="fs-8">ID No: <span className="fw-bold fs-10">{employeeData.empid}</span></p>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <p className="fs-10"><span className="fs-8">Seat No:</span> {employeeData.seats?.[0]?.seatid || "N/A"}</p>
                                                    <p className="fs-10"><span className="fs-8">Punch in:</span> 10:30 AM</p>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <p className="fs-10 text-left"><strong>Device:</strong> {employeeData.devices?.[0]?.id || "Not Mapped"}</p>
                                                    <p className="fw-bold fs-10 text-end"><strong>Status:</strong> <span className="text-success">Active</span></p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddEmployeeModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                onEmployeeAdded={handleEmployeeAdded} 
            />
        </main>
    );
};

export default Employees;
