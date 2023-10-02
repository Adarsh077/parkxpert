const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

class RazorpayService {
  async getPaymentLinkDetails({ id }) {
    try {
      const paymentLinkResponse = await razorpay.paymentLink.fetch(id);

      return {
        link: paymentLinkResponse.short_url,
        id: paymentLinkResponse.id,
        amount: paymentLinkResponse.amount,
        amount_paid: paymentLinkResponse.amount_paid,
        status: paymentLinkResponse.status,
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createPaymentLink({ amount }) {
    try {
      const paymentLinkResponse = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: 'INR',
        accept_partial: false,
      });

      return {
        link: paymentLinkResponse.short_url,
        id: paymentLinkResponse.id,
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

module.exports = new RazorpayService();
