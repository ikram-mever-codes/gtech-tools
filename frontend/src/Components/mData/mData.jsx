import React, { useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import Combinations from "../Combinations/Combinations";
import Parent from "../Parent/Parent";
import "./mData.css";
import Operations from "../Operations/Operations";
import PostSettings from "../PostSettings/PostSettings";
import CommonData from "../CommonData/CommonData";

const MData = ({
  missingCombinations,
  setMissingCombinations,
  setShowMData,
  handleAction,
  setParentData,
  parentData,
  parent,
  setCsvData,
  setDbData,
  commonData,
  setCommonData,
  subClassDimensionOps,
}) => {
  const [tab, setTab] = useState("combinations");
  const [products, setProducts] = useState([]);

  return (
    <div className="mdata-container">
      <div className="mdata-modal">
        <button
          className="db-data-close"
          onClick={() => {
            setShowMData(false);
            setMissingCombinations([]);
            setCommonData([]);
          }}
        >
          <FaRegWindowClose />
        </button>
        <div className="mdata-tabs">
          <button
            className={tab === "commonData" ? "active-tab" : ""}
            onClick={() => setTab("commonData")}
          >
            Compare Data
          </button>{" "}
          <button
            className={tab === "combinations" ? "active-tab" : ""}
            onClick={() => setTab("combinations")}
          >
            Missing Combinations
          </button>
          <button
            className={tab === "parent" ? "active-tab" : ""}
            onClick={() => setTab("parent")}
          >
            Parent Info
          </button>
          <button
            onClick={() => setTab("operations")}
            className={tab === "operations" ? "active-tab" : ""}
          >
            Formula Operations
          </button>
          <button
            onClick={() => setTab("post-settings")}
            className={tab === "post-settings" ? "active-tab" : ""}
          >
            Post Settings
          </button>
        </div>
        <div className="mdata-content">
          {tab === "commonData" && (
            <CommonData
              commonData={commonData}
              setCommonData={setCommonData}
              setParentData={setParentData}
              setDbData={setDbData}
            />
          )}
          {tab === "combinations" && (
            <Combinations
              missingCombinations={missingCombinations}
              parentData={parentData}
              parent={parent}
              products={products}
              setProducts={setProducts}
              setShowMData={setShowMData}
              tab={tab}
              setMissingCombinations={setMissingCombinations}
              setParentData={setParentData}
              setCsvData={setCsvData}
              setDbData={setDbData}
            />
          )}
          {tab === "parent" && (
            <Parent parentData={parentData} parent={parent} />
          )}
          {tab === "post-settings" && <PostSettings />}
          {tab === "operations" && (
            <Operations
              parentData={parentData}
              products={products}
              subClassDimensionOps={subClassDimensionOps}
              setProducts={setProducts}
              missingCombinations={missingCombinations}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MData;
