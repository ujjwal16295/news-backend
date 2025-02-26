const { Paddle, EventName } = require('@paddle/paddle-node-sdk');
const admin = require('firebase-admin');

const paddle = new Paddle(process.env.PADDLE_API_KEY);

const handleWebhook = async (req, res) => {
  const signature = (req.headers['paddle-signature'] || '');
  const rawRequestBody = req.body.toString();
  const secretKey = process.env.WEBHOOK_SECRET_KEY || '';

  try {
    if (!signature || !rawRequestBody) {
      console.log('Signature or request body missing');
      return res.status(400).json({ error: 'Invalid webhook request' });
    }

    const eventData = await paddle.webhooks.unmarshal(rawRequestBody, secretKey, signature);
    
    switch (eventData.eventType) {
      case EventName.SubscriptionCreated: {
     
        const planType=eventData.data.customData.planType
        const userId  = eventData.data.customData.userIdFirebase
        const endDateString = eventData.data.nextBilledAt
        const startDate = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(new Date(endDateString))
    

        const baseUpdate = {
          service: planType,
          paddleSubscriptionId: eventData.data.id,
          subscriptionStatus: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          start_date: startDate,
          end_date: endDate,
        };

        if (planType === "plan1") {
          await admin.firestore().collection('users').doc(userId).update({
            ...baseUpdate,
            news_generation_count: 1000000,
            voice_generation_count: 0,
          });
        } else if (planType === "plan2") {
          await admin.firestore().collection('users').doc(userId).update({
            ...baseUpdate,
            news_generation_count: 1000000,
            voice_generation_count: 1000000,
          });
        }
        console.log(eventData.data.customData)
        console.log(eventData.data.customData)
        console.log(eventData.data.nextBilledAt)
        console.log(`Product ${eventData.data.id} was created`);
        break;
      }

      case EventName.SubscriptionUpdated || EventName.SubscriptionResumed: {
        const planType=eventData.data.customData.planType
        const userId  = eventData.data.customData.userIdFirebase
        const endDateString = eventData.data.nextBilledAt
        const startDate = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(new Date(endDateString))

        const baseUpdate = {
            service: planType,
            paddleSubscriptionId: eventData.data.id,
            subscriptionStatus: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            start_date: startDate,
            end_date: endDate,
          };
  
          if (planType === "plan1") {
            await admin.firestore().collection('users').doc(userId).update({
              ...baseUpdate,
              news_generation_count: 1000000,
              voice_generation_count: 0,
            });
          } else if (planType === "plan2") {
            await admin.firestore().collection('users').doc(userId).update({
              ...baseUpdate,
              news_generation_count: 1000000,
              voice_generation_count: 1000000,
            });
          }
 

        console.log(`Product ${eventData.data.id} was updated`);

        break;
      }
      case EventName.SubscriptionCanceled || EventName.SubscriptionPastDue || EventName.SubscriptionPaused: {
        const planType=eventData.data.customData.planType
        const userId  = eventData.data.customData.userIdFirebase
        const endDateString = eventData.data.nextBilledAt
        const startDate = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(new Date(endDateString))
        await admin.firestore().collection('users').doc(userId).update({
          service: 'free',
          news_generation_count: 3,
          voice_generation_count: 0,
          subscriptionStatus: 'canceled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Product ${eventData.data.id} was cancelled`);

        break;
      }

      default:
        console.log(`Unhandled event type: ${eventData.eventType}`);
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// const getCheckoutDetails = async (req, res) => {
//     const { checkoutId } = req.body;
  
//     try {
//       if (!checkoutId) {
//         return res.status(400).json({ error: 'Checkout ID is required' });
//       }
  
//       // Get transaction using Paddle SDK
//       const transaction = await paddle.transactions.list({
//         id: checkoutId
//       });
  
//       // Check if transaction exists
//       if (!transaction || !transaction.data || transaction.data.length === 0) {
//         return res.status(404).json({ error: 'Transaction not found' });
//       }
  
//       // Return the transaction data
//       res.json(transaction.data[0]);
  
//     } catch (error) {
//       console.error('Error fetching transaction:', error);
      
//       // Handle Paddle API specific errors
//       if (error.name === 'PaddleApiError') {
//         return res.status(error.status || 400).json({
//           error: error.message
//         });
//       }
  
//       // Handle generic errors
//       res.status(500).json({ error: error.message });
//     }
//   };
  

module.exports = {
  handleWebhook,
//   getCheckoutDetails
};
   