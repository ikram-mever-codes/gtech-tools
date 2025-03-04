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

export default router;
