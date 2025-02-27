import React from "react";
import { FaLock } from "react-icons/fa";
import "./WrongCredentials.css";

const WrongCredentials = () => {
  return (
    <div className="wrong-credentials-container">
      <FaLock className="lock-icon" />
      <h1>Access Denied</h1>
      <p className="alt-message">
        You are not allowed to access this website. Please contact the
        administrator or try again with correct credentials.
      </p>
    </div>
  );
};

export default WrongCredentials;
