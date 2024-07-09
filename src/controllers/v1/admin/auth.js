// import Admin from '../../../models/v1/admin/auth.js';
const Admin = require('../../../models/v1/admin/auth.js');
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../../../utils/emails.js');

const addAdmin = async (req, res) => {
  const { first_name, last_name, email, role } = req.body;

  try {
    // const result = await checkAdminStatus(req.user.role);
    // // Check if the property was found
    // if (!result.success) {
    //   return res.status(result.code).json({ message: 'Unauthorized' });
    // }
    // if (!first_name || !last_name || !email || !role) {
    //   return res.status(400).json({ message: 'All fields are required' });
    // }
    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: `Email ${email} already exists` });
    }
    let password = Math.random().toString(36).substring(7);
    let hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      first_name,
      last_name,
      email,
      role,
      password: hashedPassword,
    });
    await admin.save();
    const subject = 'New Admin Added';

    const dynamicData = {
      first_name: admin.first_name,
      admin_password: password,
      subject,
    };
    const templateId = process.env.SENDGRID_TEMPLATE_ID_ADMIN;
    await sendEmail(admin.email, templateId, subject, dynamicData);
    res.status(201).json({ message: 'Admin added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const admin = await Admin.findOne({ email });

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { _id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );
    admin.token = token;
    await admin.save();
    res
      .status(200)
      .json({ data: admin, token, message: 'Login successful', status: 200 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export { addAdmin, login };

module.exports = { addAdmin, login };
