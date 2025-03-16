const axios = require('axios');
const mm = require("music-metadata");
const admin = require('firebase-admin');


async function getMP3DurationFromBuffer(buffer) {
    try {
        const metadata = await mm.parseBuffer(buffer, "audio/mpeg");
        console.log("Duration (seconds):", metadata.format.duration);
        return metadata.format.duration;
    } catch (error) {
        console.error("Error reading MP3 metadata:", error);
    }
}

// Utility function to chunk text into smaller pieces
const chunkText = (text, maxChunkSize = 2500) => {
  // Split text at sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence would exceed maxChunkSize, start a new chunk
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + ' ';
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// Function to generate speech for a single chunk
const generateSpeechChunk = async (text, apiKey) => {
  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error generating speech chunk: ${error.message}`);
    throw error;
  }
};

// Main controller function
const generateSpeech = async (req, res) => {
  try {
    const { text, userId } = req.body;
    let totalAudioBuffers = [];
    let timestamps = [];
    let cumulativeDuration = 0;
    
    // Validate inputs
    if (!Array.isArray(text) || text.some(item => typeof item !== 'string')) {
      return res.status(400).json({ error: 'Invalid text input. It should be an array of strings.' });
    }

    // Check user's plan and limits
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userData.service === "free" || userData.service === "plan1") {
      return res.status(400).json({ error: "Your subscription plan doesn't have this feature" });
    }else if (userData.service === "plan2") {
      const currentDate = new Date();
      if (currentDate > userData.end_date.toDate()) {
        return res.status(400).json({ error: "Your subscription plan has ended" });
      } 
    }

    // Process each text item
    for (let i = 0; i < text.length; i++) {
      const chunks = chunkText(text[i]);
      let pageAudioBuffers = [];

      // Generate speech for each chunk in this text item
      for (const chunk of chunks) {
        const audioBuffer = await generateSpeechChunk(
          chunk,
          process.env.ELEVENLABS_API_KEY
        );
        pageAudioBuffers.push(Buffer.from(audioBuffer));
      }

      // Combine buffers for this text item
      const pageBuffer = Buffer.concat(pageAudioBuffers);
      
      // Calculate duration for this page
      const pageDuration = await getMP3DurationFromBuffer(pageBuffer);
      
      // Add this page's buffer to the total
      totalAudioBuffers.push(pageBuffer);


      
      // Store cumulative timestamp for this page
      timestamps.push(cumulativeDuration)

      // Update cumulative duration for next page
      cumulativeDuration += pageDuration;

    }

    // Combine all pages' audio into a single buffer
    const finalCombinedBuffer = Buffer.concat(totalAudioBuffers);

    // Update user's generation count
    await admin.firestore().collection('users').doc(userId).update({
      voice_generation_count: admin.firestore.FieldValue.increment(-1)
     });

    // Send combined audio back to client
    res.set('Content-Type', 'audio/mpeg');
    res.set('Access-Control-Expose-Headers', 'x-audio-timestamps');
    res.set('x-audio-timestamps', JSON.stringify(timestamps));
    return res.send(finalCombinedBuffer);
  } catch (error) {
    console.error('TTS Generation Error:', error);
    
    // Send appropriate error response based on the error type
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message
    });
  }
};



module.exports = {
  generateSpeech
};





