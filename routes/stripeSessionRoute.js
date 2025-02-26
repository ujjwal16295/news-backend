const express = require('express');
const { fetchSessionDetails } = require('../controllers/stripeSesssionController');

const router = express.Router();

router.post('/get-session-details', fetchSessionDetails);

module.exports = router;