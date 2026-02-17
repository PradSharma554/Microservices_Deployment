const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, index: true },
    eventTitle: { type: String, required: true },
    eventDate: { type: Date, required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    ticketCount: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

BookingSchema.index({ customerEmail: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
