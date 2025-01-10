import Booking from "../Models/bookingSchema.js";
import Resident from "../Models/residentSchema.js";

// Utility Validation Functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhoneNumber = (phoneNumber) => /^\+?[1-9]\d{1,14}$/.test(phoneNumber);

const validateEmergencyContact = (emergencyContact) => {
  const errors = [];
  if (!emergencyContact) {
    errors.push("Emergency contact is required.");
  } else {
    if (!emergencyContact.name || emergencyContact.name.trim() === "") {
      errors.push("Emergency contact name is required.");
    }
    if (
      !emergencyContact.relationship ||
      emergencyContact.relationship.trim() === ""
    ) {
      errors.push("Emergency contact relationship is required.");
    }
    if (
      emergencyContact.phoneNumber &&
      !validatePhoneNumber(emergencyContact.phoneNumber)
    ) {
      errors.push("Invalid emergency contact phone number. Must be 10 digits.");
    }
  }
  return errors;
};

const validateAddress = (address) => {
  if (!address || address.trim() === "") {
    return "Address is required.";
  }
  return null;
};

// **Get Resident Details**
export const getResidentDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const resident = await Resident.findById(userId).select("-password")
    .populate("room", "roomNumber");
    if (!resident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    res.status(200).json({ message: "Resident profile found.", data: resident });
  } catch (error) {
    console.error("Error fetching resident profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// **Update Resident Details**
export const updateResidentDetails = async (req, res) => {
  const userId = req.user.id;
  const { name, email, phoneNumber, emergencyContact, address } = req.body;

  try {
    const errors = [];

    // validate name
    if (name && name.trim() === "") {
      errors.push("Name is required.");
    }

    // Validate email
    if (email && !validateEmail(email)) {
      errors.push("Invalid email format.");
    }

    // Validate phone number
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      errors.push("Invalid phone number format. Must be 10 digits.");
    }

    // Validate emergency contact
    if (emergencyContact) {
      const emergencyContactErrors = validateEmergencyContact(emergencyContact);
      errors.push(...emergencyContactErrors);
    }

    // Validate address
    const addressError = validateAddress(address);
    if (addressError) {
      errors.push(addressError);
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    // Update the resident in one query
    const updatedResident = await Resident.findByIdAndUpdate(
      userId,
      { $set: req.body }, // Update only specified fields
    );

    if (!updatedResident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    res.status(200).json({
      message: "Resident profile updated successfully.",
      data: updatedResident,
    });
  } catch (error) {
    console.error("Error updating resident profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


// **Delete Resident Account**

export const deleteResidentAccount = async (req, res) => {
  const id = req.body;

  try {
    const deletedResident = await Resident.findByIdAndDelete(id);
    if (!deletedResident) {
      return res.status(404).json({ message: "Resident not found." });
    } else {
      return res
        .status(200)
        .json({ message: "Resident account deleted successfully." });
    }
  } catch (error) {
    console.error("Error deleting resident account:", error);
    res.status(500).json({ message: "Internal server error." });  
  }
  }


// Get user booking details
export const getUserBookingDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const userBookings = await Booking.find({ resident: userId }).populate(
      "room",
      "roomNumber"
    );
    if (!userBookings) {
      return res.status(404).json({ message: "Bookings not found." });
    }
   

    res.status(200).json({ message: "Bookings found.", data: userBookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};