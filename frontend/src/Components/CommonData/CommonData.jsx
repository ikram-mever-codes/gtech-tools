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

  const logOperation = (parentNo, parentName, cd) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Gtech Data Updated, Parent No: ${parentNo}, Parent Name: ${parentName}, EAN: ${
      cd.dbData.ean
    }, Attr1: ${cd.dbData.value_en}, Attr2: ${cd.dbData.value_en_2}, Attr3: ${
      cd.dbData.value_en_3 || ""
    }`;

    setLogEntries((prevEntries) => [...prevEntries, logEntry]);
  };

  const downloadLogFile = () => {
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const fileName = `GTItemInjector_log_${timestamp}.txt`;
    const blob = new Blob([logEntries.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  async function handleDataUpdate() {
    let cnf = confirm("Do you want to update Database?");
    if (!cnf) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/data/update`,
        { data: commonData },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const updatedCommonData = commonData.map((cd) => {
          logOperation(cd.dbData.parent_no_de, cd.dbData.item_name, cd);
          return {
            ...cd,
            dbData: {
              ...cd.dbData,
              url: cd.csvData.URL,
              price_rmb: cd.csvData.price,
            },
          };
        });

        setCommonData(updatedCommonData);
        downloadLogFile();
        setAllMatch(true);
        toast.success("Update successful");

        await handleDataLoad(
          commonData[0].dbData.item_name,
          setDbData,
          setParentData
        );
      } else {
        toast.error("Failed to update data");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleDataLoad(commonData[0]?.dbData?.item_name, setDbData, setParentData);

    const allMatch = commonData.every((cd) => {
      const isUrlDifferent =
        cd.csvData.URL.toString() !== cd.dbData.url.toString();
      const isPriceDifferent =
        cd.csvData.price.toString() !== cd.dbData.price_rmb.toString();
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
            <div className="common-table-wrapper">
              <table className="common-data-table">
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
                        <td>{cd.dbData.value_en}</td>
                        <td>{cd.dbData.value_en_2}</td>
                        <td>
                          {cd.dbData.value_en_3 ? cd.dbData.value_en_3 : ""}
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
