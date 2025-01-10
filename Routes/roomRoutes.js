import express from "express";
import {
  authMiddleware,
  roleMiddleware,
} from "../Middlewares/authMiddleware.js";
import {
  createRoom,
  getAllRooms,
  getAvailableRooms,
  getRoomByRoomNumber,
} from "../Controllers/roomController.js";
import upload from "../Config/Multer.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin"]),
  upload.array("images", 5),
  createRoom
);
router.get(
  "/all-rooms",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllRooms
);
router.get("/available-rooms", getAvailableRooms);
router.get("/:roomNumber", getRoomByRoomNumber);
export default router;
