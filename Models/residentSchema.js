import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", // Reference to Room schema
      default: null,
    },

    emergencyContact: {
      name: { type: String },
      phoneNumber: { type: String },
      relationship: { type: String },
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "non resident"],
      default: "non resident",
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Resident = mongoose.model("Resident", residentSchema);

export default Resident;
