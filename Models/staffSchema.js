import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    maintenaceRequest: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "MaintenaceRequest"
    }
});

const Staff =  mongoose.model("Staff", staffSchema);

export default Staff;