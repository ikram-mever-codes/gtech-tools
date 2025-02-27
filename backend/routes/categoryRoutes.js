import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  addUrlsToCategory,
  getCategory,
  scrapeCategoryProduct,
} from "../controllers/categoryController.js";

const router = express.Router();

router.post("/create", createCategory);
router.get("/single/:id", getCategory);
router.get("/all", getCategories);
router.post("/:id/urls", addUrlsToCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.get("/product", scrapeCategoryProduct);
export default router;

/* 
Fetch Category and get the product that was not scrapped  start from that products and filter an array of unscrapped products scrape each prodcut
then after exiting the loop
*/
