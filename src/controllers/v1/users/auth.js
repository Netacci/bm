// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// import User from '../../../models/v1/users/auth.js';
// import logger from '../../../utils/logger.js';
const User = require('../../../models/v1/users/auth.js');
const logger = require('../../../utils/logger.js');

const register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone_number,
      account_number,
      bank_name,
      account_name,
    } = req.body;
    if (
      !full_name ||
      !email ||
      !password ||
      !phone_number ||
      !account_number ||
      !bank_name ||
      !account_name
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: `Email ${email} already exists` });
    }
    const existingPhoneNumber = await User.findOne({ phone_number });
    if (existingPhoneNumber) {
      return res.status(400).json({
        message: `Phone number ${phone_number} already exists`,
      });
    }
    const verificationToken = jwt.sign(
      { email: email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      phone_number,
      account_number,
      bank_name,
      account_name,
      token: verificationToken,
      is_phone_verified: false,
      is_email_verified: false,
      status: 'pending',
      cancelStatus: 0,
    });
    await user.save();

    res
      .status(201)
      .json({ message: 'User created successfully', token: verificationToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.is_email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    if (token !== user.verificationToken) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    user.token = token;
    user.is_email_verified = true;
    user.verificationToken = undefined;
    await user.save();
    res.status(201).json({
      data: user,
      token,
      message: 'Email verified successfully',
      status: 201,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const sendOTP = async (req, res) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    // send OTP to verify phone number

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const verifyPhone = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    user.is_phone_verified = true;

    await user.save();
    res.status(200).json({ message: 'Phone number verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Invalid email or password', { user: user });
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Invalid email or password', { user: user });
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // if (!user.is_email_verified) {
    //   logger.warn(`User with ${email} has not verified email`);
    //   return res.status(401).json({ message: 'Email not verified' });
    // }
    // if a user is banned they can't access page
    // if (user.isBanned) {
    //   logger.warn(`This User ${email} is banned`);
    //   return res
    //     .status(403)
    //     .json({ message: 'You are banned, contact admin', status: 403 });
    // }
    const token = jwt.sign(
      { _id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );
    user.token = token;

    await user.save();
    logger.info('Login successful', { user: user });
    res
      .status(200)
      .json({ data: user, message: 'Login successful', token, status: 200 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (oldPassword === newPassword) {
      return res
        .status(401)
        .json({ message: 'New password cannot be the same as old password' });
    }
    const match = await bcrypt.compare(oldPassword, req.user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    req.user.password = hashedPassword;
    await req.user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * Sends a password reset link to the specified email address.
 *
 * @param {Object} req - The request object containing the email address.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the password reset link is sent successfully.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    // Mask this error message for security reasons. When user isnt find still send Email sent to user message. This can be revisited and changed later
    if (!user) {
      return res.status(200).json({ message: 'Email sent to user' });
    }
    if (!user.is_email_verified) {
      return res.status(400).json({ message: 'Email not verified' });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    user.verificationToken = token;
    const hostlink =
      process.env.NODE_ENV === 'production'
        ? 'https://skenny.org'
        : 'http://localhost:5174';
    await user.save();
    const subject = 'Password reset request';
    const templateId = process.env.SENDGRID_TEMPLATE_ID_RESET;
    const link = `${hostlink}/reset-password/${token}`;
    const dynamicData = {
      verification_link: link,
      subject: subject,
    };

    await sendEmail(user.email, templateId, subject, dynamicData);
    res.status(200).json({
      message: 'Password reset link sent to your email',
      token,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * Resets the password of a user given a valid token.
 *
 * @param {Object} req - The request object containing the password and token.
 * @param {Object} res - The response object.
 * @return {Promise<void>} - A promise that resolves when the password is successfully changed.
 *                          - A 404 status code and message if the user is not found.
 *                          - A 500 status code and message if there is an error.
 */
const resetPassword = async (req, res) => {
  const { password, token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.verificationToken = undefined;
    await user.save();
    // TODO Send out email to notifiy user that passssword has been reset
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const verifyBank = async (req, res) => {};
// export {
//   register,
//   verifyPhone,
//   login,
//   changePassword,
//   forgotPassword,
//   resetPassword,
//   sendOTP,
// };

module.exports = {
  register,
  verifyPhone,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  sendOTP,
};
