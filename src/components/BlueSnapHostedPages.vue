<template>
  <div>
    <button class="pay-button">Pay Now</button>
  </div>
</template>

<script>
import { defineComponent, watch } from "vue";
import BlueSnapApi from "../services/BlueSnapApi";

export default defineComponent({
  name: "BluesnapDirectDebitTest",
  props: {
    orderId: {
      type: String,
      required: false,
    },
    successUrl: {
      type: String,
      required: false,
    },
    failedUrl: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const processPayment = async () => {
      if (!props.orderId) {
        console.log("Order ID is not yet available.");
        return;
      }

      console.log(
        "Order ID is available, proceeding with payment:",
        props.orderId
      );

      const transactionDetails = {
        order_id: props.orderId,
        successUrl: "https://yourdomain.com/success",
        failedUrl: "https://yourdomain.com/failure",
        paymentMethod: "HOSTED_CHECKOUT",
      };

      try {
        const result = await BlueSnapApi.hostedCheckout(transactionDetails);

        if (result?.message) {
          console.log("Redirecting to:", result.message);
          window.location.href = result.message;
        } else {
          console.error("Error: No redirection URL received.");
        }
      } catch (error) {
        console.error("Error during BlueSnap API call:", error);
      }
    };

    watch(
      () => props.orderId,
      (newOrderId) => {
        if (newOrderId) {
          console.log("Order ID updated:", newOrderId);
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
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.pay-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.pay-button:active {
  background-color: #004080;
  transform: scale(1);
}

.pay-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
