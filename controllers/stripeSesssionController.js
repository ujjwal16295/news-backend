const { getSessionDetails } = require('../models/stripeSessionModel');
// const admin = require('firebase-admin');




const fetchSessionDetails = async (req, res) => {
  try {
    const { sessionId,userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await getSessionDetails(sessionId);
    console.log(session)
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { fetchSessionDetails };
