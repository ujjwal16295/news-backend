const express = require('express');
const router = express.Router();
const PDFController = require('../controllers/pdfController');
const { pdfUpload } = require('../config/multer');

router.post('/upload-pdf', pdfUpload.single('pdf'), PDFController.uploadAndAnalyze);

module.exports = router;