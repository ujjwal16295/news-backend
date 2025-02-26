const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planType, userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId,
        planType,
        email
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      // The body will now be available as a Buffer
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planType,email } = session.metadata;
        console.log("completed")
        const now = new Date();
        const startDate = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        
        if(planType=="plan1"){
            await admin.firestore().collection('users').doc(userId).update({
                service: planType,
                news_generation_count: 1000000,
                voice_generation_count: 0,
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                start_date: startDate,
                end_date: endDate,
              });
        }
        else if(planType=="plan2"){
            await admin.firestore().collection('users').doc(userId).update({
                service: planType,
                news_generation_count: 1000000,
                voice_generation_count: 1000000,
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                start_date: startDate,
                end_date: endDate,
              });

        }
        

        console.log(`✅ Successfully updated plan for user ${userId} to ${planType}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        const email = subscription.metadata.email
        const planType= subscription.metadata.planType
        const now = new Date();
        const startDate = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

       if(planType=="plan1"){
        await admin.firestore().collection('users').doc(userId).update({
            service: planType,
            subscriptionStatus: subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            news_generation_count: 1000000,
            voice_generation_count: 0,
            start_date: startDate,
            end_date: endDate,
          });
       }
       else if(planType=="plan2"){
        await admin.firestore().collection('users').doc(userId).update({
            service: planType,
            subscriptionStatus: subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            news_generation_count: 1000000,
            voice_generation_count: 1000000,
            start_date: startDate,
            end_date: endDate,
          });

       }
        

        console.log(`✅ Updated subscription status for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        const email = subscription.metadata.email;
      
        // Create a new document with only the specified fields
        const newDocData = {
          service: 'free',
          news_generation_count: 3,
          voice_generation_count: 0
        };
      
        // Use set with merge: false to overwrite the entire document
        await admin.firestore().collection('users').doc(userId).set(newDocData);
      
        console.log(`✅ Subscription canceled and document reset for user ${userId}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`❌ Error processing webhook: ${err.message}`);
    res.json({ received: true });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook
};