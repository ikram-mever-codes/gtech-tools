import React, { useState, useEffect } from "react";
import "./Home.css";
import CsvData from "../../Components/CsvData/CsvData.jsx";
import DbData from "../../Components/DbData/DbData.jsx";
import MData from "../../Components/mData/mData";
import { FaExchangeAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSearchParams, Link } from "react-router-dom";
import { getSingleProduct } from "../../apis/product.js";
import { getProductsBySubClass } from "../../apis/classifications";

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

  // Transform single product combinations to CSV format
  const transformProductToCSV = (product) => {
    if (!product || !product.combinations) return [];

    try {
      const combinations = Array.isArray(product.combinations)
        ? product.combinations
        : JSON.parse(product.combinations);

      return combinations.map((combination, index) => ({
        No: (index + 1).toString(),
        URL: product.link || "",
        Title: product.title || "",
        price: combination.price?.toString() || "",
        Attributes1: combination.attribute1 || "",
        Attributes2: combination.attribute2 || "",
        Attributes3: combination.attribute3 || "",
        Attributes4: combination.attribute4 || "",
        Attributes5: combination.attribute5 || "",
        ProductId: product._id || "", // Added to track source product
      }));
    } catch (error) {
      console.error("Error transforming product to CSV:", error);
      return [];
    }
  };

  // Transform multiple products' combinations to CSV format
  const transformProductsToCSV = (products) => {
    if (!products || !Array.isArray(products)) return [];

    let allCombinations = [];
    let combinationIndex = 1;

    products.forEach((product) => {
      const productCombinations = transformProductToCSV(product).map(
        (combination) => {
          const currentIndex = combinationIndex;
          combinationIndex += 1;
          return {
            ...combination,
            No: String(currentIndex),
          };
        }
      );
      allCombinations = [...allCombinations, ...productCombinations];
    });

    return allCombinations;
  };
  // Initialize modifications structure
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

  // Process CSV data
  const processData = (transformedData) => {
    if (transformedData.length > 0) {
      const dataHeaders = Object.keys(transformedData[0]);
      setHeaders(dataHeaders);
      setCsvData(transformedData);
      setOrgCsvData(transformedData);
      return createInitialModifications(dataHeaders);
    }
  };

  // Fetch data based on query parameters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productId = searchParams.get("productId");
        const subClassId = searchParams.get("subClassId");

        if (subClassId) {
          // Fetch all products from subclass
          const response = await getProductsBySubClass(subClassId);
          if (response?.data) {
            const transformedData = transformProductsToCSV(response.data);
            if (transformedData.length > 0) {
              processData(transformedData);
              toast.success(
                `Loaded ${response.data.length} products from subclass`
              );
            } else {
              toast.warning("No products found in subclass");
            }
          }
        } else if (productId) {
          // Fetch single product
          const response = await getSingleProduct(productId);
          if (response.success) {
            setProduct(response.data);
            const transformedData = transformProductToCSV(response.data);
            if (transformedData.length > 0) {
              processData(transformedData);
              toast.success("Product data loaded successfully");
            }
          } else {
            toast.error("Failed to fetch product data");
          }
        }
      } catch (error) {
        toast.error("Error fetching data: " + error.message);
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

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

    const csvAttributesCount = Math.max(
      csvData[0]?.Attributes1 ? 1 : 0,
      csvData[0]?.Attributes2 ? 2 : 0,
      csvData[0]?.Attributes3 ? 3 : 0
    );

    const dbAttributesCount = Math.max(
      dbData[0]?.value_de ? 1 : 0,
      dbData[0]?.value_de_2 ? 2 : 0,
      dbData[0]?.value_de_3 ? 3 : 0
    );

    return csvAttributesCount === dbAttributesCount;
  };

  return (
    <div className="home-container">
      {showMData && (
        <MData
          setShowMData={setShowMData}
          missingCombinations={missingCombinations}
          setMissingCombinations={setMissingCombinations}
          parentData={parentData}
          parent={dbData}
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
          disabled={isLoading}
          onClick={() => {
            if (csvData.length === 0 || dbData === null) {
              toast.error("Please Load Master Data and Csv Data!");
              return;
            }
            if (!checkAttributesEquality()) {
              toast.error(
                "The number of attributes in CSV and DB data are not equal. Please make sure both have the same number of attributes."
              );
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
        />
      </div>
    </div>
  );
};

export default Home;
