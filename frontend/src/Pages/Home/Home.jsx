import React, { useState, useEffect } from "react";
import "./Home.css";
import CsvData from "../../Components/CsvData/CsvData.jsx";
import DbData from "../../Components/DbData/DbData.jsx";
import MData from "../../Components/mData/mData";
import { FaExchangeAlt, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSearchParams, Link } from "react-router-dom";
import { getSingleProduct } from "../../apis/product.js";
import {
  getProductsBySubClass,
  getSingleSubClass,
  saveAttributeModifications,
} from "../../apis/classifications";

const Home = () => {
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState({});
  const [dbData, setDbData] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [orgCsvData, setOrgCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [missingCombinations, setMissingCombinations] = useState([]);
  const [commonData, setCommonData] = useState([]);
  const [showMData, setShowMData] = useState(false);
  const [parentData, setParentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subClassModifications, setSubClassModifications] = useState(null);
  const [hasModificationChanges, setHasModificationChanges] = useState(false);

  // Modified applyModifications function
  const applyModifications = (value, modifications) => {
    if (!modifications || !value) return value;

    let modifiedValue = String(value);

    // Apply remove
    if (modifications.remove) {
      modifiedValue = modifiedValue.replace(
        new RegExp(modifications.remove, "g"),
        ""
      );
    }

    // Apply find/replace
    if (modifications.find && modifications.replace) {
      modifiedValue = modifiedValue.replace(
        new RegExp(modifications.find, "g"),
        modifications.replace
      );
    }

    // Apply formula
    if (modifications.formula) {
      try {
        const numericValue = parseFloat(modifiedValue);
        if (!isNaN(numericValue)) {
          modifiedValue = String(
            eval(modifications.formula.replace(/x/g, numericValue))
          );
        }
      } catch (e) {
        console.error("Error applying formula:", e);
      }
    }

    // Apply prefix/suffix
    if (modifications.prefix) {
      modifiedValue = modifications.prefix + modifiedValue;
    }
    if (modifications.suffix) {
      modifiedValue = modifiedValue + modifications.suffix;
    }

    return modifiedValue;
  };

  // Transform product with modifications
  const transformProductToCSV = (product, modifications) => {
    if (!product || !product.combinations) return [];

    try {
      const combinations = Array.isArray(product.combinations)
        ? product.combinations
        : JSON.parse(product.combinations);

      return combinations.map((combination, index) => {
        const base = {
          No: (index + 1).toString(),
          URL: product.link || "",
          Title: product.title || "",
          price: combination.price?.toString() || "",
          ProductId: product._id || "",
          weight: product.weight,
          height: product.height,
          length: product.length,
          width: product.width,
        };

        // Apply modifications to each attribute
        const attributes = {
          Attributes1: applyModifications(
            combination.attribute1,
            modifications?.Attributes1
          ),
          Attributes2: applyModifications(
            combination.attribute2,
            modifications?.Attributes2
          ),
          Attributes3: applyModifications(
            combination.attribute3,
            modifications?.Attributes3
          ),
          Attributes4: applyModifications(
            combination.attribute4,
            modifications?.Attributes4
          ),
          Attributes5: applyModifications(
            combination.attribute5,
            modifications?.Attributes5
          ),
        };

        return { ...base, ...attributes };
      });
    } catch (error) {
      console.error("Error transforming product to CSV:", error);
      return [];
    }
  };

  // Transform products with modifications
  const transformProductsToCSV = (products, modifications) => {
    if (!products || !Array.isArray(products)) return [];

    let allCombinations = [];
    let combinationIndex = 1;

    products.forEach((product) => {
      const productCombinations = transformProductToCSV(
        product,
        modifications
      ).map((combination) => {
        const currentIndex = combinationIndex;
        combinationIndex += 1;
        return {
          ...combination,
          No: String(currentIndex),
        };
      });
      allCombinations = [...allCombinations, ...productCombinations];
    });

    return allCombinations;
  };
  const processData = (transformedData) => {
    if (transformedData.length > 0) {
      const dataHeaders = Object.keys(transformedData[0]);
      setHeaders(dataHeaders);
      setCsvData(transformedData);
      setOrgCsvData(transformedData);
      return createInitialModifications(dataHeaders);
    }
  };

  const createInitialModifications = (headers) => {
    return headers.reduce((acc, header) => {
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
  };

  // Fetch data with modificationscreateInitialModifications
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productId = searchParams.get("productId");
        const subClassId = searchParams.get("subClassId");

        if (subClassId) {
          const subclassResponse = await getSingleSubClass(subClassId);
          if (subclassResponse?.success) {
            const modifications = JSON.parse(
              subclassResponse.data.attributeModifications
            );
            console.log("Modifications", modifications);

            setSubClassModifications(modifications);

            const response = await getProductsBySubClass(subClassId);
            if (response?.data) {
              const transformedData = transformProductsToCSV(
                response.data,
                modifications
              );
              if (transformedData.length > 0) {
                processData(transformedData);
                toast.success(
                  `Loaded ${response.data.length} products from subclass`
                );
              }
            }
          }
        } else if (productId) {
          // Existing product loading logic
          const response = await getSingleProduct(productId);
          if (response.success) {
            setProduct(response.data);
            const transformedData = transformProductToCSV(response.data);
            if (transformedData.length > 0) {
              processData(transformedData);
              toast.success("Product data loaded successfully");
            }
          }
        }
      } catch (error) {
        toast.error("Error fetching data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Save modifications handler
  const handleSaveModifications = async () => {
    const subClassId = searchParams.get("subClassId");
    if (!subClassId) return;

    try {
      await saveAttributeModifications(subClassId, subClassModifications);
      toast.success("Modifications saved successfully");
      setHasModificationChanges(false);
    } catch (error) {
      toast.error("Failed to save modifications");
    }
  };

  // Add this new button to the UI
  const renderSaveButton = () => (
    <button
      className="save-modifications-btn"
      onClick={handleSaveModifications}
      disabled={!hasModificationChanges}
    >
      <FaSave /> Save Modifications
    </button>
  );

  return (
    <div className="home-container">
      {/* Add save button at the top */}
      {searchParams.get("subClassId") && renderSaveButton()}

      {/* Existing comparison button */}
      <div className="attribute-selection">
        <button
          className={`mb-[2rem] ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
          onClick={() => {
            if (csvData.length === 0 || dbData === null) {
              toast.error("Please Load Master Data and Csv Data!");
              return;
            }
            if (!checkAttributesEquality()) {
              toast.error("Mismatched attributes between CSV and DB data");
              return;
            }
            compareValues();
            setShowMData(true);
          }}
        >
          <FaExchangeAlt /> Perform Comparison
        </button>
      </div>

      {/* Existing data containers */}
      <div className="home-box">
        <DbData
          setDbData={setDbData}
          dbData={dbData}
          parentData={parentData}
          setParentData={setParentData}
        />
        <CsvData
          dbData={dbData}
          csvData={csvData}
          setCsvData={setCsvData}
          headers={headers}
          setHeaders={setHeaders}
          orgCsvData={orgCsvData}
          initialData={csvData.length > 0}
          setOrgCsvData={setOrgCsvData}
          isLoading={isLoading}
          initialModifications={subClassModifications}
          onModificationsChange={(mods) => {
            setSubClassModifications(mods);
            setHasModificationChanges(true);
          }}
        />
      </div>
    </div>
  );
};

export default Home;
