// import { Router } from 'express';
// import { addAdmin, login } from '../../../controllers/v1/admin/auth.js';
const { Router } = require('express');
const { addAdmin, login } = require('../../../controllers/v1/admin/auth.js');

const router = Router();

router.post('/add', addAdmin);

router.post('/login', login);

// export default router;
module.exports = router;
