import express from "express";
import db from "./config/database.js";
import fs from "fs/promises";
import { createObjectCsvWriter as createCsvWriter } from "csv-writer";
import cors from "cors";
import constantsRouter from "./routes/constants.js";
import dotenv from "dotenv";
import Shop from "./models/shops.js";
import Category from "./models/category.js";
import sequelize from "./config/db.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import shopsRoutes from "./routes/shopRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import classificationRoutes from "./routes/classificationRoutes.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    "https://item.taobao.com",
    "https://gtech-tools.com",
    "https://linkcnc.world.taobao.com",
    "https://gtech-tools.com",
    "http://localhost:5173",
  ],
  credentials: true,
  "Access-Control-Allow-Origin": "https://gtech-tools.com",
};

app.use(express.json());
app.use(cors(corsOptions));

// Routes Middlewares

app.use("/api/v1/shop", shopsRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/constants", constantsRouter);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/classifications", classificationRoutes);

app.post("/csv/download", async (req, res) => {
  try {
    let { arr } = req.body;
    const csvPath = "product.csv";
    const maxAttributes = Math.max(
      ...arr.map((item) => item.attributes.length)
    );
    const headers = [
      { id: "number", title: "No" },
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "price", title: "price" },
    ];

    for (let i = 1; i <= maxAttributes; i++) {
      headers.push({ id: `attributes${i}`, title: `Attributes${i}` });
    }

    const csvWriter = createCsvWriter({
      path: csvPath,
      header: headers,
      fieldDelimiter: ";",
    });

    const records = arr.map((item, index) => {
      const record = {
        number: index + 1,
        url: item.url || "",
        title: item.title || "",
        price: item.price || "",
      };

      item.attributes.forEach((attribute, idx) => {
        record[`attributes${idx + 1}`] = attribute || "";
      });

      return record;
    });

    console.log("Records to write:", records);
    await csvWriter.writeRecords(records);

    res.download(csvPath, "product.csv", (err) => {
      if (err) {
        console.error("Error sending the file:", err);
        res.status(500).send("Error sending the file.");
      }
    });
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
});
app.get("/data/:name", (req, res) => {
  try {
    let { name } = req.params;
    const query = `SELECT * FROM parent_data WHERE parent_name_en LIKE ?`;

    db.query(query, [`%${name}%`], (err, parentResults) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      if (parentResults.length === 0) {
        return res
          .status(404)
          .json({ message: "No matching entries found in parent_data" });
      }

      const parentId = parentResults[0].id;
      const parentData = parentResults[0];

      const titemsQuery = `SELECT * FROM titems WHERE parent_id = ?`;

      db.query(titemsQuery, [parentId], (err, titemsResults) => {
        if (err) {
          console.error("Error executing query:", err);
          return res.status(500).json({ message: err.message });
        }

        if (titemsResults.length === 0) {
          return res.status(200).json({
            message: "No items found in titems",
            parentData, // Include parentData in the response
          });
        }

        const titemIds = titemsResults.map((item) => item.id);

        const supplierItemsQuery = `SELECT * FROM supplier_items WHERE item_id IN (?)`;
        db.query(
          supplierItemsQuery,
          [titemIds],
          (err, supplierItemsResults) => {
            if (err) {
              console.error("Error executing query:", err);
              return res.status(500).json({ message: err.message });
            }

            if (supplierItemsResults.length === 0) {
              return res.status(200).json({
                message: "No supplier items found",
                parentData,
              });
            }

            const variationValuesQuery = `SELECT * FROM variation_values WHERE item_id IN (?)`;
            db.query(
              variationValuesQuery,
              [titemIds],
              (err, variationValuesResults) => {
                if (err) {
                  console.error("Error executing query:", err);
                  return res.status(500).json({ message: err.message });
                }

                const mergedResults = titemsResults.map((titem) => {
                  const supplierItem =
                    supplierItemsResults.find(
                      (item) => item.item_id === titem.id
                    ) || {};
                  const variationValue =
                    variationValuesResults.find(
                      (value) => value.item_id === titem.id
                    ) || {};

                  return {
                    ...titem,
                    ...supplierItem,
                    ...variationValue,
                  };
                });

                res.status(200).json({
                  parent: mergedResults,
                  parentData,
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

app.put("/data/update", async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }
    data.forEach(({ dbData, csvData }) => {
      const newURL = csvData.URL;
      const newPrice = csvData.price;

      const itemId = dbData.item_id;
      const updateQuery = `
        UPDATE supplier_items
        SET url = ?, price_rmb = ?
        WHERE item_id = ?;
      `;

      db.query(updateQuery, [newURL, newPrice, itemId], (err, result) => {
        if (err) {
          console.error("Error executing query for item_id:", itemId, err);
          return res.status(500).json({
            message: `Error updating supplier items for item_id ${itemId}.`,
          });
        }
      });
    });

    res.status(200).json({ message: "Parent Data Updated successfully." });
  } catch (error) {
    console.error("Updating Data Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/products/add", async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "No products provided" });
  }

  try {
    const usedEansQuery = `SELECT ean FROM eans WHERE is_used = 'Y'`;
    const usedEansResult = await new Promise((resolve, reject) => {
      db.query(usedEansQuery, (err, result) => {
        if (err) {
          console.error("Error fetching used EANs:", err);
          return reject({ message: "Failed to retrieve EAN data" });
        }
        resolve(result);
      });
    });
    const usedEans = usedEansResult.map((row) => row.ean);

    for (let product of products) {
      const { supplierItemData, titemData, variationValuesData } = product;

      if (
        !titemData ||
        !titemData.parent_id ||
        !titemData.itemID_DE ||
        !titemData.item_name
      ) {
        return res.status(400).json({ message: "Missing titem data" });
      }

      if (usedEans.includes(titemData.ean)) {
        return res
          .status(400)
          .json({ message: `EAN ${titemData.ean} is already in use` });
      }

      const titemsQuery = `INSERT INTO titems (parent_id, itemID_DE, parent_no_de, supp_cat, ean, tariff_code, taric_id, weight, width, height, length, item_name_cn, item_name, RMB_Price, is_new, is_npr, npr_remark, ISBN, many_components, effort_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const titemsValues = [
        titemData.parent_id,
        titemData.itemID_DE,
        titemData.parent_no_de,
        titemData.supp_cat,
        titemData.ean,
        titemData.tariff_code,
        titemData.taric_id,
        titemData.weight,
        titemData.width,
        titemData.height,
        titemData.length,
        `${titemData.item_name_cn || "CN"} ${
          variationValuesData.value_de || ""
        }${
          variationValuesData.value_de_2
            ? "-" + variationValuesData.value_de_2
            : ""
        }${
          variationValuesData.value_de_3
            ? "-" + variationValuesData.value_de_3
            : ""
        }`,
        `${titemData.item_name || "EN"} ${variationValuesData.value_de || ""}${
          variationValuesData.value_de_2
            ? "-" + variationValuesData.value_de_2
            : ""
        }${
          variationValuesData.value_de_3
            ? "-" + variationValuesData.value_de_3
            : ""
        }`,
        titemData.RMB_Price,
        "Y",
        "Y",
        "Bulk NewItem Creation",
        1,
        1,
        3,
      ];

      let insertedItemId;
      await new Promise((resolve, reject) => {
        db.query(titemsQuery, titemsValues, (err, titemsResult) => {
          if (err) {
            console.error("Error inserting titem:", err);
            return reject({
              message: `Failed to add item ${titemData.item_name}`,
            });
          }
          insertedItemId = titemsResult.insertId;
          resolve(titemsResult);
        });
      });

      if (!supplierItemData || !supplierItemData.supplier_id) {
        return res.status(400).json({ message: "Missing supplier item data" });
      }
      const supplierQuery = `INSERT INTO supplier_items (item_id, supplier_id, url, price_rmb) VALUES (?, ?, ?, ?)`;
      const supplierValues = [
        insertedItemId,
        supplierItemData.supplier_id,
        supplierItemData.url,
        supplierItemData.price_rmb,
      ];
      await new Promise((resolve, reject) => {
        db.query(supplierQuery, supplierValues, (err, supplierResult) => {
          if (err) {
            console.error("Error inserting supplier item:", err);
            return reject({
              message: `Failed to add supplier data for item ${titemData.item_name}`,
            });
          }
          resolve(supplierResult);
        });
      });

      if (!variationValuesData || !variationValuesData.item_id_de) {
        return res
          .status(400)
          .json({ message: "Missing variation values data" });
      }
      const variationQuery = `INSERT INTO variation_values (item_id, item_id_de, item_no_de, value_de, value_de_2, value_de_3, value_en, value_en_2, value_en_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const variationValues = [
        insertedItemId,
        variationValuesData.item_id_de,
        variationValuesData.item_no_de,
        variationValuesData.value_de,
        variationValuesData.value_de_2,
        variationValuesData.value_de_3,
        variationValuesData.value_en,
        variationValuesData.value_en_2,
        variationValuesData.value_en_3,
      ];
      await new Promise((resolve, reject) => {
        db.query(variationQuery, variationValues, (err, variationResult) => {
          if (err) {
            console.error("Error inserting variation value:", err);
            return reject({
              message: `Failed to add variation data for item ${titemData.item_name}`,
            });
          }
          resolve(variationResult);
        });
      });

      const warehouseQuery = `INSERT INTO warehouse_items (item_id, ItemID_DE, ean, item_no_de, item_name_de, item_name_en, is_no_auto_order, is_active, price_eur, msq, buffer, is_stock_item, is_SnSI, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      const warehouseValues = [
        insertedItemId,
        titemData.itemID_DE,
        titemData.ean,
        variationValuesData.item_no_de,
        `${titemData.item_name_de} ${variationValuesData.value_de || ""}${
          variationValuesData.value_de_2
            ? "-" + variationValuesData.value_de_2
            : ""
        }${
          variationValuesData.value_de_3
            ? "-" + variationValuesData.value_de_3
            : ""
        }`,
        `${titemData.item_name} ${variationValuesData.value_de || ""}${
          variationValuesData.value_de_2
            ? "-" + variationValuesData.value_de_2
            : ""
        }${
          variationValuesData.value_de_3
            ? "-" + variationValuesData.value_de_3
            : ""
        }`,
        "N",
        "Y",
        0.0,
        0.0,
        0,
        "Y",
        "Y",
      ];
      await new Promise((resolve, reject) => {
        db.query(warehouseQuery, warehouseValues, (err, warehouseResult) => {
          if (err) {
            console.error("Error inserting into warehouse_items:", err);
            return reject({
              message: `Failed to add warehouse data for item ${titemData.item_name}`,
            });
          }
          resolve(warehouseResult);
        });
      });

      const updateEanQuery = `UPDATE eans SET is_used = 'Y', updated_at = NOW() WHERE ean = ?`;
      await new Promise((resolve, reject) => {
        db.query(updateEanQuery, [titemData.ean], (err, updateResult) => {
          if (err) {
            console.error("Error updating EAN:", err);
            return reject({ message: `Failed to update EAN ${titemData.ean}` });
          }
          resolve(updateResult);
        });
      });
    }

    res.status(200).json({ message: "Products added successfully" });
  } catch (error) {
    console.error("Error processing products:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

app.get("/search", (req, res) => {
  let { en_name } = req.query;

  const query = `SELECT * FROM parent_data WHERE parent_name_en LIKE ?`;

  try {
    db.query(query, [`%${en_name}%`], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({ error: "Database query error" });
      }

      return res.json(results);
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

Shop.hasMany(Category, {
  foreignKey: "shopId",
});

Category.belongsTo(Shop, {
  foreignKey: "shopId",
});

async function syncModels() {
  try {
    await sequelize.sync({ alter: true, logging: false });
    console.log("Database synced successfully!");
  } catch (error) {
    console.error("Error syncing the database:", error);
  }
}

syncModels();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Error Middleware
app.use(errorMiddleware);

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`Server is Working on port:${PORT}`);
});

export { sequelize, Shop, Category };
