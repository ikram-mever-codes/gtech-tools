import React, { useState, useEffect } from "react";
import "./Operations.css";
import axios from "axios";
import { BASE_URL } from "../../assets/constants";
const Operations = ({ products, setProducts, missingCombinations }) => {
  const [expressions, setExpressions] = useState({
    weight: "",
    height: "",
    length: "",
    width: "",
  });
  const [constants, setConstants] = useState([]);
  const [filteredConstants, setFilteredConstants] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  useEffect(() => {
    const fetchConstants = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/constants/all`);
        setConstants(response.data);
      } catch (error) {
        console.error("Error fetching constants:", error);
      }
    };

    fetchConstants();
  }, []);

  const handleExpressionChange = (e, key) => {
    const { value } = e.target;
    setExpressions((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Filter constants based on the current input value
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
      setExpressions((prev) => ({
        ...prev,
        [key]: selectedConstant.value,
      }));
      setFilteredConstants([]);
      setActiveIndex(-1);
    }
  };

  const applyOperation = (expression, key, product) => {
    try {
      let currentValue = parseFloat(product.titemData[key]);
      if (isNaN(currentValue)) return currentValue;

      let modifiedExpression = expression.replace(/x/g, currentValue);

      const attr1 = product.variationValuesData.value_de;
      const attr2 = product.variationValuesData.value_de_2;
      const attr3 = product.variationValuesData.value_de_3;

      // Replace attribute placeholders (attr1, attr2, attr3) with actual values
      modifiedExpression = modifiedExpression.replace(/attr1/g, attr1);
      modifiedExpression = modifiedExpression.replace(/attr2/g, attr2);
      modifiedExpression = modifiedExpression.replace(/attr3/g, attr3);

      // Loop through constants and replace their names in the expression
      constants.forEach((constant) => {
        const regex = new RegExp(`\\b${constant.name}\\b`, "g");
        modifiedExpression = modifiedExpression.replace(regex, constant.value);
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
  };

  const renderExpressionWithConstants = (expression) => {
    const parts = expression.split(/(\s+)/); // Split by whitespace

    return parts.map((part, index) => {
      const constant = constants.find(
        (c) => c.name.toLowerCase() === part.trim().toLowerCase()
      );
      if (constant) {
        return (
          <span key={index} style={{ color: "blue", fontWeight: "bold" }}>
            {part}
          </span>
        );
      }
      return part; // Return as is if not a constant
    });
  };
  console.log(products);

  return (
    <div className="operations-container">
      <h2 className="header-title">Dimension Modifications</h2>
      <div className="dimension-inputs">
        {["weight", "height", "length", "width"].map((dim) => (
          <div className="dimension-item" key={dim}>
            <label>{dim.charAt(0).toUpperCase() + dim.slice(1)} :</label>
            <input
              type="text"
              placeholder={`Enter expression (e.g., x * 2, x + attr1)`}
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
                      setActiveIndex(-1);
                    }}
                  >
                    {constant.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <button className="apply-btn" onClick={handleApply}>
        Apply Changes
      </button>

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
