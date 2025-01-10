import mongoose from 'mongoose';


// Booking Schema
const BookingSchema = new mongoose.Schema({
  // Unique Booking Reference
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // User who made the booking
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },

  // Room being booked
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  // Booking Dates
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },

  // Guest Details
  guests: {
    type: {
      adults: {
        type: Number,
        default: 1,
        min: 1,
        required: true
      },
      children: {
        type: Number,
        default: 0,
        min: 0
      },
      infantsUnder2: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    required: true
  },

 
  priceBreakdown: {
    basePrice: {
      type: Number,
      min: 0
    },
    totalNights: {
      type: Number,
      min: 0
    },
    roomCost: {
      type: Number,
      min: 0
    },
    tax: {
      type: Number,
      min: 0
    },
    maintenanceCharge: {
      type: Number,
      min: 0
    },
    totalPrice: {
      type: Number,
      min: 0
    }
  },

  // Booking Status
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },

  // Payment Details
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      trim: true
    },
    paidAt: Date
  },

}, {
  timestamps: true
});

// Indexes for performance
BookingSchema.index({ user: 1 });
BookingSchema.index({ room: 1 });
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

export default Booking;