// import { Router } from 'express';
// import { register, login } from '../../../controllers/v1/users/auth.js';
const { Router } = require('express');
const { register, login } = require('../../../controllers/v1/users/auth.js');

const router = Router();

router.post('/register', register);

router.post('/login', login);

// export default router;
module.exports = router;
