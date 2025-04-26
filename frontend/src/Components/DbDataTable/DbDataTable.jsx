import React, { useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import "./DbDataTable.css";

const DbDataTable = ({ dbData, setDbData }) => {
  const [headers, setHeaders] = useState([
    "value_de",
    "value_de_2",
    "value_de_3",
  ]);
  const processedData = dbData.map((data) => {
    const newData = { ...data };
    headers.forEach((header) => {
      if (
        newData[header] === undefined ||
        newData[header] === null ||
        newData[header] === ""
      ) {
        newData[header] = "";
      }
    });
    return newData;
  });
  return (
    <div className="db-data-table-container">
      <button
        className="db-data-close"
        onClick={() => {
          setDbData(null);
        }}
      >
        <FaRegWindowClose />
      </button>
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processedData.map((data) => (
            <tr key={data.id}>
              {headers.map((header) => (
                <td key={header}>{data[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DbDataTable;
