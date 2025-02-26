const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');
const { imageUpload } = require('../config/multer');

router.post('/upload-image', imageUpload.single('image'), ImageController.uploadAndAnalyze);

module.exports = router;