const fs = require('fs').promises;
const genAI = require('../config/gemini');

class ImageAnalysis {
  static async analyze(imagePath) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const fileContent = await fs.readFile(imagePath);

    const prompt = `Extract news articles from this Photo and format your response EXACTLY as a JSON array of objects. 
    Each object should have ONLY these two fields:
    - "headline": a concise title
    - "summary": a brief summary of two three lines if possible
    
    Example format:
    [
      {
        "headline": "Title 1",
        "summary": "Summary 1"
      },
      {
        "headline": "Title 2",
        "summary": "Summary 2"
      }
    ]
    
    Do not include any other text, markdown, or formatting in your response. Return ONLY the JSON array.`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: fileContent.toString('base64')
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text.replace(/```json\n|\n```/g, '').trim());
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to analyze image');
    }
  }
}

module.exports = ImageAnalysis;