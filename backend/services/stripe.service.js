const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async constructEvent(body, signature, webhookSecret) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return null;
    }
  }
  async getPaymentLinkDetails({ id }) {
    try {
      if (!id) return null;
      const session = await stripe.checkout.sessions.retrieve(id);
      console.log(session);
      return { status: session.payment_status, link: session.url };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createPaymentLink({ amount }) {
    try {
      const session = await stripe.checkout.sessions.create({
        success_url: 'http://google.com/',
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product: 'prod_Ou5NlOIVYUHbNh',
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
      });
      if (!session) {
        return null;
      }
      return { link: session.url, id: session.id };
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

module.exports = new StripeService();
