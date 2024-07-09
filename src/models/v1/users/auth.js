// import mongoose from 'mongoose';
// import validator from 'validator';
const mongoose = require('mongoose');
const validator = require('validator');
const pairingSchema = new mongoose.Schema(
  {
    phone_number: {
      type: String,
      trim: true,
      required: true,
    },
    full_name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    bank_name: {
      type: String,
      trim: true,
    },
    account_number: {
      type: Number,
      trim: true,
    },
    account_name: {
      type: String,
      trim: true,
    },
    payment_timer: {
      type: Date,
      trim: true,
    },
    payment_receipt: {
      type: String,
      trim: true,
    },
    plan_id: {
      type: String,
      trim: true,
    },
    user_id: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: [
        'open',
        'awaiting_confirmation',
        'paid',
        'not_paid',
        'not_received',
      ],
    },
    amount: {
      type: Number,
      trim: true,
    },
    // plans: {
    //   name: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //   },
    //   amount: {
    //     type: Number,
    //     required: true,
    //   },
    // },
  },
  {
    _id: true,
  }
);
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
    pairings: {
      type: [pairingSchema],
      default: [], // Default value as an empty array
    },
    status: {
      type: String,
      trim: true,
      enum: ['active', 'closed'],
    },
  },
  {
    _id: true,
  }
);
const transactionSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: [
        'not_received',
        'not_paid',
        'payment_confirmed',
        'payment_rejected',
        'awaiting_confirmation',
      ],
    },
    amount: {
      type: Number,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const userSchema = new mongoose.Schema(
  {
    full_name: {
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
    phone_number: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      validate(value) {
        if (!validator.isMobilePhone(value)) {
          throw new Error(`Invalid phone number: ${value}`);
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
    plans: {
      type: [planSchema],
      default: [], // Default value as an empty array
    },
    bank_name: {
      type: String,
      trim: true,
    },
    account_number: {
      type: Number,
      trim: true,
    },
    account_name: {
      type: String,
      trim: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'ready_to_give',
        'ready_to_receive',
        'paired',
        'awaiting_payment',
        'awaiting_confirmation',
        'confirm_payment',
        'hibernating',
      ],
      trim: true,
    },
    cancelStatus: {
      type: Number,
      trim: true,
    },

    hibernationTimer: {
      type: Date,
      trim: true,
    },
    verificationToken: { type: String },
    token: {
      type: String,
    },

    is_phone_verified: {
      type: Boolean,
      default: false,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    transactions: {
      type: [transactionSchema],
      default: [], // Default value as an empty array
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = mongoose.model('User', userSchema);
// export default User;
module.exports = User;
