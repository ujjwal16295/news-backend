// const axios = require('axios');
// const admin = require('firebase-admin');

// // Utility function to chunk text into smaller pieces
// const chunkText = (text, maxChunkSize = 2500) => {
//   // Split text at sentence boundaries
//   const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
//   const chunks = [];
//   let currentChunk = '';

//   for (const sentence of sentences) {
//     // If adding this sentence would exceed maxChunkSize, start a new chunk
//     if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
//       chunks.push(currentChunk.trim());
//       currentChunk = '';
//     }
//     currentChunk += sentence + ' ';
//   }

//   // Add the last chunk if it's not empty
//   if (currentChunk.trim().length > 0) {
//     chunks.push(currentChunk.trim());
//   }

//   return chunks;
// };

// // Function to generate speech for a single chunk
// const generateSpeechChunk = async (text, apiKey) => {
//   try {
//     const response = await axios.post(
//       'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
//       {
//         text,
//         model_id: 'eleven_monolingual_v1',
//         voice_settings: {
//           stability: 0.5,
//           similarity_boost: 0.5
//         }
//       },
//       {
//         headers: {
//           'xi-api-key': apiKey,
//           'Content-Type': 'application/json'
//         },
//         responseType: 'arraybuffer'
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(`Error generating speech chunk: ${error.message}`);
//     throw error;
//   }
// };

// // Main controller function
// const generateSpeech = async (req, res) => {
//   try {
//     const { text, userId } = req.body;

    
//     // Validate inputs
//     if (!text || typeof text !== 'string') {
//       return res.status(400).json({ error: 'Invalid text input' });
//     }

//     // Optional: Check user's plan and limits
//     // Uncomment if you want to implement plan checking
//     /*
//     const userDoc = await admin.firestore().collection('users').doc(userId).get();
//     const userData = userDoc.data();
    
//     if (!userData || !['plan2', 'plan3'].includes(userData.service)) {
//       return res.status(403).json({ error: 'TTS is only available for Plan 2 and Plan 3 users' });
//     }

//     if (userData.voice_generation_count >= getVoiceLimit(userData.service)) {
//       return res.status(403).json({ error: 'Voice generation limit reached for current plan' });
//     }
//     */
    
//     const userDoc = await admin.firestore().collection('users').doc(userId).get();
//     const userData = userDoc.data()

//       if(userData.service=="free"|| userData.service=="plan1"){
//          return res.status(400).json({error:"your  subscription plan dosent have this feature"})
      
//       }else if(userData.service=="plan2"){
//         const currentDate = new Date();
//         if(currentDate>userData.end_date.toDate()){
//             return res.status(400).json({error:"your  subscription plan has ended"})

//         }else{
//         // Split text into manageable chunks
//         const chunks = chunkText(text);
//           let audioBuffers = [];

//     // Generate speech for each chunk
//     for (const chunk of chunks) {
//       const audioBuffer = await generateSpeechChunk(
//         chunk,
//         process.env.ELEVENLABS_API_KEY
//       );
//       audioBuffers.push(Buffer.from(audioBuffer));
//     }

//     // Combine all audio buffers
//     const combinedBuffer = Buffer.concat(audioBuffers);

//     // Optional: Update user's generation count
//     /*
//     await admin.firestore().collection('users').doc(userId).update({
//       voice_generation_count: admin.firestore.FieldValue.increment(1)
//     });
//     */
//     await admin.firestore().collection('users').doc(userId).update({
//         voice_generation_count:admin.firestore.FieldValue.increment(-1)
//       });

//     // Send combined audio back to client
//     res.set('Content-Type', 'audio/mpeg');
//     res.send(combinedBuffer);
        


//         }
//       }

    

    

//   } catch (error) {
//     console.error('TTS Generation Error:', error);
    
//     // Send appropriate error response based on the error type
//     if (error.response?.status === 401) {
//       return res.status(401).json({ error: 'Invalid API key' });
//     }
//     if (error.response?.status === 429) {
//       return res.status(429).json({ error: 'Rate limit exceeded' });
//     }
    
//     res.status(500).json({ 
//       error: 'Failed to generate speech',
//       details: error.message
//     });
//   }
// };



