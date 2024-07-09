// import { Router } from 'express';
// import { createPlan, getPlans } from '../../../controllers/v1/admin/plan.js';
// import { getAllUsers, pairUsers } from '../../../controllers/v1/admin/users.js';
// import authenticate from '../../../middleware/authenticate.js';
const { Router } = require('express');
const {
  createPlan,
  getPlans,
} = require('../../../controllers/v1/admin/plan.js');
const {
  getAllUsers,
  pairUsers,
} = require('../../../controllers/v1/admin/users.js');
const authenticate = require('../../../middleware/authenticate.js');

const router = Router();

router.post('/add', authenticate('admin'), createPlan);

router.get('/all-plans', authenticate('admin'), getPlans);
router.get('/all-users', authenticate('admin'), getAllUsers);
router.patch('/pair-users', authenticate('admin'), pairUsers);

// export default router;
module.exports = router;
