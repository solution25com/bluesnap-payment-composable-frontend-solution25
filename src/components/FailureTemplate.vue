<template>
  <div class="failure">
    <h2>Payment Failed</h2>
    <p>Something went wrong with your payment. Please try again later.</p>
  </div>
</template>

<script>
export default {
  name: "FailureTemplate",
};
</script>

<style scoped>
.failure {
  text-align: center;
  color: #f44336;
}
</style>
