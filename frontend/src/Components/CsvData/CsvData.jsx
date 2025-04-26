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
  FaSave,
} from "react-icons/fa";
import { MdClass, MdExplore, MdFunctions } from "react-icons/md";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./CsvData.css";
import InputModal from "../InputModal/InputModal";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { saveAttributeModifications } from "../../apis/classifications";

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
  subClassId,
  subClass,
}) => {
  const [modifications, setModifications] = useState({});
  const [headers, setHeaders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [hasModificationChanges, setHasModificationChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubClassData, setIsSubClassData] = useState(false);

  // Initialize modifications from props
  useEffect(() => {
    if (initialModifications) {
      // Ensure all modification fields exist for each header
      const initializedMods = Object.keys(initialModifications).reduce(
        (acc, header) => {
          acc[header] = {
            prefix: initialModifications[header]?.prefix || "",
            suffix: initialModifications[header]?.suffix || "",
            find: initialModifications[header]?.find || "",
            replace: initialModifications[header]?.replace || "",
            remove: initialModifications[header]?.remove || "",
            formula: initialModifications[header]?.formula || "",
          };
          return acc;
        },
        {}
      );

      setModifications(initializedMods);
      setHasModificationChanges(false);
      if (orgCsvData.length > 0) {
        setCsvData(applyModifications(orgCsvData, initializedMods));
      }
    }
    setIsSubClassData(!!subClassId);
  }, [initialModifications, subClassId]);

  // Check for modification changes
  useEffect(() => {
    const changesExist =
      JSON.stringify(modifications) !== JSON.stringify(initialModifications);
    setHasModificationChanges(changesExist);
  }, [modifications, initialModifications]);

  const handleSaveModifications = async () => {
    if (!subClassId) return;

    setIsSaving(true);
    try {
      await saveAttributeModifications(subClassId, modifications);
      toast.success("Modifications saved successfully");
      onModificationsChange(modifications);
      setHasModificationChanges(false);
    } catch (error) {
      toast.error("Failed to save modifications");
    } finally {
      setIsSaving(false);
    }
  };

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
            setIsSubClassData(false);
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
    setModalData({
      header,
      type,
      currentValue: modifications[header]?.[type] || "",
    });
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
        ...(type === "prefix" && { prefix: value }),
        ...(type === "suffix" && { suffix: value }),
        ...(type === "remove" && { remove: value }),
        ...(type === "formula" && { formula: value }),
        ...(type === "findReplace" && {
          find: value.split("||")[0] || "",
          replace: value.split("||")[1] || "",
        }),
      },
    };

    setModifications(updatedModifications);
    const updatedData = applyModifications(orgCsvData, updatedModifications);
    setCsvData(updatedData);
    if (onModificationsChange) onModificationsChange(updatedModifications);
  };

  const applyModifications = (data, mods) => {
    if (!data || !mods) return data;

    return data.map((row) => {
      const newRow = { ...row };
      Object.keys(mods).forEach((header) => {
        if (mods[header]) {
          const {
            prefix = "",
            suffix = "",
            find = "",
            replace = "",
            remove = "",
            formula = "",
          } = mods[header];

          // Initialize cell value (handle null/undefined)
          let cellValue =
            newRow[header] !== undefined ? String(newRow[header]) : "";

          // Apply remove if specified (only if there's a value to remove from)
          if (remove && remove.length > 0) {
            try {
              cellValue = cellValue.replace(new RegExp(remove, "g"), "");
            } catch (e) {
              console.error("Invalid remove pattern:", e);
            }
          }

          // Apply find/replace if specified (only if there's a value to modify)
          if (find && find.length > 0) {
            try {
              const findRegex = new RegExp(find, "g");
              cellValue = cellValue.replace(findRegex, replace || "");
            } catch (e) {
              console.error("Invalid find/replace pattern:", e);
            }
          }

          // Apply formula if specified and value is numeric
          if (formula && formula.length > 0 && !isNaN(parseFloat(cellValue))) {
            try {
              const numericValue = parseFloat(cellValue);
              const safeFormula = formula.replace(/x/g, numericValue);
              cellValue = String(new Function(`return ${safeFormula}`)());
            } catch (e) {
              console.error("Error evaluating formula:", e);
            }
          }

          // Always apply prefix and suffix (even to empty values)
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
          currentValue={modalData.currentValue}
        />
      )}
      <DndProvider backend={HTML5Backend}>
        <div className="csv-data-container">
          {csvData.length > 0 ? (
            <div className="csv-data-wrapper">
              {csvData.length !== 0 && (
                <div className="csv-data-header w-full">
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
                  {subClassId && subClass && (
                    <button
                      className="flex justify-center text-white cursor-pointer items-center gap-3 p-2 bg-blue-600 w-full px-0"
                      onClick={handleSaveModifications}
                      disabled={!hasModificationChanges || isSaving}
                    >
                      <FaSave /> {isSaving ? "Saving..." : "Save Modifications"}
                    </button>
                  )}
                </div>
              )}
              <div className="csv-modifications">
                {["Attributes1", "Attributes2", "Attributes3"].map((header) => (
                  <div key={header} className="column-modification">
                    <button
                      onClick={() => handleModificationChange(header, "prefix")}
                      className="mod-btn"
                      title="Add prefix"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={() => handleModificationChange(header, "suffix")}
                      className="mod-btn"
                      title="Add suffix"
                    >
                      <FaMinus />
                    </button>
                    <button
                      onClick={() => handleModificationChange(header, "remove")}
                      className="mod-btn"
                      title="Remove text"
                    >
                      <FaBan />
                    </button>
                    <button
                      onClick={() =>
                        handleModificationChange(header, "findReplace")
                      }
                      className="mod-btn"
                      title="Find and replace"
                    >
                      <FaSync />
                    </button>
                    <button
                      onClick={() =>
                        handleModificationChange(header, "formula")
                      }
                      className="mod-btn"
                      title="Apply formula"
                    >
                      <MdFunctions />
                    </button>
                    <button
                      onClick={() =>
                        handleModificationChange(header, "duplicate")
                      }
                      className="mod-btn"
                      title="Duplicate column"
                    >
                      <FaCopy />
                    </button>
                  </div>
                ))}
              </div>
              <div className="csv-table">
                <table>
                  <thead>
                    <tr>
                      {["Attributes1", "Attributes2", "Attributes3"].map(
                        (header, index) => (
                          <DraggableHeader
                            key={header}
                            header={header}
                            index={index}
                            moveHeader={moveHeader}
                          />
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((data, rowIndex) => (
                      <tr key={rowIndex}>
                        {["Attributes1", "Attributes2", "Attributes3"].map(
                          (header) => (
                            <td key={`${header}-${rowIndex}`}>
                              {data[header]}
                            </td>
                          )
                        )}
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
              </Link>
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
