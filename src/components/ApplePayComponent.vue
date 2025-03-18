<template>
  <div v-if="applePayWarningMessage" class="alert alert-warning">
    {{ applePayWarningMessage }}
  </div>

  <button
    id="apple-pay-button"
    v-if="isApplePayAvailable"
    @click="applePayClicked"
  ></button>
</template>

<script lang="ts" setup>
import { useApplePay } from "../composables/useApplePay.ts";
const { currency, domain } = defineProps({
  currency: {
    type: String,
    required: true,
    default: "USD",
  },
  domain: {
    type: String,
    required: true,
    default: "your-production-domain.com",
  },
});
const { isApplePayAvailable, applePayWarningMessage, applePayClicked } =
  useApplePay({ currency, domain });
const emit = defineEmits(["payment-success", "payment-failure"]);

function handleApplePayClick(result) {
  applePayClicked(
    (result) => {
      const parsedJSON = JSON.parse(result.message);
      const transactionID = parsedJSON.transactionId;
      emit("payment-success", transactionID);
    },
    () => {
      emit("payment-failure");
    }
  );
}
</script>

<style scoped>
#apple-pay-button {
  -webkit-appearance: -apple-pay-button;
  -apple-pay-button-type: plain;
  display: inline-block;
  width: 200px;
  min-height: 30px;
  border: 1px solid black;
  background-image: -webkit-named-image(apple-pay-logo-white);
  background-size: 100% calc(60% + 2px);
  background-repeat: no-repeat;
  background-color: black;
  background-position: 50% 50%;
  border-radius: 5px;
  padding: 0px;
  margin: 5px auto;
}
.alert {
  margin: 10px auto;
  padding: 10px;
  border: 1px solid #f5c6cb;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
</style>
