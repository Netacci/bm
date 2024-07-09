// import User from '../../../models/v1/users/auth.js';
const User = require('../../../models/v1/users/auth.js');

const getAllUsers = async (req, res) => {
  try {
    const { status } = req.body;
    const users = await User.find({}).select('-password -token -__v');
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const pairUsers = async (req, res) => {
  try {
    const { receiver_id, giver_ids } = req.body;
    // Extract giver_id values
    const giverIds = giver_ids.map((giver) => giver.giver_id);
    const receiver = await User.findById(receiver_id).select(
      '-password -token -__v'
    );
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const givers = await User.find({ _id: { $in: giverIds } }).select(
      '-password -token -__v'
    );
    if (givers.length !== giverIds.length) {
      return res.status(404).json({ message: 'Some givers not found' });
    }

    let totalPairedAmount = 0;
    let pairingDetails = [];

    // Create pairing details and update the receiver's pairings array within the specific plan
    // givers.forEach((giver) => {
    //   giver.plans.forEach((giverPlan) => {
    //     receiver.plans.forEach((receiverPlan) => {
    //       receiverPlan.status = 'active';
    //       if (totalPairedAmount < receiverPlan.amount) {
    //         const pairingDetail = {
    //           phone_number: giver.phone_number,
    //           full_name: giver.full_name,
    //           email: giver.email,
    //           payment_timer: new Date(Date.now() + 60 * 60 * 1000), // 1 hours from now
    //           user_id: giver._id,
    //           plan_id: receiverPlan._id,
    //           status: 'open',
    //           amount: amount_to_pay,
    //         };
    //         receiverPlan.pairings.push(pairingDetail);
    //         pairingDetails.push(pairingDetail);
    //         totalPairedAmount += giverPlan.amount;
    //       }
    //     });
    //   });
    // });
    // Create pairing details and update the receiver's pairings array within the specific plan
    giver_ids.forEach(({ giver_id, amount_to_pay }) => {
      const giver = givers.find((giver) => giver._id.toString() === giver_id);

      if (giver) {
        receiver.plans.forEach((plan) => {
          if (plan.status !== 'closed') {
            plan.status = 'active';

            if (totalPairedAmount < plan.amount) {
              const pairingDetail = {
                phone_number: giver.phone_number,
                full_name: giver.full_name,
                email: giver.email,
                payment_timer: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                user_id: giver._id,
                plan_id: plan._id,
                status: 'open',
                amount: amount_to_pay,
              };
              plan.pairings.push(pairingDetail);
              pairingDetails.push(pairingDetail);
              totalPairedAmount += amount_to_pay;
            }
          }
        });
      }
    });

    // Update the receiver's status only if the total paired amount matches the plan amount
    receiver.plans.forEach((plan) => {
      if (plan.status === 'active') {
        totalPairedAmount >= plan.amount
          ? (receiver.status = 'awaiting_payment')
          : (receiver.status = receiver.status);
      }
    });
    // receiver.status =
    //   totalPairedAmount >= receiver.plans[0].amount
    //     ? 'awaiting_payment'
    //     : receiver.status;
    await receiver.save();

    // Update each giver's status and add receiver details to their pairings within their plan
    for (const giver of givers) {
      giver.plans.forEach((plan) => {
        if (plan.status !== 'closed') {
          plan.status = 'active';

          console.log(plan);
          const pairingDetail = {
            phone_number: receiver.phone_number,
            full_name: receiver.full_name,
            email: receiver.email,
            bank_name: receiver.bank_name,
            account_number: receiver.account_number,
            account_name: receiver.account_name,
            user_id: receiver._id,
            payment_timer: new Date(Date.now() + 60 * 60 * 1000), // 1 hours from now

            status: 'open',
            amount: plan.amount,
          };
          plan.pairings.push(pairingDetail);
        }
      });

      giver.status = 'paired';
      await giver.save();
    }

    res.status(200).json({
      message: 'Users paired successfully',
      receiver,
      givers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export { getAllUsers, pairUsers };

module.exports = { getAllUsers, pairUsers };
