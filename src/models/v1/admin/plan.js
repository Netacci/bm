// import mongoose from 'mongoose';
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    duration: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    percentage: {
      type: Number,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
