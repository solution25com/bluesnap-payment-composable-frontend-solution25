<template>
    <div>
      <button class="pay-button">Pay Now</button>
  </div>
</template>

<script>
import { defineComponent, watch } from 'vue';
import BlueSnapApi from '../services/BlueSnapApi';

export default defineComponent({
  name: 'BluesnapDirectDebitTest',
  props: {
    orderId: {
      type: String,
      required: false, // Allow dynamic updates
    },
    successUrl: {
      type: String,
      required: false
    },
    failedUrl: {
      type: String,
      required: false
    }
  },
  setup(props) {
    const processPayment = async () => {
      if (!props.orderId) {
        console.log('Order ID is not yet available.');
        return;
      }

      console.log('Order ID is available, proceeding with payment:', props.orderId);

      const transactionDetails = {
        order_id: props.orderId,
        successUrl: 'https://yourdomain.com/success', // Replace with your success URL
        failedUrl: 'https://yourdomain.com/failure', // Replace with your failure URL
        paymentMethod: "HOSTED_CHECKOUT"
      };

      try {
        const result = await BlueSnapApi.hostedCheckout(transactionDetails);

        if (result?.message) {
          console.log('Redirecting to:', result.message);
          window.location.href = result.message; // Redirect to the URL in the response
        } else {
          console.error('Error: No redirection URL received.');
        }
      } catch (error) {
        console.error('Error during BlueSnap API call:', error);
      }
    };

    // Automatically call processPayment when orderId is updated
    watch(
        () => props.orderId,
        (newOrderId) => {
          if (newOrderId) {
            console.log('Order ID updated:', newOrderId);
            processPayment();
          }
        }
    );

    return {
      processPayment,
    };
  },
});
</script>

<style scoped>
.pay-button {
  background-color: #007bff; /* Primary button color */
  color: #ffffff; /* White text */
  border: none; /* No border */
  border-radius: 5px; /* Slightly rounded corners */
  padding: 10px 20px; /* Add some padding */
  font-size: 16px; /* Slightly larger text */
  font-weight: bold; /* Bold text */
  cursor: pointer; /* Pointer cursor on hover */
  transition: background-color 0.3s ease, transform 0.2s ease; /* Smooth hover effect */
}
.pay-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
  transform: scale(1.05); /* Slightly enlarge the button */
}

.pay-button:active {
  background-color: #004080; /* Even darker blue when clicked */
  transform: scale(1); /* Reset scale on click */
}

.pay-button:disabled {
  background-color: #cccccc; /* Gray color for disabled state */
  cursor: not-allowed; /* Indicate disabled state */
}
</style>
