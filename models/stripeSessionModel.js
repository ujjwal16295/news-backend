const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getSessionDetails = async (sessionId) => {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { getSessionDetails };
