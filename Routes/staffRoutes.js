import express from "express";
import {
  authMiddleware,
  roleMiddleware,
} from "../Middlewares/authMiddleware.js";
import { getAvailableStaffs } from "../Controllers/staffController.js";

const router = express.Router();

router.get(
  "/available",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAvailableStaffs
);

export default router;
