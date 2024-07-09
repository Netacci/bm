// import Plan from '../../../models/v1/admin/plan.js';
const Plan = require('../../../models/v1/admin/plan.js');

const createPlan = async (req, res) => {
  try {
    const { name, amount, description, percentage, duration, status } =
      req.body;

    if (!name || !amount || !percentage) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const plan = Plan.create({
      name,
      amount,
      description,
      percentage,
      duration,
      status,
    });

    res.status(200).json({ message: 'Plan created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.status(200).json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePlan = async (req, res) => {};

// export { createPlan, getPlans, updatePlan };

module.exports = { createPlan, getPlans, updatePlan };
