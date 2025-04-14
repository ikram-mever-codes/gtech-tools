import React, { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import {
  FaBan,
  FaMinus,
  FaPlus,
  FaRegWindowClose,
  FaSync,
  FaUpload,
  FaCopy,
} from "react-icons/fa";
import { MdClass, MdExplore, MdFunctions } from "react-icons/md";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./CsvData.css";
import InputModal from "../InputModal/InputModal";
import { Link } from "react-router-dom";

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
  initialModifications,
  onModificationsChange,
}) => {
  const [modifications, setModifications] = useState({});
  const [headers, setHeaders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});

  // Initialize modifications from props
  useEffect(() => {
    if (initialModifications) {
      setModifications(initialModifications);
      if (orgCsvData.length > 0) {
        setCsvData(applyModifications(orgCsvData, initialModifications));
      }
    }
  }, [initialModifications]);

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
              "weight",
              "height",
              "width",
              "length",
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
              weight: row["weight"] || 0,
              height: row["height"] || 0,
              width: row["width"] || 0,
              length: row["length"] || 0,
            }));

            const initialMods = combinedHeaders.reduce((acc, header) => {
              acc[header] = {
                prefix: "",
                suffix: "",
                find: "",
                replace: "",
                remove: "",
                formula: "",
              };
              return acc;
            }, {});

            setHeaders(combinedHeaders);
            setCsvData(transformedData);
            setModifications(initialMods);
            if (onModificationsChange) onModificationsChange(initialMods);
          }
        },
      });
    }
  };

  const handleModificationChange = (header, type) => {
    if (type === "duplicate") {
      handleDuplicateColumn(header);
      return;
    }
    setModalData({ header, type });
    setShowModal(true);
  };

  const handleDuplicateColumn = (sourceHeader) => {
    const attributeHeaders = ["Attributes1", "Attributes2", "Attributes3"];
    const targetAttributeHeaders = attributeHeaders.filter(
      (h) => h !== sourceHeader
    );

    setModalData({
      header: sourceHeader,
      type: "duplicate",
      message: `Select target column to copy ${sourceHeader} to:`,
      targetHeaders: targetAttributeHeaders,
    });
    setShowModal(true);
  };

  const handleModalSubmit = (header, type, value) => {
    if (type === "duplicate") {
      const targetHeader = value;
      if (targetHeader && targetHeader !== header) {
        const updatedData = csvData.map((row) => ({
          ...row,
          [targetHeader]: row[header],
        }));
        setCsvData(updatedData);
      }
      return;
    }

    const updatedModifications = {
      ...modifications,
      [header]: {
        ...modifications[header],
        [type]: type === "findReplace" ? value.split("||")[0] : value,
        ...(type === "findReplace" && {
          replace: value.split("||")[1] || "",
        }),
      },
    };

    setModifications(updatedModifications);
    setCsvData(applyModifications(orgCsvData, updatedModifications));
    if (onModificationsChange) onModificationsChange(updatedModifications);
  };

  const applyModifications = (data, mods) => {
    return data.map((row) => {
      const newRow = { ...row };
      Object.keys(mods).forEach((header) => {
        if (mods[header]) {
          let {
            prefix = "",
            suffix = "",
            find = "",
            replace = "",
            remove = "",
            formula = "",
          } = mods[header];

          let cellValue = newRow[header] ? String(newRow[header]) : "";

          if (remove) {
            cellValue = cellValue.replace(new RegExp(remove, "g"), "");
          }

          if (find && replace) {
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

          if (prefix) cellValue = prefix + cellValue;
          if (suffix) cellValue = cellValue + suffix;

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
          updatedRow[header] = row[relevantHeaders[index]];
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
          message={modalData.message}
          isDuplicate={modalData.type === "duplicate"}
          targetHeaders={modalData.targetHeaders || []}
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
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes1", "duplicate")
                    }
                    className="mod-btn"
                    title="Duplicate column"
                  >
                    <FaCopy />
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
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes2", "duplicate")
                    }
                    className="mod-btn"
                    title="Duplicate column"
                  >
                    <FaCopy />
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
                  <button
                    onClick={() =>
                      handleModificationChange("Attributes3", "duplicate")
                    }
                    className="mod-btn"
                    title="Duplicate column"
                  >
                    <FaCopy />
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
              <Link className="csv-upload" to={"/products"}>
                <MdExplore fontSize={25} /> <h3>Browse Products</h3>
              </Link>
              <Link className="csv-upload" to="/classifications">
                <MdClass fontSize={25} /> <h3>Browse Classifications</h3>
              </Link>{" "}
              <div
                className="csv-upload"
                onClick={() => {
                  document.querySelector("#csv-input").click();
                }}
              >
                <FaUpload f ontSize={25} /> <h3>Upload CSV File</h3>
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
