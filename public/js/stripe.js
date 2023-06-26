/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe("pk_test_51NMYEISFCwtNkN2Q6ENbXOzq4GzSKyhJmqWjzzd5bOwi23mwjLs6mMtdiL6pRqexj7EV8vS1QAErA1xKjRJzT8Le004172oMDV");

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};