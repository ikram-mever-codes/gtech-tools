import React, { useState, useEffect } from "react";
import "./Home.css";
import CsvData from "../../Components/CsvData/CsvData.jsx";
import DbData, { handleDataLoad } from "../../Components/DbData/DbData.jsx";
import MData from "../../Components/mData/mData";
import { FaExchangeAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { getSingleProduct } from "../../apis/product.js";
import {
  getProductsBySubClass,
  getSingleSubClass,
} from "../../apis/classifications";
import Loading from "../../Components/Loading.jsx";

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
  const [parentLoaded, setParentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subClassModifications, setSubClassModifications] = useState(null);
  const [subClassDimensionOps, setSubClassDimensionOps] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const applyModifications = (value, modifications) => {
    if (!modifications || !value) return value;

    let modifiedValue = String(value);

    if (modifications.remove) {
      modifiedValue = modifiedValue.replace(
        new RegExp(modifications.remove, "g"),
        ""
      );
    }

    if (modifications.find && modifications.replace) {
      modifiedValue = modifiedValue.replace(
        new RegExp(modifications.find, "g"),
        modifications.replace
      );
    }

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

    if (modifications.prefix)
      modifiedValue = modifications.prefix + modifiedValue;
    if (modifications.suffix)
      modifiedValue = modifiedValue + modifications.suffix;

    return modifiedValue;
  };

  const applyDimensionOperation = (value, operation, attributes = {}) => {
    if (!operation) return value;
    try {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return value;

      let modifiedExpression = operation
        .replace(/x/g, numericValue)
        .replace(/attr1/g, attributes.attr1 || 0)
        .replace(/attr2/g, attributes.attr2 || 0)
        .replace(/attr3/g, attributes.attr3 || 0);

      const result = eval(modifiedExpression);
      return isNaN(result) ? value : result;
    } catch (e) {
      console.error("Error applying dimension operation:", e);
      return value;
    }
  };

  const transformProductToCSV = (
    product,
    modifications,
    dimensionOperations
  ) => {
    if (!product || !product.combinations) return [];

    try {
      const combinations = Array.isArray(product.combinations)
        ? product.combinations
        : JSON.parse(product.combinations);

      return combinations.map((combination, index) => {
        const attributes = {
          attr1: combination.attribute1,
          attr2: combination.attribute2,
          attr3: combination.attribute3,
        };

        // Get dimension values with fallback to product dimensions if not in combination
        const getDimensionValue = (dimension) => {
          return combination[dimension] !== undefined
            ? combination[dimension]
            : 0;
        };

        const applyDimOp = (dimension) => {
          const dimensionValue = getDimensionValue(dimension);
          if (!dimensionOperations?.[dimension]) return dimensionValue;
          return applyDimensionOperation(
            dimensionValue,
            dimensionOperations[dimension],
            attributes
          );
        };

        return {
          No: (index + 1).toString(),
          URL: product.link || "",
          Title: product.title || "",
          price: combination.price?.toString() || "",
          ProductId: product._id || "",
          weight: applyDimOp("weight"),
          height: applyDimOp("height"),
          length: applyDimOp("length"),
          width: applyDimOp("width"),
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
      });
    } catch (error) {
      console.error("Error transforming product to CSV:", error);
      return [];
    }
  };

  const transformProductsToCSV = (
    products,
    modifications,
    dimensionOperations
  ) => {
    if (!products || !Array.isArray(products)) return [];

    let allCombinations = [];
    let combinationIndex = 1;

    products.forEach((product) => {
      const productCombinations = transformProductToCSV(
        product,
        modifications,
        dimensionOperations
      ).map((combination) => ({
        ...combination,
        No: String(combinationIndex++),
      }));
      console.log(productCombinations);
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
    }
  };

  const compareValues = () => {
    let currentFilteredData = [...csvData];
    let foundCommonData = [];

    if (dbData) {
      dbData.forEach((item) => {
        const matches = [
          (item2) => item2.Attributes1 === item.value_de,
          (item2) => item2.Attributes2 === item.value_de_2,
          (item2) => item2.Attributes3 === item.value_de_3,
        ];

        let matchIndex = currentFilteredData.findIndex((item2) =>
          matches.every((fn) => fn(item2))
        );

        if (matchIndex !== -1) {
          foundCommonData.push({
            dbData: item,
            csvData: currentFilteredData[matchIndex],
          });
          currentFilteredData.splice(matchIndex, 1);
        }
      });
    }

    setMissingCombinations(currentFilteredData);
    setCommonData(foundCommonData);
  };

  const checkAttributesEquality = () => {
    if (!csvData.length || !dbData?.length) return false;
    const csvAttrs = [
      csvData[0]?.Attributes1,
      csvData[0]?.Attributes2,
      csvData[0]?.Attributes3,
    ].filter(Boolean).length;
    const dbAttrs = [
      dbData[0]?.value_de,
      dbData[0]?.value_de_2,
      dbData[0]?.value_de_3,
    ].filter(Boolean).length;
    return csvAttrs === dbAttrs;
  };

  const fetchData = async () => {
    setIsLoading(true);
    setDataLoaded(false);

    try {
      const productId = searchParams.get("productId");
      const subClassId = searchParams.get("subClassId");

      if (subClassId) {
        const subclassResponse = await getSingleSubClass(subClassId);
        if (!subclassResponse?.success)
          throw new Error("Failed to load subclass data");

        let parentLoadPromise = Promise.resolve();
        if (subclassResponse.data.parent) {
          parentLoadPromise = handleDataLoad(
            subclassResponse.data.parent,
            setDbData,
            setParentData
          ).then(() => setParentLoaded(true));
        }

        const modifications = subclassResponse.data.attributeModifications
          ? JSON.parse(subclassResponse.data.attributeModifications)
          : null;

        const dimensionOperations = subclassResponse.data.dimensionOperations
          ? JSON.parse(subclassResponse.data.dimensionOperations)
          : null;

        setSubClassModifications(modifications);
        setSubClassDimensionOps(dimensionOperations);

        const productsResponse = await getProductsBySubClass(subClassId);
        if (!productsResponse?.data) throw new Error("Failed to load products");

        const transformedData = transformProductsToCSV(
          productsResponse.data,
          modifications,
          dimensionOperations
        );

        if (transformedData.length === 0)
          throw new Error("No valid product combinations found");

        await parentLoadPromise;
        processData(transformedData);
        toast.success(
          `Loaded ${productsResponse.data.length} products from subclass`
        );
      } else if (productId) {
        const response = await getSingleProduct(productId);
        if (!response.success) throw new Error("Failed to load product");

        setProduct(response.data);
        const transformedData = transformProductToCSV(response.data);
        if (transformedData.length === 0)
          throw new Error("No valid product combinations found");

        processData(transformedData);
        toast.success("Product data loaded successfully");
      }

      setDataLoaded(true);
    } catch (error) {
      toast.error("Error fetching data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  if (searchParams.get("subClassId") && (!dataLoaded || isLoading)) {
    return <Loading />;
  }

  return (
    <div className="home-container">
      {showMData && (
        <MData
          setShowMData={setShowMData}
          missingCombinations={missingCombinations}
          setMissingCombinations={setMissingCombinations}
          parentData={parentData}
          parent={dbData}
          subClassDimensionOps={subClassDimensionOps}
          setParentData={setParentData}
          setCsvData={setCsvData}
          setDbData={setDbData}
          commonData={commonData}
          setCommonData={setCommonData}
        />
      )}
      <div className="attribute-selection">
        <button
          className={`mb-[2rem] ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
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

      <div className="home-box">
        <DbData
          setDbData={setDbData}
          dbData={dbData}
          parentData={parentData}
          setParentData={setParentData}
          initialParent={
            searchParams.get("subClassId") && parentLoaded ? parentData : null
          }
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
          onModificationsChange={setSubClassModifications}
          subClass={subClassModifications}
          subClassId={searchParams.get("subClassId")}
        />
      </div>
    </div>
  );
};

export default Home;
