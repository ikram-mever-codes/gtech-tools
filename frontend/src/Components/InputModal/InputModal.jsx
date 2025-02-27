import React, { useState } from "react";
import "./InputModal.css";

const InputModal = ({ header, type, onSubmit, setShowModal }) => {
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalValue =
      type === "findReplace" ? `${findValue}||${replaceValue}` : value;

    onSubmit(header, type, finalValue);
    setShowModal(false);
  };
  const displayType = type === "findReplace" ? "Find & Replace" : type;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Modify {header}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {displayType}:
            {type === "findReplace" ? (
              <div
                style={{
                  height: "flex",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={findValue}
                  onChange={(e) => setFindValue(e.target.value)}
                  placeholder="Enter the Text to find"
                />
                <input
                  type="text"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Enter the text to Replace"
                />
              </div>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  displayType === "formula"
                    ? "Enter formula (e.g., 'x*2+10')"
                    : "Enter value"
                }
              />
            )}
          </label>
          <button type="submit">Apply</button>
          <button type="button" onClick={() => setShowModal(false)}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
