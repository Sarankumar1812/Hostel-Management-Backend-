import MaintenanceRequest from "../Models/maintenanceRequestSchema.js";
import Resident from "../Models/residentSchema.js";
import Room from "../Models/roomSchema.js";
import Staff from "../Models/staffSchema.js";
import sendEmail from "../Utils/mailer.js";

// Create a new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  const { roomNumber, issueTitle, issueDescription, priority } = req.body;
  const residentId = req.user.id;


  const validPriorities = ["low", "medium", "high"];
  const charge = { low: 50, medium: 100, high: 150 };

  if (!roomNumber || !issueTitle || !issueDescription || !priority) {
    return res.status(400).json({
      message:
        "roomNumber, issueTitle, issueDescription, and priority are required",
    });
  }

  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority value" });
  }

  try {
    // Find the resident by their ID
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    // Find the room by its roomNumber
    const room = await Room.findOne({ roomNumber: roomNumber });
  
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the room is associated with the resident
    if (!resident.room) {
      return res.status(403).json({
        message: "This room is not associated with the current resident",
      });
    }

    // Create the maintenance request
    const maintenanceRequest = new MaintenanceRequest({
      resident: residentId,
      room: room._id, // Use the ObjectId of the Room
      issueTitle,
      issueDescription,
      priority,
      charge: charge[priority],
      status: "Pending",
    });

    await maintenanceRequest.save();

    const to = resident.email;
    const subject = "Maintenance Request Created";
    const html = `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1;">
        <div style="background-color: #FF8C00; color: white; padding: 15px; text-align: center;">
            <h2 style="margin: 0;">Maintenance Request Update</h2>
        </div>
        <div style="padding: 20px;">
            <p>Dear ${resident.name},</p>
            <p>This is to inform you that your maintenance request has been Received:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #FF8C00;">
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Issue Description:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">${issueDescription}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Priority:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">${priority}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Current Status:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">Pending</td>
                </tr>
            </table>
            <p style="color: #FF8C00;">Best regards,<br>Facility Management</p>
        </div>
    </body>
    </html>
    `;

    await sendEmail(to, subject, html);

    res.status(201).json({
      message: "Maintenance request created successfully",
      data: maintenanceRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating maintenance request" });
  }
};

// Get all maintenance requests where status is "pending"
export const getPendingMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ status: "Pending" })
      .populate("resident", "name email")
      .populate("room", "roomNumber");
    res.status(200).json({
      message: "Maintenance requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching maintenance requests" });
  }
};

// Update maintenance request status (Admin only)
export const assignStaff = async (req, res) => {
  const { requestId } = req.params;
  const { staffId } = req.body;

  try {
    const request = await MaintenanceRequest.findById(requestId)
      .populate("resident", "name email")
      .populate("room", "_id roomNumber");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    request.assignedTo = staffId;
    request.status = "In Progress";
    staff.isAvailable = false;
    await staff.save();
    await request.save();

    // Send email notification
    const to = request.resident.email;
    const subject = "Maintenance Request Update";
    const html = `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1;">
        <div style="background-color: #FF8C00; color: white; padding: 15px; text-align: center;">
            <h2 style="margin: 0;">Maintenance Request Update</h2>
        </div>
        <div style="padding: 20px;">
            <p>Dear ${request.resident.name},</p>
            <p>This is to inform you that your maintenance request has been updated:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #FF8C00;">
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Issue Description:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">${request.issueDescription}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Priority:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">${request.priority}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Current Status:</strong></td>
                    <td style="border: 1px solid #FF8C00; padding: 8px;">In Progress</td>
                </tr>
            </table>
            <p>A maintenance staff member has been assigned to address your request.</p>
            <p style="color: #FF8C00;">Best regards,<br>Facility Management</p>
        </div>
    </body>
    </html>
    `;

    await sendEmail(to, subject, html);

    res.status(200).json({ message: "Staff assigned successfully", request });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating maintenance request" });
  }
};

// Resolve a maintenance request (Staff only)
export const resolveMaintenanceRequest = async (req, res) => {
  const { requestId } = req.params; // Get requestId from the request body
  const staffId = req.user.id;
  try {
    const request = await MaintenanceRequest.findById(requestId)
      .populate("resident", "name email")
      .populate("room", "_id roomNumber")
      .populate("assignedTo", "_id name email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "Resolved") {
      return res.status(400).json({ message: "Request is already resolved" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    request.status = "Resolved";
    staff.isAvailable = true;

    await request.save();
    await staff.save();

    // Send gratitude email
    const to = request.resident.email;
    const subject = "Maintenance Request Resolved";
    const html = `
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1;">
    <div style="background-color: #FF8C00; color: white; padding: 15px; text-align: center;">
        <h2 style="margin: 0;">Maintenance Request Resolved</h2>
    </div>
    <div style="padding: 20px;">
        <p>Dear ${request.resident.name},</p>
        <p>We are pleased to confirm that your maintenance request has been successfully resolved:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #FF8C00;">
            <tr>
                <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Issue:</strong></td>
                <td style="border: 1px solid #FF8C00; padding: 8px;">${request.issueDescription}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Room:</strong></td>
                <td style="border: 1px solid #FF8C00; padding: 8px;">${request.room.roomNumber}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #FF8C00; padding: 8px; background-color: #FFA500; color: white;"><strong>Resolution Status:</strong></td>
                <td style="border: 1px solid #FF8C00; padding: 8px;">Completed</td>
            </tr>
        </table>
        <p>If you have any further concerns, please contact our maintenance department.</p>
        <p style="color: #FF8C00;">Sincerely,<br>Facility Maintenance Team</p>
    </div>
</body>
</html>
`;

    await sendEmail(to, subject, html);

    res.status(200).json({
      message: "Maintenance request resolved successfully",
      data: request,
    });
  } catch (error) {
    res.status(500).json({ message: "Error resolving maintenance request" });
  }
};

/* Get requests based on staff Id */
export const getRequestsByStaffId = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({
      assignedTo: req.user.id,
      status: "In Progress",
    })
      .populate("resident", "name email")
      .populate("room", "roomNumber");
    res
      .status(200)
      .json({ message: "Requests fetched successfully", data: requests });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching requests" });
  }
};
