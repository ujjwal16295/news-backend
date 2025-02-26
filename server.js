// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const imageRoutes = require('./routes/imageRoutes');
// const pdfRoutes = require('./routes/pdfRoutes');

// dotenv.config();
// const { initializeFirebase } = require('./config/firebase');

// // Initialize Firebase
// initializeFirebase();
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/upload-image', imageRoutes);
// app.use('/upload-pdf', pdfRoutes);
// // Special handling for Stripe webhook endpoint
// app.post('/api/webhook', express.raw({type: 'application/json'}));

// // Routes
// app.use('/api', require('./routes/payment'));

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const localtunnel = require('localtunnel'); // Import LocalTunnel
const { initializeUploadsDirectory } = require('./utils/upload');
const imageRoutes = require('./routes/imageRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const stripeRoutes = require('./routes/stripeSessionRoute');
const payementController = require("./controllers/payementController")
const paddleController = require("./controllers/paddleController")


const { initializeFirebase } = require('./config/firebase');

// Initialize Firebase
initializeFirebase();
const app = express();
app.use(cors());

// Special handling for Stripe webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  payementController.handleWebhook(req, res);
});
app.post('/paddle-webhook',express.raw({type: 'application/json'}), (req, res) => {
  paddleController.handleWebhook(req, res);
});

app.use(express.json());


// Routes
app.use(imageRoutes);
app.use(pdfRoutes);

// Initialize uploads directory
initializeUploadsDirectory().catch(console.error);



// Routes
app.use('/api', require('./routes/payment'));
app.use('/api', require('./routes/tts'));
app.use('/api/stripe', stripeRoutes);

// Add Paddle routes
// app.use('/api/paddle', require('./routes/paddle'));


const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // try {
  //   const tunnel = await localtunnel({ port: PORT });
  //   console.log(`LocalTunnel running at: ${tunnel.url}`);

  //   tunnel.on('close', () => {
  //     console.log('LocalTunnel closed');
  //   });
  // } catch (err) {
  //   console.error('Error starting LocalTunnel:', err);
  //   console.log("h")
  // }
});
