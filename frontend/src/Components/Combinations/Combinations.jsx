import React, { useState, useEffect } from "react";
import { MdOutlinePostAdd } from "react-icons/md";
import "./Combinations.css";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../assets/constants";

const generateRandomEAN12 = () => {
  // Force first three digits to "623"
  let ean12 = "623";
  // Generate the remaining 9 digits
  for (let i = 0; i < 9; i++) {
    ean12 += Math.floor(Math.random() * 10);
  }
  return ean12;
};

const calculateEAN13Checksum = (ean12) => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

const generateEAN13 = () => {
  const ean12 = generateRandomEAN12();
  const checksum = calculateEAN13Checksum(ean12);
  return `${ean12}${checksum}`;
};

const generateProductWithUniqueEAN = async (ms, parent, parentData) => {
  const uniqueEAN = generateEAN13();

  const parseDimension = (value) => {
    if (value === undefined || value === null || value === "") return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  return {
    supplierItemData: {
      supplier_id: parent[0].supplier_id,
      url: ms.URL,
      price_rmb: ms.price,
    },
    titemData: {
      parent_id: parentData.id,
      itemID_DE: uniqueEAN,
      parent_no_de: parentData.parent_no_de,
      supp_cat: parent[0].supp_cat,
      ean: uniqueEAN,
      tariff_code: parent[0].tariff_code,
      taric_id: parent[0].taric_id,
      weight: parseDimension(ms.weight),
      width: parseDimension(ms.width),
      height: parseDimension(ms.height),
      length: parseDimension(ms.length),
      item_name_cn: parentData.parent_name_cn,
      item_name_de: parentData.parent_name_de,
      item_name: parentData.parent_name_en,
      RMB_Price: ms.price,
    },
    variationValuesData: {
      item_id_de: uniqueEAN,
      item_no_de: uniqueEAN,
      value_de: ms.Attributes1,
      value_de_2: ms.Attributes2,
      value_de_3: ms.Attributes3,
      value_en: ms.Attributes1,
      value_en_2: ms.Attributes2,
      value_en_3: ms.Attributes3,
    },
  };
};

const Combinations = ({
  missingCombinations,
  parentData,
  parent,
  products,
  setProducts,
  setShowMData,
  setMissingCombinations,
  setDbData,
  setCsvData,
}) => {
  const [eanGenerated, setEanGenerated] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postedCount, setPostedCount] = useState(0);
  async function handlePostAll() {
    if (products.some((product) => product.titemData.weight === 0)) {
      alert("Weight of one or more items is 0");
      return;
    }

    if (!parentData.supplier_id || !parentData.taric_id) {
      toast.error("Supplier ID or Taric ID is missing in parent data.");
      return; // Prevent posting
    }

    if (!confirm(`Do you want to post all ${products.length} products?`))
      return;

    setIsPosting(true);
    setPostedCount(0);
    toast.loading(`Uploading products (0/${products.length})...`);

    try {
      const chunkSize = 100;
      const totalChunks = Math.ceil(products.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = products.slice(start, end);

        const res = await axios.post(`${BASE_URL}/products/add`, {
          products: chunk,
          parent_name: parentData.parent_name_en,
          parent_name_de: parentData.parent_name_de,
          parent_name_cn: parentData.name_cn,
        });

        if (res.status !== 200) {
          throw new Error(res.data.message || "Failed to upload chunk");
        }

        setPostedCount(Math.min(end, products.length));
        toast.update(
          `Uploading products (${Math.min(end, products.length)}/${
            products.length
          })...`
        );
      }

      // CSV export
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          [
            "Item Name",
            "Attribute 1",
            "Attribute 2",
            "Attribute 3",
            "Price (RMB)",
            "EAN",
            "Supp Cat",
            "Length",
            "Width",
            "Height",
            "Weight",
            "Tariff Code",
            "Taric ID",
          ].join(","),
          ...products.map((p) =>
            [
              p.titemData.item_name,
              p.variationValuesData.value_de,
              p.variationValuesData.value_de_2,
              p.variationValuesData.value_de_3,
              p.supplierItemData.price_rmb,
              p.titemData.ean,
              p.titemData.supp_cat,
              p.titemData.length,
              p.titemData.width,
              p.titemData.height,
              p.titemData.weight,
              p.titemData.tariff_code,
              p.titemData.taric_id,
            ].join(",")
          ),
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "uploaded_products.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Reset states
      toast.dismiss();
      setIsPosting(false);
      setShowMData(false);
      setMissingCombinations([]);
      setProducts([]);
      setCsvData([]);
      setDbData(null);
      alert("All products added successfully!");
    } catch (error) {
      toast.dismiss();
      setIsPosting(false);
      toast.error(error.response?.data?.message || error.message);
      console.error("Error uploading products:", error);
    }
  }

  // Only generate EANs/products one time, on first render
  useEffect(() => {
    const generateProducts = async () => {
      if (missingCombinations.length) {
        // Process in chunks to avoid memory issues with large datasets
        const chunkSize = 100;
        const totalChunks = Math.ceil(missingCombinations.length / chunkSize);
        let allNewProducts = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = start + chunkSize;
          const chunk = missingCombinations.slice(start, end);

          const newProducts = await Promise.all(
            chunk.map((ms) =>
              generateProductWithUniqueEAN(ms, parent, parentData)
            )
          );
          allNewProducts = [...allNewProducts, ...newProducts];
        }

        setProducts((prevProducts) => {
          const filteredNewProducts = allNewProducts.filter((newProduct) => {
            return !prevProducts.some(
              (product) =>
                product.supplierItemData.url === newProduct.supplierItemData.url
            );
          });
          return [...prevProducts, ...filteredNewProducts];
        });
      }
      // Mark EAN generation as done
      setEanGenerated(true);
    };

    if (!eanGenerated) {
      generateProducts();
    }
  }, [eanGenerated, missingCombinations, parent, parentData, setProducts]);

  return (
    <>
      {missingCombinations.length === 0 ? (
        <div
          style={{
            width: "100%",
            height: "60vh",
            display: "flex",
            overflow: "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontWeight: 600 }}>Oops, No Combinations Found</h1>
        </div>
      ) : (
        <>
          <button className="post-all-button" onClick={handlePostAll}>
            <MdOutlinePostAdd style={{ fontSize: "20px" }} />
            Post All
          </button>
          <div className="combinations-table-wrapper h-[59vh] overflow-auto">
            <table className="combinations-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Attribute 1</th>
                  <th>Attribute 2</th>
                  <th>Attribute 3</th>
                  <th>Price (RMB)</th>
                  <th>EAN</th>
                  <th>Supp Cat</th>
                  <th>Length</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Tariff Code</th>
                  <th>Taric ID</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.titemData.item_name}</td>
                    <td>{product.variationValuesData.value_de}</td>
                    <td>{product.variationValuesData.value_de_2}</td>
                    <td>{product.variationValuesData.value_de_3}</td>
                    <td>{product.supplierItemData.price_rmb}</td>
                    <td>{product.titemData.ean}</td>
                    <td>{product.titemData.supp_cat}</td>
                    <td>{product.titemData.length}</td>
                    <td>{product.titemData.width}</td>
                    <td>{product.titemData.height}</td>
                    <td>{product.titemData.weight}</td>
                    <td>{product.titemData.tariff_code}</td>
                    <td>{product.titemData.taric_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default Combinations;
