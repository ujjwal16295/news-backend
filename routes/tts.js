const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

router.post('/generate-speech', ttsController.generateSpeech);

module.exports = router