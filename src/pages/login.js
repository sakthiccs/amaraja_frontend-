import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import "../assets/css/login.css";
import logo from "../assets/images/logo.jpg";
import Bgm from "../assets/images/WhatsApp_Image_2025-10-27_at_1.14.23_PM-removebg-preview.png";

const Login = () => {
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const validateForm = (event) => {
    event.preventDefault();
    let isValid = true;

    setUsernameError("");
    setPasswordError("");

    const username = formRef.current.username.value;
    const password = formRef.current.password.value;

    if (!username) {
      setUsernameError("Username is required");
      isValid = false;
    } else if (username !== "admin") {
      setUsernameError("Incorrect username");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password !== "Admin@123") {
      setPasswordError("Incorrect password");
      isValid = false;
    }

    if (isValid) {
      navigate("/Dashboard");
    }
  };

  return (
    <section className="sec-login-page">
      {/* Left Side - Background Image */}
      <div className="login-left">
        <img src={Bgm} alt="Background" className="bg-left-img" />
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-box">
          <div className="bg-light">
            <Form ref={formRef} onSubmit={validateForm}>
              <img src={logo} className="mb-4 login-logo" alt="Logo" />
              <div className="input-group">
                <label>User Name</label>
                <input
                  type="text"
                  name="username"
                  className={`form-control ${usernameError ? "is-invalid" : ""}`}
                />
                {usernameError && (
                  <div className="invalid-feedback">{usernameError}</div>
                )}
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-control ${passwordError ? "is-invalid" : ""}`}
                />
                <div
                  className="icon-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </div>
                {passwordError && (
                  <div className="invalid-feedback">{passwordError}</div>
                )}
              </div>
              <div className="input-group text-center mt-4">
                <button className="btn btn-primary" type="submit">
                  Login
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
