// src/composables/useBluesnapPayment.js
import { ref } from "vue";
import BlueSnapApi from "../services/BlueSnapApi.ts";

export function useBlueSnapHostedPages() {
  const error = ref(null);

  async function processPayment() {
    try {
      const result = await BlueSnapApi.hostedCheckout();

      if (result) {
        const token = result.message.jwt;

        const disabledPaymentMethods = [
          "APPLE_PAY",
          "PAYPAL",
          "SEPA",

          "ECP",
          "GOOGLE_PAY_TOKENIZED_CARD",
        ];

        const sdkRequest = {
          jwt: token,
          displayData: {
            disabledPaymentMethods: disabledPaymentMethods,
          },
        };
        bluesnap.redirectToPaymentPage(sdkRequest);
      } else {
        console.error("Error: No token received");
        error.value = "Error: No token received";
      }
    } catch (e) {
      console.error(e);
      error.value = e.message;
    }
  }

  return {
    processPayment,
    error,
  };
}
