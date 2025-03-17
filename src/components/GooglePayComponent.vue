<template>
  <div id="container"></div>
  <!--
  <component v-if="successPayment === true" :is="SuccessTemplate" />
  <component v-else-if="successPayment === false" :is="FailureTemplate" />
  -->
</template>

<script>
import { onMounted, watch } from 'vue';
import { useGooglePayment } from '../composables/useGooglePayment.ts';
import FailureTemplate from "./FailureTemplate.vue";
import SuccessTemplate from "./SuccessTemplate.vue";

export default {
  name: "GooglePayComponent",
  emits: ["payment-success", "payment-failure"],
  computed: {
    SuccessTemplate() {
      return SuccessTemplate;
    },
    FailureTemplate() {
      return FailureTemplate;
    },
  },
  props: {
    totalPrice: {
      type: Number,
      default: 0,
    },
    successComponent: {
      type: Object,
      required: false,
    },
    failureComponent: {
      type: Object,
      required: false,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
  },
  setup(props, { emit }) {
    const {
      fetchedTotalPrice,
      initializeCart,
      loadGooglePayScript,
      onGooglePayLoaded,
      getBlueSnapConfig,
      successPayment,
      paymentResult,
    } = useGooglePayment({ currency: props.currency });

    // Watch the full payment result and emit events with the transactionId if available.
    watch(paymentResult, (newValue) => {
      if (newValue) {
        if (newValue.success) {
          console.log("Emitting payment-success event with transactionId:", newValue.transactionId);
          emit("payment-success", newValue.transactionId);
        } else {
          console.log("Emitting payment-failure event");
          emit("payment-failure", newValue);
        }
      }
    });

    // Initialize cart and load Google Pay script when component is mounted.
    onMounted(async () => {
      await getBlueSnapConfig();
      await initializeCart();
      await loadGooglePayScript(onGooglePayLoaded);
    });

    // Optional: Watch changes in totalPrice for debugging.
    watch(
        () => props.totalPrice,
        (newValue) => {
          console.log("Total Price:", newValue);
          console.log("Success payment state:", successPayment);
        }
    );

    return {
      fetchedTotalPrice,
      successPayment,
    };
  },
};
</script>

<style scoped>
#id {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}
</style>
