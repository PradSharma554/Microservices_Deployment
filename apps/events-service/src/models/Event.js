const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    date: { type: Date, required: true, index: true },
    venue: { type: String, required: true, maxlength: 500 },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'published',
    },
  },
  { timestamps: true }
);

EventSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Event', EventSchema);
