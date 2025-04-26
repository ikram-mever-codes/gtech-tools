import express from "express";
import {
  createClassification,
  updateClassification,
  deleteClassification,
  getClassificationDetails,
  getAllClassifications,
  addProductsToSubClass,
  removeProductsFromSubClass,
  getProductsBySubClass,
  getSubClassDetails,
  getAttributeModifications,
  saveAttributeModifications,
  saveDimensionOperations,
  getDimensionOperations,
} from "../controllers/classificationController.js";

const router = express.Router();

// Classification routes
router.post("/", createClassification);
router.put("/:id", updateClassification);
router.delete("/:id", deleteClassification);
router.get("/single/:id", getClassificationDetails);
router.get("/single/subclass/:id", getSubClassDetails);
router.get("/all", getAllClassifications);

// SubClass and Product management routes
router.post("/subclass/:subClassId/products", addProductsToSubClass);
router.delete("/subclass/:subClassId/products", removeProductsFromSubClass);
router.get("/subclass/:subClassId/products", getProductsBySubClass);

// Attribute modifications routes
router.put("/subclass/:subClassId/modifications", saveAttributeModifications);
router.get("/subclass/:subClassId/modifications", getAttributeModifications);

// Dimension operations routes
router.put(
  "/subclass/:subClassId/dimension-operations",
  saveDimensionOperations
);
router.get(
  "/subclass/:subClassId/dimension-operations",
  getDimensionOperations
);

export default router;
