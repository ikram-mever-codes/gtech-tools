import axios from "axios";
import React, { useEffect, useState } from "react";
import { MdDownload, MdUpdate } from "react-icons/md";
import "./CommonData.css";
import { toast } from "react-toastify";
import { BASE_URL } from "../../assets/constants";
import { handleDataLoad } from "../DbData/DbData";

const CommonData = ({
  setCommonData,
  commonData,
  setParentData,
  setDbData,
}) => {
  const [loading, setLoading] = useState(false);
  const [allMatch, setAllMatch] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [updateProgress, setUpdateProgress] = useState({
    current: 0,
    total: 0,
  });

  const logOperation = (parentNo, parentName, cd) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Gtech Data Updated, Parent No: ${parentNo}, Parent Name: ${parentName}, EAN: ${
      cd.dbData.ean
    }, Attr1: ${cd.dbData.value_en || ""}, Attr2: ${
      cd.dbData.value_en_2 || ""
    }, Attr3: ${cd.dbData.value_en_3 || ""}`;

    setLogEntries((prevEntries) => [...prevEntries, logEntry]);
    return logEntry;
  };

  const downloadLogFile = () => {
    if (logEntries.length === 0) {
      toast.warning("No log entries to download");
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `GTItemInjector_log_${timestamp}.txt`;
      const content = logEntries.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading log file:", error);
      toast.error("Failed to download log file");
    }
  };

  async function handleDataUpdate() {
    let cnf = confirm(
      `Do you want to update ${commonData.length} items in the Database?`
    );
    if (!cnf) {
      return;
    }

    setLoading(true);
    setUpdateProgress({ current: 0, total: commonData.length });
    const newLogEntries = [];
    const chunkSize = 100; // Process 100 items at a time
    const totalChunks = Math.ceil(commonData.length / chunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = commonData.slice(start, end);

        const response = await axios.put(
          `${BASE_URL}/data/update`,
          { data: chunk },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        if (!response.data || response.status !== 200) {
          throw new Error(
            response.data?.message ||
              `Update failed for chunk ${i + 1}/${totalChunks}`
          );
        }

        // Process updates and collect logs for this chunk
        const updatedChunk = chunk.map((cd) => {
          const logEntry = logOperation(
            cd.dbData.parent_no_de,
            cd.dbData.item_name,
            cd
          );
          newLogEntries.push(logEntry);

          return {
            ...cd,
            dbData: {
              ...cd.dbData,
              url: cd.csvData.URL,
              price_rmb: cd.csvData.price,
            },
          };
        });

        // Update progress
        const currentProgress = Math.min(end, commonData.length);
        setUpdateProgress({
          current: currentProgress,
          total: commonData.length,
        });
        toast.update(
          `Updating items (${currentProgress}/${commonData.length})...`
        );

        // Update state with the processed chunk
        setCommonData((prevData) => {
          const newData = [...prevData];
          for (let j = start; j < end && j < newData.length; j++) {
            newData[j] = updatedChunk[j - start];
          }
          return newData;
        });
      }

      // Final reload after all updates
      await handleDataLoad(
        commonData[0].dbData.item_name,
        setDbData,
        setParentData
      );

      setLogEntries((prev) => [...prev, ...newLogEntries]);
      toast.success("All updates completed successfully");
    } catch (error) {
      console.error("Update error details:", {
        error: error.response?.data || error.message,
        requestData: commonData,
      });
      toast.error(
        `Update failed: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      setUpdateProgress({ current: 0, total: 0 });
    }
  }

  useEffect(() => {
    if (commonData.length > 0) {
      handleDataLoad(
        commonData[0]?.dbData?.item_name,
        setDbData,
        setParentData
      );
    }

    const allMatch = commonData.every((cd) => {
      const isUrlDifferent =
        cd.csvData.URL?.toString() !== cd.dbData.url?.toString();
      const isPriceDifferent =
        cd.csvData.price?.toString() !== cd.dbData.price_rmb?.toString();
      return !isUrlDifferent && !isPriceDifferent;
    });

    setAllMatch(allMatch);
  }, [commonData, setDbData, setParentData]);

  return (
    <>
      {commonData.length === 0 ? (
        <div
          style={{
            width: "100%",
            height: "60vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontWeight: 600 }}>
            Oops, No Common Combinations found!
          </h1>
        </div>
      ) : (
        <div className="common-data-container">
          <div className="common-data-wrapper">
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                gap: "2rem",
              }}
            >
              <button
                className="common-update-button"
                onClick={handleDataUpdate}
                disabled={allMatch}
              >
                <MdUpdate style={{ fontSize: "20px", margin: "0px 5px" }} />
                {loading ? "Updating..." : "Update "}
              </button>
              <button
                className="common-update-button"
                onClick={downloadLogFile}
                disabled={!allMatch}
              >
                <MdDownload />
                Download Logs
              </button>
            </div>
            {allMatch && (
              <div className="match-heading-container">
                <h2 className="match-heading">
                  🎉 Supplier Data matches with Gtech Data! 🎉
                </h2>
              </div>
            )}
            <div className="combinations-table-wrapper h-[56vh] overflow-auto">
              <table className="combinations-table">
                <thead>
                  <tr>
                    <th>Result</th>
                    <th>Ean</th>
                    <th>Attr1</th>
                    <th>Attr2</th>
                    <th>Attr3</th>
                    <th>Csv Price</th>
                    <th>Csv Url</th>
                    <th>Db Price</th>
                    <th>Db Url</th>
                  </tr>
                </thead>
                <tbody>
                  {(commonData || []).map((cd) => {
                    const isUrlDifferent =
                      cd.csvData.URL.toString() !== cd.dbData.url.toString();
                    const isPriceDifferent =
                      cd.csvData.price.toString() !==
                      cd.dbData.price_rmb.toString();
                    const result =
                      isUrlDifferent || isPriceDifferent
                        ? "Different"
                        : "Matches";

                    return (
                      <tr key={cd.dbData.item_id}>
                        <td
                          className={
                            isUrlDifferent || isPriceDifferent
                              ? "match-different"
                              : ""
                          }
                        >
                          {result}
                        </td>
                        <td>{cd.dbData.ean}</td>
                        <td>{cd.dbData.value_de}</td>
                        <td>{cd.dbData.value_de_2}</td>
                        <td>
                          {cd.dbData.value_de_3 ? cd.dbData.value_de_3 : ""}
                        </td>
                        <td
                          className={isPriceDifferent ? "match-different" : ""}
                        >
                          {cd.csvData.price}
                        </td>
                        <td className={isUrlDifferent ? "match-different" : ""}>
                          {cd.csvData.URL.substring(0, 25)}...
                        </td>
                        <td
                          className={isPriceDifferent ? "match-different" : ""}
                        >
                          {cd.dbData.price_rmb}
                        </td>
                        <td className={isUrlDifferent ? "match-different" : ""}>
                          {cd.dbData.url.substring(0, 25)}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommonData;
