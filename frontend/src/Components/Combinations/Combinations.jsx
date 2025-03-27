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

  async function handlePostAll() {
    if (products.some((product) => product.titemData.weight === 0)) {
      alert("Weight of one or more items is 0");
      return;
    }
    if (!confirm("Do you want to post all products?")) return;
    toast.loading("Uploading Products...");
    try {
      let res = await axios.post(
        `${BASE_URL}/products/add`,
        {
          products,
          parent_name: parentData.parent_name_en,
          parent_name_de: parentData.parent_name_de,
          parent_name_cn: parentData.name_cn,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.dismiss();
      if (res.status !== 200) {
        toast.error(res.data.message);
        return;
      }
      setShowMData(false);
      setMissingCombinations([]);
      setProducts([]);
      setCsvData([]);
      setDbData(null);
      alert("Products Added Successfully!");
      // toast.success(res.data.message);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message);
    }
  }
  console.log(parentData);
  // Only generate EANs/products one time, on first render
  useEffect(() => {
    const generateProducts = async () => {
      if (missingCombinations.length) {
        const newProducts = await Promise.all(
          missingCombinations.map((ms) =>
            generateProductWithUniqueEAN(ms, parent, parentData)
          )
        );

        setProducts((prevProducts) => {
          const filteredNewProducts = newProducts.filter((newProduct) => {
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
