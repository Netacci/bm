// import Plan from '../../../models/v1/admin/plan.js';
// import User from '../../../models/v1/users/auth.js';
const Plan = require('../../../models/v1/admin/plan.js');
const User = require('../../../models/v1/users/auth.js');

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ status: 'active' });
    res.status(200).json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// const getUserDetails = async (req, res) => {
//   try{
//     const user = await User.findById(req.user._id);
//     if(!user){
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json({ user });
//   }catch(err){
//     res.status(500).json({ message: err.message });
//   }
// }
const updateUserPlan = async (req, res) => {
  try {
    const { planId } = req.body; // Extract plan details from request body
    console.log(planId);
    const user = await User.findById(req.user._id); // Find user by ID
    const plan = await Plan.findById(planId); // Find plan by ID

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(plan);
    // Add the new plan to the user's plans array
    user.plans.push(plan);

    // Update the user's status
    user.status = 'ready_to_give';
    // send email to admin

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'User plan updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getUserPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ plans: user.plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// this endpooint checks user status. If they are hibernation and their timer = 0 then it changes sttaus to ready to pair and adds them to the queue. If they are pending users and their payment countdown = 0 then it adds =+ to their cancel status
const checkStatus = async (req, res) => {
  // uf user status is paired and they don't pay till the
  // if date.now is greater tahan payment timer then set payment timer to null
  // if  a user status is paired and payment timer is null then change status to ready to give and cancelStatus to 1
  // if a user status is awaiting payment and payment status is null then change status to ready to receive
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password -token -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const now = new Date();

    // Check if user status is "paired" and payment timer has expired
    let statusUpdated = false;
    if (user.status === 'paired') {
      user.plans.forEach((plan) => {
        plan.pairings.forEach((pairing) => {
          if (pairing.payment_timer && now > new Date(pairing.payment_timer)) {
            pairing.payment_timer = null; // Reset payment timer if expired
            statusUpdated = true;
            // Add a new transaction entry for the expired payment
            const newTransaction = {
              name: plan.name,
              status: 'not_paid',
              amount: plan.amount,
              description: `Payment for pairing with ${pairing.full_name} has expired.`,
            };
            user.transactions.push(newTransaction);
          }
        });
      });
      if (statusUpdated) {
        // Update user's status and transactions based on pairing status
        user.plans.forEach((plan) => {
          plan.pairings.forEach((pairing) => {
            if (!pairing.payment_timer && user.status === 'paired') {
              user.status = 'ready_to_give';
              user.cancelStatus += 1;
            }
          });
        });
      }
    }
    // If user was awaiting payment and no active payment timer, set to ready to receive
    if (user.status === 'awaiting_payment') {
      user.plans.forEach((plan) => {
        plan.pairings.forEach((pairing) => {
          if (pairing.payment_timer && now > new Date(pairing.payment_timer)) {
            pairing.payment_timer = null; // Reset payment timer if expired
            statusUpdated = true;
            // Add a new transaction entry for the expired payment
            const newTransaction = {
              name: plan.name,
              status: 'not_received',
              amount: plan.amount,
              description: ` ${pairing.full_name} did not make payment`,
            };
            user.transactions.push(newTransaction);
          }
        });
      });
      if (statusUpdated) {
        // Update user's status and transactions based on pairing status
        user.plans.forEach((plan) => {
          plan.pairings.forEach((pairing) => {
            if (!pairing.payment_timer && user.status === 'awaiting_payment') {
              user.status = 'ready_to_receive';
            }
          });
        });
      }
    }
    // Check if user status is "hibernating" and hibernation timer has expired
    if (
      user.status === 'hibernating' &&
      user.hibernationTimer &&
      now >= new Date(user.hibernationTimer)
    ) {
      user.status = 'ready_to_receive';
      user.hibernationTimer = null; // Reset hibernation timer
      statusUpdated = true;
    }

    if (statusUpdated) {
      await user.save();
      return res.status(200).json({
        message: 'User status and transactions updated successfully',
        user,
      });
    }
    if (user.cancelStatus === 3) {
      user.isBanned = true;
    }

    res.status(200).json({ message: 'User status updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmGiverPayment = async (req, res) => {
  //     // user status is paired and payment timer is still active
  //     // reg body is sending payment receipt and user_id
  //     // send an email to admin
  //     // send text message to user
  //     // change status to awaiting_confirmation and payment timer to null then get user with user_id and change their status to confirm_payment and their payment timer to null, add payment receipt to proof_of_payment of user.id(receiver)
  try {
    const { payment_receipt, receiver_id, amount } = req.body; // Expecting receiver_id from the frontend
    const giver = await User.findById(req.user._id).select(
      '-password -token -__v'
    );
    const receiver = await User.findById(receiver_id).select(
      '-password -token -__v'
    );
    console.log(amount);
    if (!giver || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    let activePaymentTimer = false;

    // Update pairing details for the giver
    giver.plans.forEach((plan) => {
      plan.pairings.forEach((pairing) => {
        console.log(receiver_id, 'id');
        console.log(pairing.user_id, 'timer');
        if (
          pairing.user_id === receiver_id &&
          pairing.payment_timer &&
          now < new Date(pairing.payment_timer)
        ) {
          activePaymentTimer = true;
          pairing.payment_timer = null;
          pairing.status = 'awaiting_confirmation';
          pairing.payment_receipt = payment_receipt;
        }
      });
    });

    // Update pairing details for the receiver
    receiver.plans.forEach((plan) => {
      plan.pairings.forEach((pairing) => {
        if (
          pairing.user_id === giver.id &&
          pairing.payment_timer &&
          now < new Date(pairing.payment_timer)
        ) {
          pairing.payment_timer = null;
          pairing.status = 'awaiting_confirmation';
          pairing.payment_receipt = payment_receipt;
        }
      });
    });

    if (activePaymentTimer && giver.status === 'paired') {
      // Update giver's status
      giver.status = 'awaiting_confirmation';

      // Calculate the total paired amount for the receiver
      let totalPairedAmount = 0;

      receiver.plans.forEach((plan) => {
        if (plan.status === 'active') {
          plan.pairings.forEach((pairing) => {
            totalPairedAmount += pairing.amount;
          });
        }
      });

      // Update receiver's status based on total paired amount
      receiver.status =
        totalPairedAmount >= amount ? 'confirm_payment' : 'awaiting_payment';

      // Add a new transaction entry for both giver and receiver

      const newGiverTransaction = {
        name: 'Payment Made',
        status: 'awaiting_confirmation',
        amount,
        description: `Payment to ${receiver.full_name} is awaiting confirmation.`,
      };
      const newReceiverTransaction = {
        name: 'Payment Made',
        status: 'awaiting_confirmation',
        amount,
        description: `Payment from ${giver.full_name} is awaiting confirmation.`,
      };
      giver.transactions.push(newGiverTransaction);
      receiver.transactions.push(newReceiverTransaction);

      // Send email and SMS to admin and receiver (email and SMS sending logic not included in this snippet)

      // Save both giver and receiver documents
      await giver.save();
      await receiver.save();

      // Respond with success message
      res
        .status(200)
        .json({ message: 'Payment confirmed successfully', giver, receiver });
    } else {
      res.status(400).json({
        message:
          'Payment timer has expired or user status is not valid for this operation',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const confirmPaymentReceipt = async (req, res) => {
  try {
    const { giver_id, status, amount } = req.body;
    const receiver = await User.findById(req.user._id).select(
      '-password -token -__v'
    );
    const giver = await User.findById(giver_id).select('-password -token -__v');
    if (!receiver || !giver) {
      return res.status(404).json({ message: 'User not found' });
    }

    let paymentConfirmed = false;
    // Update the pairing status to "paid" for the receiver
    receiver.plans.forEach((plan) => {
      plan.pairings.forEach((pairing) => {
        if (
          pairing.user_id === giver_id &&
          pairing.status === 'awaiting_confirmation' &&
          status === 'approved'
        ) {
          pairing.status = 'paid';
          paymentConfirmed = true;
        } else if (
          pairing.user_id === giver_id &&
          pairing.status === 'awaiting_confirmation' &&
          status === 'rejected'
        ) {
          pairing.status = 'not_paid';
          paymentConfirmed = true;
        }
      });
    });

    if (!paymentConfirmed) {
      return res
        .status(400)
        .json({ message: 'No pending payment to confirm from this giver' });
    }

    // Update the receiver's status if needed
    let totalPaidAmount = 0;
    receiver.plans.forEach((plan) => {
      if (plan.status === 'active') {
        plan.pairings.forEach((pairing) => {
          if (pairing.status === 'paid') {
            totalPaidAmount += pairing.amount;
          }
        });
      }
    });

    // Update the receiver's status
    // if (status === 'approved') {
    //   if (totalPaidAmount >= amount) {
    //     receiver.status = 'pending';
    //   } else {
    //     receiver.status = 'awaiting_payment';
    //   }
    // } else if (status === 'rejected') {
    //   receiver.status = 'pending';
    //   receiver.cancelStatus += 1;
    // }
    receiver.plans.forEach((plan) => {
      // if (pairing.amount === plan.amount) {
      //   plan.status === 'closed';
      // }

      if (plan.status === 'active') {
        if (status === 'approved') {
          if (totalPaidAmount >= plan.amount) {
            receiver.status = 'pending';
            plan.status = 'closed';
          } else {
            receiver.status = 'awaiting_payment';
          }
        } else if (status === 'rejected') {
          receiver.status = 'pending';
          receiver.cancelStatus += 1;
          plan.status = 'closed';
        }
      }
    });
    // Update the giver's status and pairing status to "hibernating"
    giver.plans.forEach((plan) => {
      plan.pairings.forEach((pairing) => {
        if (
          pairing.user_id === receiver.id &&
          pairing.status === 'awaiting_confirmation' &&
          status === 'approved'
        ) {
          pairing.status = 'paid';
        } else if (
          pairing.user_id === receiver.id &&
          pairing.status === 'awaiting_confirmation' &&
          status === 'rejected'
        ) {
          pairing.status = 'not_paid';
          plan.status = 'closed';
        }
      });
    });
    // Update the giver's status to "hibernating"
    if (status === 'approved') {
      giver.status = 'hibernating';
      giver.hibernationTimer = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      // Add a new transaction entry for both giver and receiver

      const newGiverTransaction = {
        name: 'Payment Confirmation',
        status: 'payment_confirmed',
        amount,
        description: `Payment to ${receiver.full_name} has been confirmed.`,
      };
      const newReceiverTransaction = {
        name: 'Payment Confirmation',
        status: 'payment_confirmed',
        amount,
        description: `Payment from ${giver.full_name} has been confirmed.`,
      };
      giver.transactions.push(newGiverTransaction);
      receiver.transactions.push(newReceiverTransaction);
    } else if (status === 'rejected') {
      giver.status = 'ready_to_give';
      giver.cancelStatus += 1;
      const newGiverTransaction = {
        name: 'Payment Rejected',
        status: 'payment_rejected',
        amount,
        description: `Payment to ${receiver.full_name} has been rejected.`,
      };
      const newReceiverTransaction = {
        name: 'Payment Rejected',
        status: 'payment_rejected',
        amount,
        description: `Payment from ${giver.full_name} has been rejected.`,
      };
      giver.transactions.push(newGiverTransaction);
      receiver.transactions.push(newReceiverTransaction);
    }

    // Save both receiver and giver documents
    await receiver.save();
    await giver.save();

    res
      .status(200)
      .json({ message: 'Payment confirmed successfully', receiver, giver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export {
//   getPlans,
//   updateUserPlan,
//   getUserPlans,
//   checkStatus,
//   confirmGiverPayment,
//   confirmPaymentReceipt,
// };

module.exports = {
  getPlans,
  updateUserPlan,
  getUserPlans,
  checkStatus,
  confirmGiverPayment,
  confirmPaymentReceipt,
};
