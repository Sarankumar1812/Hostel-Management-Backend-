import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, index: true },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Triple", "Quad"],
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    stars: {
      type: Number,
    },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      default: 1,
    },
    bedRemaining: { 
      type: Number
    },
    residents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resident" }],
    residentHistory: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    ],
    amenities: [{ type: String }],
    roomDescription: { type: String, required: true },
    bookingDates: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    roomStatus: {
      type: String,
      enum: ["available","Occupied"],
      default: "Available",
    },
    discount: { type: Number, default: 0, min: 0 },

    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
