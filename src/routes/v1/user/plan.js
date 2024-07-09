// import { Router } from 'express';
// import {
//   getPlans,
//   updateUserPlan,
//   getUserPlans,
//   checkStatus,
//   confirmGiverPayment,
//   confirmPaymentReceipt,
// } from '../../../controllers/v1/users/user.js';
// import authenticate from '../../../middleware/authenticate.js';
const { Router } = require('express');
const {
  getPlans,
  updateUserPlan,
  getUserPlans,
  checkStatus,
  confirmGiverPayment,
  confirmPaymentReceipt,
} = require('../../../controllers/v1/users/user.js');
const authenticate = require('../../../middleware/authenticate.js');

const router = Router();

router.get('/all-plans', authenticate('user'), getPlans);
router.patch('/update-plan', authenticate('user'), updateUserPlan);
router.get('/plans', authenticate('user'), getUserPlans);
router.patch('/check-status', authenticate('user'), checkStatus);
router.patch('/confirm-payment', authenticate('user'), confirmGiverPayment);
router.patch('/confirm-receipt', authenticate('user'), confirmPaymentReceipt);

// export default router;
module.exports = router;
