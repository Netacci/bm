// import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken');
// import User from '../models/v1/users/auth.js';
// import Admin from '../models/v1/admin/auth.js';
const User = require('../models/v1/users/auth.js');
const Admin = require('../models/v1/admin/auth.js');
// import User from '../../../models/v1/users/auth.js';

const authenticate = (userType) => {
  return async (req, res, next) => {
    try {
      const authorization = req.headers.authorization;
      if (authorization === undefined) {
        return res.status(401).send({ message: 'Token needed' });
      }
      const [bearer, token] = authorization?.split(' ');

      if (bearer !== 'Bearer' && bearer !== undefined) {
        return res.status(401).send({ message: 'Malformed Header' });
      }
      if (token === undefined || token === '') {
        return res.status(401).send({ message: 'No token provided' });
      }

      const { email, _id } = jwt.verify(token, process.env.JWT_SECRET);

      let user;

      if (userType === 'user') {
        user = await User.findOne({ email, _id, token });
      } else if (userType === 'admin') {
        user = await Admin.findOne({ email, _id, token });
      } else {
        return res.status(401).send({ message: 'Authentication failed' });
      }

      if (!user) {
        return res.status(401).send({ message: 'Authentication failed' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: err.message });
    }
  };
};

// export default authenticate;
module.exports = authenticate;
