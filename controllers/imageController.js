const fs = require('fs').promises;
const ImageAnalysis = require('../models/ImageAnalysis');
const admin = require('firebase-admin');

class ImageController {
  static async uploadAndAnalyze(req, res) {
    try {
      // Validate request
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.headers['user-id'];
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Validate subscription
      if (!await ImageController.validateSubscription(userData)) {
        return res.status(400).json({
          error: "Subscription plan ended",
          message: "Your subscription plan has ended"
        });
      }

      // Process PDF
      const summaries = await ImageController.processImg(req.file.path);
      await fs.unlink(req.file.path);

      // Update summaries in Firestore
      await ImageController.updateSummaries(userRef, summaries);

      // Update usage count
      await userRef.update({
        news_generation_count: admin.firestore.FieldValue.increment(-1)
      });

      res.json(summaries);

    } catch (error) {
      console.error('Error processing Image:', error);
      res.status(500).json({
        error: 'Failed to process Image',
        details: error.message
      });
    }
  }

  static async validateSubscription(userData) {
    if (userData.service === "free") {
      return userData.news_generation_count > 0;
    }
    const currentDate = new Date();
    return currentDate <= userData.end_date.toDate();
  }

  static async processImg(filePath) {
    const rawSummaries = await ImageAnalysis.analyze(filePath);
    
    if (!Array.isArray(rawSummaries)) {
      throw new Error('Invalid response format: expected an array');
    }

    // Validate and deduplicate summaries
    const validSummaries = rawSummaries.filter(item =>
      item &&
      typeof item === 'object' &&
      'headline' in item &&
      'summary' in item
    );

    return Array.from(
      new Map(validSummaries.map(item => [item.headline, item])).values()
    );
  }

  static async updateSummaries(userRef, newSummaries) {
    const doc = await userRef.get();
    let existingSummariesArrays = doc.data()?.summaries || [];
  
    // If we already have 10 arrays of summaries, remove the oldest one
    if (existingSummariesArrays.length >= 10) {
      existingSummariesArrays.pop(); // Remove the last (oldest) array
    }
  
  
    await userRef.update({ summaries: [{newSummaries}, ...existingSummariesArrays] });
  }
}

module.exports = ImageController;
