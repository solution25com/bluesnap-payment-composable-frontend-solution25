<template>
  <div id="app">
<!--    <GooglePayComponent-->
<!--        :successComponent="SuccessTemplate"-->
<!--        :failureComponent="FailureTemplate"-->
<!--    />-->
    <PaymentCapture/>
<!--    <ApplePayComponent/>-->
<!--    <BlueSnapHostedPages />-->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
// import GooglePayComponent from "./components/GooglePayComponent.vue";
// import SuccessTemplate from "./components/SuccessTemplate.vue";
// import FailureTemplate from "./components/FailureTemplate.vue";
import PaymentCapture from "./components/PaymentCapture.vue";
import ApplePayComponent from "./components/ApplePayComponent.vue";
// import BlueSnapHostedPages from "./components/BlueSnapHostedPages.vue";


export default defineComponent({
  name: "App",
  components: {
    // BlueSnapHostedPages
    // ApplePayComponent
    PaymentCapture,
    // GooglePayComponent,
    // SuccessTemplate,
    // FailureTemplate,
  },
});
</script>

<style lang="scss">
body {
  // background-color: #ffffff;
  // margin: 0;
  // font-family: "Arial Unicode MS";
}
// #app {
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   min-height: 100vh;
//   padding: 20px;
// }
</style>
