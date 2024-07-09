// import mongoose from 'mongoose';
// import validator from 'validator';
const mongoose = require('mongoose');
const validator = require('validator');

const adminSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error(`Invalid email: ${value}`);
        }
      },
    },

    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error(
            `Weak password: ${value}. Your password must include lowercase, uppercase, digits, symbols and must be at least 8 characters`
          );
        }
      },
    },
    role: {
      type: String,
      required: true,
      enum: ['superAdmin', 'admin', 'support'],
    },
    token: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Admin = mongoose.model('Admin', adminSchema);
// export default Admin;
module.exports = Admin;
