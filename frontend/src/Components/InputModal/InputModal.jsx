import React, { useState } from "react";

const InputModal = ({
  header,
  type,
  onSubmit,
  setShowModal,
  message,
  isDuplicate,
  targetHeaders,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedHeader, setSelectedHeader] = useState("");
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");

  const handleSubmit = () => {
    if (isDuplicate) {
      if (!selectedHeader) {
        alert("Please select a target column");
        return;
      }
      onSubmit(header, type, selectedHeader);
    } else if (type === "findReplace") {
      if (!findValue || !replaceValue) {
        alert("Both find and replace values are required");
        return;
      }
      onSubmit(header, type, `${findValue}||${replaceValue}`);
    } else {
      onSubmit(header, type, inputValue);
    }
    setShowModal(false);
  };

  const renderInputField = () => {
    switch (type) {
      case "duplicate":
        return (
          <select
            value={selectedHeader}
            onChange={(e) => setSelectedHeader(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select target column</option>
            {targetHeaders.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        );
      case "findReplace":
        return (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Find:
              </label>
              <input
                type="text"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replace:
              </label>
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={`Enter ${type}`}
          />
        );
    }
  };

  const getModalTitle = () => {
    if (isDuplicate) return `Duplicate ${header} to:`;
    if (type === "prefix") return `Add Prefix to ${header}`;
    if (type === "suffix") return `Add Suffix to ${header}`;
    if (type === "remove") return `Remove Text from ${header}`;
    if (type === "findReplace") return `Find & Replace in ${header}`;
    if (type === "formula") return `Apply Formula to ${header}`;
    return `${type} for ${header}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {getModalTitle()}
        </h3>
        {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
        {renderInputField()}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleSubmit}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
