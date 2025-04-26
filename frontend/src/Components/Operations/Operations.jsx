import React, { useState, useEffect } from "react";
import "./Operations.css";
import axios from "axios";
import { BASE_URL } from "../../assets/constants";
import { toast } from "react-toastify";

const Operations = ({
  products,
  setProducts,
  missingCombinations,
  parentData,
  subClassDimensionOps,
}) => {
  const [expressions, setExpressions] = useState({
    weight: "",
    height: "",
    length: "",
    width: "",
  });
  const [constants, setConstants] = useState([]);
  const [filteredConstants, setFilteredConstants] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [subClassOperations, setSubClassOperations] = useState(null);

  useEffect(() => {
    if (subClassDimensionOps) {
      setExpressions(subClassDimensionOps);
      handleApply();
    }
    const fetchConstants = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/constants/all`);
        setConstants(response.data);
      } catch (error) {
        console.error("Error fetching constants:", error);
      }
    };
    fetchConstants();
  }, [subClassDimensionOps]);

  useEffect(() => {
    if (parentData?.subClassId) {
      const fetchSubClassOperations = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/subclasses/${parentData.subClassId}`
          );
          if (response.data.dimensionOperations) {
            const ops =
              typeof response.data.dimensionOperations === "string"
                ? JSON.parse(response.data.dimensionOperations)
                : response.data.dimensionOperations;

            setSubClassOperations(ops);
            setExpressions(ops);
          }
        } catch (error) {
          console.error("Error fetching subclass operations:", error);
        }
      };
      fetchSubClassOperations();
    }
  }, [parentData]);

  const handleExpressionChange = (e, key) => {
    const { value } = e.target;
    setExpressions((prev) => ({ ...prev, [key]: value }));

    const filtered = constants.filter((constant) =>
      constant.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredConstants(filtered);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e, key) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) =>
        Math.min(prev + 1, filteredConstants.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      const selectedConstant = filteredConstants[activeIndex];
      setExpressions((prev) => ({ ...prev, [key]: selectedConstant.value }));
      setFilteredConstants([]);
      setActiveIndex(-1);
    }
  };

  const applyOperation = (expression, key, product) => {
    if (!expression) return product.titemData[key];

    try {
      let currentValue = parseFloat(product.titemData[key]);
      if (isNaN(currentValue)) return currentValue;

      let modifiedExpression = expression
        .replace(/x/g, currentValue)
        .replace(/attr1/g, product.variationValuesData.value_de || 0)
        .replace(/attr2/g, product.variationValuesData.value_de_2 || 0)
        .replace(/attr3/g, product.variationValuesData.value_de_3 || 0);

      constants.forEach((constant) => {
        modifiedExpression = modifiedExpression.replace(
          new RegExp(`\\b${constant.name}\\b`, "g"),
          constant.value
        );
      });

      const result = eval(modifiedExpression);
      return isNaN(result) ? currentValue : result;
    } catch (error) {
      console.error("Error applying operation:", error);
      return product.titemData[key];
    }
  };

  const handleApply = () => {
    const updatedProducts = products.map((product) => ({
      ...product,
      titemData: {
        ...product.titemData,
        weight: applyOperation(expressions.weight, "weight", product),
        height: applyOperation(expressions.height, "height", product),
        length: applyOperation(expressions.length, "length", product),
        width: applyOperation(expressions.width, "width", product),
      },
    }));
    setProducts(updatedProducts);
    toast.success("Dimension operations applied successfully");
  };

  const saveOperationsToSubClass = async () => {
    if (!parentData?.subClassId) {
      toast.error("No subclass selected to save operations");
      return;
    }

    try {
      await axios.put(`${BASE_URL}/api/subclasses/${parentData.subClassId}`, {
        dimensionOperations: expressions,
      });
      toast.success("Dimension operations saved to subclass");
    } catch (error) {
      console.error("Error saving operations:", error);
      toast.error("Failed to save operations");
    }
  };

  const renderExpressionWithConstants = (expression) => {
    if (!expression) return null;
    return expression.split(/(\s+)/).map((part, index) => {
      const constant = constants.find(
        (c) => c.name.toLowerCase() === part.trim().toLowerCase()
      );
      return constant ? (
        <span key={index} style={{ color: "blue", fontWeight: "bold" }}>
          {part}
        </span>
      ) : (
        part
      );
    });
  };

  return (
    <div className="operations-container">
      <h2 className="header-title">Dimension Modifications</h2>

      {subClassOperations && (
        <div className="subclass-operations-notice">
          <p>Using operations from subclass: {parentData.subClassId}</p>
          <div className="operations-preview">
            {Object.entries(subClassOperations).map(
              ([dim, op]) =>
                op && (
                  <div key={dim}>
                    <strong>{dim}:</strong> {op}
                  </div>
                )
            )}
          </div>
        </div>
      )}

      <div className="dimension-inputs">
        {["weight", "height", "length", "width"].map((dim) => (
          <div className="dimension-item" key={dim}>
            <label>{dim.charAt(0).toUpperCase() + dim.slice(1)}:</label>
            <input
              type="text"
              placeholder={`e.g., x * 2, x + attr1`}
              value={expressions[dim]}
              onChange={(e) => handleExpressionChange(e, dim)}
              onKeyDown={(e) => handleKeyDown(e, dim)}
            />
            <div className="expression-preview">
              {renderExpressionWithConstants(expressions[dim])}
            </div>
            {filteredConstants.length > 0 && (
              <ul className="autocomplete-list">
                {filteredConstants.map((constant, index) => (
                  <li
                    key={constant.id}
                    className={`autocomplete-item ${
                      index === activeIndex ? "active" : ""
                    }`}
                    onClick={() => {
                      setExpressions((prev) => ({
                        ...prev,
                        [dim]: constant.value,
                      }));
                      setFilteredConstants([]);
                    }}
                  >
                    {constant.name} ({constant.value})
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="operations-buttons">
        <button className="apply-btn" onClick={handleApply}>
          Apply Changes
        </button>
        {parentData?.subClassId && (
          <button className="save-btn" onClick={saveOperationsToSubClass}>
            Save to SubClass
          </button>
        )}
      </div>

      <table className="products-table">
        <thead>
          <tr>
            <th>Weight</th>
            <th>Height</th>
            <th>Length</th>
            <th>Width</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.titemData.itemID_DE}>
              <td>{product.titemData.weight}</td>
              <td>{product.titemData.height}</td>
              <td>{product.titemData.length}</td>
              <td>{product.titemData.width}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Operations;
