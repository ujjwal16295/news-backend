const fs = require('fs').promises;
const genAI = require('../config/gemini');

class PDFAnalysis {
  static extractJSONFromResponse(text) {
    const jsonMatch = text.replace(/```json\n|\n```/g, '').trim();
    
    try {
      return JSON.parse(jsonMatch);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse Gemini response');
    }
  }

  static async analyze(filePath) {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const fileContent = await fs.readFile(filePath);

    const prompt = `Extract news articles from this PDF and format your response EXACTLY as a JSON array of objects. 
    Each object should have ONLY these two fields:
    - "headline": a concise title
    - "summary": a brief summary
    
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
        // await fs.unlink(filePath); can uncomment to try removing file here

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "application/pdf",
            data: fileContent.toString('base64')
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      return this.extractJSONFromResponse(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate summary');
    }
  }
}

module.exports = PDFAnalysis;