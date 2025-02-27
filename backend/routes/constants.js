import express from "express";
import {
  createConstant,
  deleteConstant,
  editConstant,
  getAllConstants,
} from "../controllers/constants.js";

const router = express.Router();

// Routes for constants

router.get("/all", getAllConstants);

router.post("/create", createConstant);

router.delete("/delete/:id", deleteConstant);

router.put("/edit/:id", editConstant);

export default router;
