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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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

    // Track results of all updates
    const results = await Promise.allSettled(
      data.map(({ dbData, csvData }) => {
        return new Promise((resolve, reject) => {
          const newURL = csvData.URL;
          const newPrice = csvData.price;
          const itemId = dbData.item_id;

          // Validate inputs
          if (!itemId) {
            return reject(`Missing item_id for update`);
          }

          const updateQuery = `
            UPDATE supplier_items
            SET url = ?, price_rmb = ?
            WHERE item_id = ?;
          `;

          db.query(updateQuery, [newURL, newPrice, itemId], (err, result) => {
            if (err) {
              console.error("Error executing query for item_id:", itemId, err);
              reject({ itemId, error: err.message });
            } else if (result.affectedRows === 0) {
              reject({
                itemId,
                error: "No rows affected - item may not exist",
              });
            } else {
              resolve({ itemId, success: true });
            }
          });
        });
      })
    );

    // Analyze results
    const successfulUpdates = results.filter((r) => r.status === "fulfilled");
    const failedUpdates = results.filter((r) => r.status === "rejected");

    if (failedUpdates.length > 0) {
      console.error("Some updates failed:", failedUpdates);
      return res.status(207).json({
        // 207 Multi-Status
        message: "Some updates failed",
        successCount: successfulUpdates.length,
        failedCount: failedUpdates.length,
        failedUpdates: failedUpdates.map((f) => f.reason),
      });
    }

    res.status(200).json({
      message: "All items updated successfully.",
      updatedCount: successfulUpdates.length,
    });
  } catch (error) {
    console.error("Updating Data Error:", error);
    res.status(500).json({
      message: "Internal server error during updates",
      error: error.message || "Server error",
    });
  }
});

app.post("/products/add", async (req, res) => {
  const { products, parent_name, parent_name_de, parent_name_cn } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "No products provided" });
  }

  try {
    // Fetch used EANs
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

    // Insert EANs into the eans table before processing products
    for (let product of products) {
      const { titemData } = product;

      if (!titemData || !titemData.ean) {
        return res.status(400).json({ message: "Missing EAN in product data" });
      }

      if (usedEans.includes(titemData.ean)) {
        return res
          .status(400)
          .json({ message: `EAN ${titemData.ean} is already in use` });
      }

      const insertEanQuery = `INSERT INTO eans (ean, is_used,  updated_at) VALUES (?, 'N',  NOW())`;
      await new Promise((resolve, reject) => {
        db.query(insertEanQuery, [titemData.ean], (err, result) => {
          if (err) {
            console.error("Error inserting EAN:", err);
            return reject({ message: `Failed to insert EAN ${titemData.ean}` });
          }
          resolve(result);
        });
      });
    }

    // Process products
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

      const checkEANQuery = `SELECT COUNT(*) AS count FROM titems WHERE ean = ?`;
      const existingEAN = await new Promise((resolve, reject) => {
        db.query(checkEANQuery, [titemData.ean], (err, result) => {
          if (err) {
            console.error("Error checking existing EAN:", err);
            return reject({ message: "Failed to check EAN before insert" });
          }
          resolve(result[0].count);
        });
      });

      if (existingEAN > 0) {
        return res.status(400).json({
          message: `EAN ${titemData.ean} already exists in the database`,
        });
      }

      const titemsQuery = `
      INSERT INTO titems (parent_id, itemID_DE, parent_no_de, supp_cat, ean, taric_id, weight, width, height, length, item_name_cn, item_name, RMB_Price, is_new, is_npr,  ISBN, many_components, effort_rating, cat_id, photo, pix_path, pix_path_ebay,created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ? , ?,  ?, ? ,NOW(), NOW())
      ON DUPLICATE KEY UPDATE item_name = VALUES(item_name), RMB_Price = VALUES(RMB_Price)
    `;

      const attributesPart = [
        variationValuesData.value_de,
        variationValuesData.value_de_2,
        variationValuesData.value_de_3,
      ]
        .filter(Boolean)
        .join("-");

      const itemNameEn = `${parent_name} ${attributesPart}`;
      const itemNameDe = `${parent_name_de} ${attributesPart}`;
      const itemNameCn = `${
        parent_name_cn ? parent_name_cn : parent_name
      } ${attributesPart}`;

      const titemsValues = [
        titemData.parent_id,
        titemData.ean,
        titemData.parent_no_de,
        titemData.supp_cat,
        titemData.ean,
        titemData.taric_id,
        titemData.weight,
        titemData.width,
        titemData.height,
        titemData.length,
        itemNameCn,
        itemNameEn,
        titemData.RMB_Price,
        "Y",
        "N",
        1,
        1,
        3,
        1,
        "DummyPicture.jpg",
        "DummyPicture.jpg",
        "DummyPicture.jpg",
      ];

      let insertedItemId;
      await new Promise((resolve, reject) => {
        db.query(titemsQuery, titemsValues, (err, titemsResult) => {
          if (err) {
            console.error("Error inserting/updating titem:", err);
            return reject({
              message: `Failed to add/update item ${titemData.item_name}`,
            });
          }
          insertedItemId = titemsResult.insertId || existingEAN;
          resolve(titemsResult);
        });
      });

      // Insert into supplier_items table
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

      // Insert into variation_values table
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

      // Insert into warehouse_items table
      const warehouseQuery = `
          INSERT INTO warehouse_items (item_id, ItemID_DE, ean, item_no_de, item_name_de, item_name_en, is_no_auto_order, is_active, msq, buffer, is_stock_item, is_SnSI, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const warehouseValues = [
        insertedItemId,
        titemData.ean,
        titemData.ean,
        titemData.ean,
        itemNameDe,
        itemNameEn,
        "N",
        "Y",
        0,
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

      // Update eans table
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
