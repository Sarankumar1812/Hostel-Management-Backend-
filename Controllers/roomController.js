import Room from "../Models/roomSchema.js";

export const createRoom = async (req, res) => {
  let {
    roomNumber,
    roomType,
    price,
    capacity,
    amenities,
    roomDescription,
    discount,
    stars,
  } = req.body;
  let imageUrls = [];


  // Handle image upload (if file uploaded)
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      imageUrls.push(file.path); // Push each image's path to imageUrls array
    });
  }

  if (
    !roomNumber ||
    !roomType ||
    !price ||
    !amenities ||
    !capacity ||
    !roomDescription ||
    !discount ||
    !stars
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Room number, room type, and price, capacity, amenities, roomDescription, discount are required",
    });
  }

  try {
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
    }

    const newRoom = new Room({
      roomNumber,
      roomType,
      price,
      capacity,
      amenities: amenities.split(", "),
      roomDescription,
      discount,
      stars,
      images: imageUrls,
      isAvailable: true, // Initially available
      roomStatus: "available",
      bedRemaining: capacity,
    });

    await newRoom.save();
    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: newRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding new room",
      error: error.message,
    });
  }
};

/* Get all rooms */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().select("-residentHistory");
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms",
      error: error.message,
    });
  }
};

/* Get Available rooms */
export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true }).select(
      "-residentHistory"
    );
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available rooms",
      error: error.message,
    });
  }
};


// Get room by room number
export const getRoomByRoomNumber = async (req, res) => {
  try {
    const { roomNumber } = req.params;

    const room = await Room.findOne({ roomNumber: roomNumber });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({ message: "Room found", data: room });
  } catch (error) {
    console.error("Error fetching room by room number:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

