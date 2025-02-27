import React, { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  FaBan,
  FaMinus,
  FaPlus,
  FaRegWindowClose,
  FaSync,
  FaUpload,
} from "react-icons/fa";
import { MdClass, MdExplore, MdFunctions } from "react-icons/md";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./CsvData.css";
import InputModal from "../InputModal/InputModal";

const ItemTypes = {
  HEADER: "header",
};

const DraggableHeader = ({ header, index, moveHeader }) => {
  const [, ref] = useDrag({
    type: ItemTypes.HEADER,
    item: { index },
  });

  const [, drop] = useDrop({
    accept: ItemTypes.HEADER,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveHeader(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return <th ref={(node) => ref(drop(node))}>{header}</th>;
};

const CsvData = ({
  dbData,
  csvData,
  setCsvData,
  setOrgCsvData,
  orgCsvData,
}) => {
  const [modifications, setModifications] = useState({});
  const [headers, setHeaders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const headersFromCSV = result.meta.fields;

          if (headersFromCSV.length > 0) {
            const predefinedHeaders = [
              "Attributes1",
              "Attributes2",
              "Attributes3",
              "Attributes4",
              "URL",
              "price",
            ];

            const parsedHeaders = headersFromCSV
              .map((header) => header.trim())
              .filter((header) => predefinedHeaders.includes(header));

            let combinedHeaders = [
              "Attributes1",
              "Attributes2",
              "Attributes3",
              "URL",
              "price",
            ];

            parsedHeaders.forEach((header, index) => {
              if (index < 3) combinedHeaders[index] = header;
            });

            setOrgCsvData(result.data);

            const transformedData = result.data.map((row) => ({
              Attributes1: row["Attributes1"] || "",
              Attributes2: row["Attributes2"] || "",
              Attributes3: row["Attributes3"] || "",
              URL: row["URL"] || "",
              price: row["price"] || "",
            }));

            const initialModifications = combinedHeaders.reduce(
              (acc, header) => {
                acc[header] = {
                  prefix: "",
                  suffix: "",
                  find: "",
                  replace: "",
                  remove: "",
                  formula: "",
                };
                return acc;
              },
              {}
            );

            setHeaders(combinedHeaders);
            setCsvData(transformedData);
            setModifications(initialModifications);
          } else {
            console.warn("No valid headers found in CSV.");
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        },
      });
    } else {
      console.warn("No file selected.");
    }
  };

  const handleModificationChange = (header, type) => {
    setModalData({ header, type });
    setShowModal(true);
  };

  const handleModalSubmit = (header, type, value) => {
    const updatedModifications = {
      ...modifications,
      [header]: {
        prefix: "",
        suffix: "",
        find: "",
        replace: "",
        remove: "",
        formula: "",
        [type]: value,
      },
    };

    if (type === "findReplace") {
      const [find, replace] = value.split("||");
      updatedModifications[header].findReplace = { find, replace };
    }

    if (type === "formula") {
      updatedModifications[header].formula = value;
    }

    setModifications(updatedModifications);
    setCsvData((prevData) =>
      applyModifications(prevData, updatedModifications)
    );
    setModifications([]);
  };

  const applyModifications = (data, modifications) => {
    return data.map((row) => {
      const newRow = { ...row };

      Object.keys(modifications).forEach((header) => {
        if (modifications[header]) {
          let {
            prefix = "",
            suffix = "",
            findReplace,
            remove = "",
            formula = "",
          } = modifications[header];

          let cellValue = newRow[header] ? String(newRow[header]) : "";

          if (remove) {
            cellValue = cellValue.replace(new RegExp(remove, "g"), "");
          }

          if (findReplace) {
            const { find, replace } = findReplace;
            cellValue = cellValue.replace(new RegExp(find, "g"), replace);
          }

          if (formula) {
            try {
              const numericValue = parseFloat(cellValue);
              if (!isNaN(numericValue)) {
                cellValue = String(eval(formula.replace(/x/g, numericValue)));
              }
            } catch (e) {
              console.error("Error evaluating formula:", e);
            }
          }

          if (prefix) {
            cellValue = prefix + cellValue;
          }

          if (suffix) {
            cellValue = cellValue + suffix;
          }

          newRow[header] = cellValue;
        }
      });

      return newRow;
    });
  };

  const moveHeader = useCallback(
    (fromIndex, toIndex) => {
      const relevantHeaders = [
        "Attributes1",
        "Attributes2",
        "Attributes3",
        "URL",
        "price",
      ];
      const newHeaders = [...relevantHeaders];
      const [movedHeader] = newHeaders.splice(fromIndex, 1);
      newHeaders.splice(toIndex, 0, movedHeader);

      const updatedCsvData = csvData.map((row) => {
        const updatedRow = {};

        newHeaders.forEach((header, index) => {
          const originalHeader = relevantHeaders[index];
          updatedRow[header] = row[originalHeader];
        });

        return updatedRow;
      });

      setHeaders(newHeaders);
      setCsvData(updatedCsvData);
    },
    [csvData]
  );

  return (
    <>
      {showModal && (
        <InputModal
          header={modalData.header}
          type={modalData.type}
          onSubmit={handleModalSubmit}
          setShowModal={setShowModal}
        />
      )}
      <DndProvider backend={HTML5Backend}>
        <div className="csv-data-container">
          {csvData.length !== 0 && (
            <button
              className="db-data-close"
              onClick={() => {
                setCsvData([]);
                setHeaders([]);
                setModifications({});
                setOrgCsvData([]);
              }}
            >
              <FaRegWindowClose />
            </button>
          )}
          {csvData.length > 0 ? (
            <div className="csv-data-wrapper">
              <div className="csv-modifications">
                <div key={"Attributes1"} className="column-modification">
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "prefix")
                    }
                    className="mod-btn"
                  >
                    <FaPlus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "suffix")
                    }
                    className="mod-btn"
                  >
                    <FaMinus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "remove")
                    }
                    className="mod-btn"
                  >
                    <FaBan />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "findReplace")
                    }
                    className="mod-btn"
                  >
                    <FaSync />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "formula")
                    }
                    className="mod-btn"
                  >
                    <MdFunctions />
                  </button>
                </div>
                <div key={"Attributes2"} className="column-modification">
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "prefix")
                    }
                    className="mod-btn"
                  >
                    <FaPlus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "suffix")
                    }
                    className="mod-btn"
                  >
                    <FaMinus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "remove")
                    }
                    className="mod-btn"
                  >
                    <FaBan />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "findReplace")
                    }
                    className="mod-btn"
                  >
                    <FaSync />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "formula")
                    }
                    className="mod-btn"
                  >
                    <MdFunctions />
                  </button>
                </div>
                <div key={"Attributes3"} className="column-modification">
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "prefix")
                    }
                    className="mod-btn"
                  >
                    <FaPlus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "suffix")
                    }
                    className="mod-btn"
                  >
                    <FaMinus />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "remove")
                    }
                    className="mod-btn"
                  >
                    <FaBan />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "findReplace")
                    }
                    className="mod-btn"
                  >
                    <FaSync />
                  </button>
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "formula")
                    }
                    className="mod-btn"
                  >
                    <MdFunctions />
                  </button>
                </div>
              </div>
              <div className="csv-table">
                <table>
                  <thead>
                    <tr>
                      <DraggableHeader
                        key={"Attributes1"}
                        header={"Attributes1"}
                        index={0}
                        moveHeader={moveHeader}
                        setOrgCsvData={setOrgCsvData}
                      />
                      <DraggableHeader
                        key={"Attributes2"}
                        header={"Attributes2"}
                        index={1}
                        moveHeader={moveHeader}
                        setOrgCsvData={setOrgCsvData}
                      />
                      <DraggableHeader
                        key={"Attributes3"}
                        header={"Attributes3"}
                        index={2}
                        moveHeader={moveHeader}
                        setOrgCsvData={setOrgCsvData}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((data, rowIndex) => (
                      <tr key={rowIndex}>
                        <td key={"Attributes1"}>{data["Attributes1"]}</td>
                        <td key={"Attributes2"}>{data["Attributes2"]}</td>
                        <td key={"Attributes3"}>{data["Attributes3"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="csv-upload-box flex flex-col gap-5">
              <div
                className="csv-upload"
                onClick={() => {
                  window.location.href = "/products";
                }}
              >
                <MdExplore fontSize={25} /> <h3>Browse Products</h3>
              </div>
              <div
                className="csv-upload"
                onClick={() => {
                  window.location.href = "/classifications";
                }}
              >
                <MdClass fontSize={25} /> <h3>Browse Classifications</h3>
              </div>{" "}
              <div
                className="csv-upload"
                onClick={() => {
                  document.querySelector("#csv-input").click();
                }}
              >
                <FaUpload fontSize={25} /> <h3>Upload CSV File</h3>
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>
      </DndProvider>
    </>
  );
};

export default CsvData;
