import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaUpload } from "react-icons/fa";
import DbDataTable from "../DbDataTable/DbDataTable";
import "./DbData.css";
import { BASE_URL } from "../../assets/constants";

const cleanValue = (value) => {
  return value ? value.replace(/Ø/g, "") : "noAttr";
};

export const handleDataLoad = async (parent_name, setDbData, setParentData) => {
  try {
    const res = await axios.get(`${BASE_URL}/data/${parent_name}`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    const cleanedData = res.data.parent.map((item) => ({
      ...item,
      value_en: cleanValue(item.value_en),
      value_en_2: cleanValue(item.value_en_2),
      value_en_3: cleanValue(item.value_en_3),
    }));

    setDbData(cleanedData);
    setParentData(res.data.parentData);
  } catch (error) {
    console.log(error.message);
  }
};

const AutoComplete = ({ results, setResults, set_parent_name }) => {
  return (
    <div className="autocompelte-box">
      {results.map((result) => {
        return (
          <div
            className="autocompelte-result"
            key={result.parent_id_de}
            onClick={() => {
              setResults([]);
              set_parent_name(result.parent_name_en);
            }}
          >
            {result.parent_name_en}
          </div>
        );
      })}
    </div>
  );
};

const DbData = ({
  dbData,
  setDbData,
  setParentData,
  setSupplierItem,
  initialParent,
}) => {
  const [results, setResults] = useState([]);
  const [parent_name, set_parent_name] = useState("");

  const searchProducts = async (en_name) => {
    try {
      let res = await axios.get(
        `${BASE_URL}/search?en_name=${encodeURIComponent(en_name)}`,
        {
          headers: {
            "Content-Type": "application_json",
          },
          withCredentials: true,
        }
      );
      setResults(res.data);
    } catch (error) {
      console.log(error.message);
    }
  };
  useEffect(() => {
    if (parent_name !== "") {
      handleDataLoad(parent_name, setDbData, setParentData);
    }
  }, []);

  useEffect(() => {
    if (initialParent) {
      setResults([]);
      set_parent_name(initialParent.parent_name_en);
    }
  }, [initialParent]);

  return (
    <div className="db-data-container">
      {dbData !== null ? (
        <DbDataTable dbData={dbData} setDbData={setDbData} />
      ) : (
        <div className="db-upload-box">
          <div className="autocompelte-search">
            <input
              value={parent_name}
              type="text"
              placeholder="Search Master Data"
              onChange={async (e) => {
                set_parent_name(e.target.value);
                await searchProducts(e.target.value);
              }}
            />
            {results.length !== 0 && parent_name !== "" && (
              <AutoComplete
                results={results}
                set_parent_name={set_parent_name}
                setResults={setResults}
              />
            )}
          </div>
          <button
            onClick={() => {
              if (parent_name !== "") {
                handleDataLoad(parent_name, setDbData, setParentData);
              }
            }}
          >
            <FaUpload fontSize={25} />
            Load Data
          </button>
        </div>
      )}
    </div>
  );
};

export default DbData;
