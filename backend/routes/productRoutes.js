import express from "express";
import {
  addProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  getProductByLink,
  deleteProduct,
  scrapeCategoryProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", addProduct);
router.put("/:id", updateProduct);
router.get("/all", getAllProducts);
router.get("/single/:id", getProductById);
router.get("/by-link", getProductByLink);
router.get("/category", scrapeCategoryProducts);
router.delete("/:id", deleteProduct);

export default router;
