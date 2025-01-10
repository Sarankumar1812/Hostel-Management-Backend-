import express from "express";
import {
  createMaintenanceRequest,
  resolveMaintenanceRequest,
  // deleteMaintenanceRequest,
  getPendingMaintenanceRequests,
  assignStaff,
  // getRequestsByResidentId,
  getRequestsByStaffId,
} from "../Controllers/maintenanceRequestController.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Create a new maintenance request (Resident)
router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["resident"]), // Only residents can create requests
  createMaintenanceRequest
);

// Get all maintenance requests (Admin/Staff)
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["admin"]),
  getPendingMaintenanceRequests
);

// Update a maintenance request (Assign to staff - Admin only)
router.patch(
  "/assign-staff/:requestId",
  authMiddleware,
  roleMiddleware(["admin"]), // Only admins can assign staff
  assignStaff
);

// Resolve a maintenance request (Staff)
router.patch(
  "/resolve/:requestId",
  authMiddleware,
  roleMiddleware("staff"), // Only staff can resolve requests
  resolveMaintenanceRequest
);

/* Get request by staffId */
router.get(
  "/get-requests/staff",
  authMiddleware,
  roleMiddleware("staff"),
  getRequestsByStaffId
);

export default router;

// Delete a maintenance request (Admin)
/* router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware("admin"), // Only admins can delete requests
  deleteMaintenanceRequest
); */

/* get request by residentId */
// router.get("/request", authMiddleware, roleMiddleware(["resident"]), getRequestsByResidentId);
