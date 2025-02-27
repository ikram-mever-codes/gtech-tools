// routes/shopRoutes.js
import express from "express";
import {
  createShop,
  getShopById,
  getAllShops,
  updateShop,
  deleteShop,
  getAllCategories,
} from "../controllers/shopController.js";

const router = express.Router();

router.post("/create", createShop);
router.get("/single/:id", getShopById);
router.get("/all", getAllShops);
router.put("/:id", updateShop);
router.delete("/:id", deleteShop);
router.get("/:shopId/categories", getAllCategories);

export default router;