// module.exports = {
//   generateSpeech
// };


// play ht

const admin = require('firebase-admin');
const PlayHT = require('playht');

// Updated chunk function with 2000 character limit for PlayHT
const chunkText = (text, maxChunkSize = 2000) => {
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
    
    // If a single sentence is longer than maxChunkSize, split it at word boundaries
    if (sentence.length > maxChunkSize) {
      // If current chunk has content, add it to chunks first
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split long sentence into words
      const words = sentence.split(' ');
      let wordChunk = '';
      
      for (const word of words) {
        if ((wordChunk + ' ' + word).length > maxChunkSize && wordChunk.length > 0) {
          chunks.push(wordChunk.trim());
          wordChunk = '';
        }
        wordChunk += (wordChunk ? ' ' : '') + word;
      }
      
      // Add any remaining words
      if (wordChunk.trim().length > 0) {
        currentChunk = wordChunk.trim() + ' ';
      }
    } else {
      currentChunk += sentence + ' ';
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Final validation to ensure no chunk exceeds the limit
  return chunks.map(chunk => {
    if (chunk.length > maxChunkSize) {
      return chunk.substring(0, maxChunkSize);
    }
    return chunk;
  });
};

// Function to generate speech for a single chunk using PlayHT SDK
const generateSpeechChunk = async (text) => {
  try {
    // Ensure text is within the 2000 character limit
    if (text.length > 2000) {
      throw new Error('Text chunk exceeds PlayHT 2000 character limit');
    }
    
    // Generate speech using PlayHT SDK instead of direct API calls
    const generated = await PlayHT.generate(text, {
      voiceId: 'Charlotte',
      outputFormat: 'mp3',
      speed: 1.0,
      sampleRate: 24000,
      quality: 'draft'
    });
    
    console.log('PlayHT Generation:', JSON.stringify(generated));
    
    // Extract the audio URL
    const { audioUrl } = generated;
    
    if (!audioUrl) {
      throw new Error('No audio URL returned from PlayHT');
    }

    // Download the audio file as arraybuffer
    const fetch = await import('node-fetch');
    const response = await fetch.default(audioUrl);
    const buffer = await response.arrayBuffer();
    
    return Buffer.from(buffer);
  } catch (error) {
    console.error(`Error generating speech chunk:`, error);
    throw error;
  }
};

// Main controller function
const generateSpeech = async (req, res) => {
  try {
    const { text, userId } = req.body;
    
    // Validate inputs
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text input' });
    }

    // Check user's plan and limits
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userData.service === "free" || userData.service === "plan1") {
      return res.status(400).json({ error: "Your subscription plan doesn't have this feature" });
    } else if (userData.service === "plan2") {
      const currentDate = new Date();
      if (currentDate > userData.end_date.toDate()) {
        return res.status(400).json({ error: "Your subscription plan has ended" });
      } else {
        // Initialize PlayHT SDK with API credentials
        PlayHT.init({
          apiKey: process.env.PLAYHT_API_KEY,
          userId: process.env.PLAYHT_USER_ID
        });
        
        // Split text into manageable chunks - ensuring 2000 char limit
        const chunks = chunkText(text, 2000);
        let audioBuffers = [];

        // Generate speech for each chunk
        for (const chunk of chunks) {
          try {
            const audioBuffer = await generateSpeechChunk(chunk);
            audioBuffers.push(audioBuffer);
          } catch (chunkError) {
            console.error(`Error processing chunk: ${chunk.substring(0, 50)}...`, chunkError);
            throw chunkError;
          }
        }

        // Combine all audio buffers
        const combinedBuffer = Buffer.concat(audioBuffers);

        // Update user's generation count
        await admin.firestore().collection('users').doc(userId).update({
          voice_generation_count: admin.firestore.FieldValue.increment(-1)
        });

        // Send combined audio back to client
        res.set('Content-Type', 'audio/mpeg');
        res.send(combinedBuffer);
      }
    }
  } catch (error) {
    console.error('TTS Generation Error:', error);
    
    // Send appropriate error response
    if (error.message?.includes('Invalid API key')) {
      return res.status(401).json({ error: 'Invalid API key or user ID' });
    }
    if (error.message?.includes('Rate limit')) {
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