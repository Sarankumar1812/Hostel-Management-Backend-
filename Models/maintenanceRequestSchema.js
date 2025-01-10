import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  charge: {
    type: Number,
  },
  issueTitle: {type: String, required: true},
  issueDescription: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
}, { timestamps: true });

const MaintenanceRequest =  mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;