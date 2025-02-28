<template>
  <div id="container"></div>
<!--    <component v-if="successPayment === true"-->
<!--      :is="SuccessTemplate"-->
<!--    />-->
<!--    <component v-else-if="successPayment === false"-->
<!--      :is="FailureTemplate" />-->
<!--  </div>-->
</template>

<script>
import { onMounted, watch } from 'vue';
import { useGooglePayment } from '../composables/useGooglePayment.ts';
import FailureTemplate from "./FailureTemplate.vue";
import SuccessTemplate from "./SuccessTemplate.vue";

export default {
  name: "GooglePayComponent",
  emits: ["payment-success", "payment-failure"], // Declare emitted events
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
      type: Object, // Accept a Vue component for success
      required: false,
    },
    failureComponent: {
      type: Object, // Accept a Vue component for failure
      required: false,
    },
    currency: {
      type: String,
      required: true,
      default: "USD", // Default currency
    },
  },
  setup(props, { emit }) {
    const {
      fetchedTotalPrice,
      initializeCart,
      loadGooglePayScript,
      onGooglePayLoaded,
      addGooglePayButton,
      getBlueSnapConfig,
      successPayment,
    } = useGooglePayment({currency: props.currency});

    // Emit events based on `successPayment` value
    watch(successPayment, (newValue) => {
      if (newValue === true) {
        console.log("Emitting payment-success event");
        emit("payment-success");
      } else if (newValue === false) {
        console.log("Emitting payment-failure event");
        emit("payment-failure");
      }
    });

    // Initialize cart and load Google Pay script when component is mounted
    onMounted(async () => {
      if (getBlueSnapConfig()) {
        await initializeCart();
        await loadGooglePayScript(onGooglePayLoaded);
      }
    });

    // Watch for changes in `totalPrice` prop
    watch(
        () => props.totalPrice,
        (newValue) => {
          console.log("Total Price:", newValue);
          console.log("Success payment state:", successPayment);
        }
    );

    return {
      fetchedTotalPrice,
      addGooglePayButton,
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
