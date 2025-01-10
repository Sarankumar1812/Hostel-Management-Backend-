import express from "express";
import { getRevenueByCategory } from "../Controllers/revenueController.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/category",
  authMiddleware,
  roleMiddleware(["admin"]),
  getRevenueByCategory
);

export default router;
