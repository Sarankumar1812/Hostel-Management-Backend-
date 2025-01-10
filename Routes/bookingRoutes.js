import express from "express";
import {createBooking, cancelBooking, getBookingById} from "../Controllers/bookingController.js";
import {
  authMiddleware,
  roleMiddleware
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Create a new booking
router.post("/create", authMiddleware, roleMiddleware(["resident"]), createBooking);

// Get booking by reference
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  getBookingById
);

// Cancel booking
router.patch(
  "/cancel/:id",
  authMiddleware,
  roleMiddleware(["resident"]),
  cancelBooking
);

export default router;
