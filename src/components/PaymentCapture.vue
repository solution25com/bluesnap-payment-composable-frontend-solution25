<template>
  <div id="bluesnap-credit-card" class="credit-card-container">
    <div class="header">
      <div class="header-text">
        <h3>BlueSnap Credit Card</h3>
        <p>Fast and reliable payments, every time.</p>
      </div>

      <div class="payment-logos">
        <img :src="cardLogoUrl" height="20px" />
      </div>
    </div>

    <div
      v-if="errorMessage"
      style="
        margin-top: 16px;
        background-color: #fde4e4;
        border-radius: 4px;
        color: #6f6f6f;
        font-size: 14px;
        display: flex;
        align-items: center;
        height: 50px;
        min-height: 48px;
        overflow: hidden;
        margin: 0;
      "
    >
      <span
        style="
          width: 40px;
          height: 48px;
          background-color: #eb5757;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px 0 0 4px;
        "
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Group 10084">
            <path
              id="Vector"
              d="M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              id="Vector_2"
              d="M12 9H12.0133"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              id="Vector_3"
              d="M11.0107 12H12.0107V16H13.0107"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </span>

      <span
        style="margin-left: 12px; line-height: 1.4; flex: 1"
        v-html="errorMessage"
      ></span>
    </div>

    <div class="form-check">
      <input
        type="checkbox"
        id="use-saved-card"
        class="form-check-input"
        v-model="useSavedCard"
      />
      <label for="use-saved-card" class="form-check-label">
        Use Saved Card
      </label>
    </div>

    <form class="checkout-form" @submit.prevent="onOrderSubmitButtonClick">
      <div v-if="useSavedCard">
        <div class="form-group">
          <input
            type="text"
            class="form-control"
            id="saved-card-name"
            :value="cardHolderName"
            placeholder="Card Holder Name*"
            readonly
          />
        </div>
        <div class="form-group">
          <input
            type="text"
            class="form-control"
            id="saved-card-name"
            :value="cardHolderName"
            placeholder="Card Holder Last Name*"
            readonly
          />
        </div>
        <div class="form-group">
          <input
            type="text"
            class="form-control"
            id="saved-card-number"
            :value="cardNumberDisplay"
            placeholder="Card Number*"
            readonly
          />
        </div>
      </div>

      <div v-else>
        <div class="form-row">
          <div class="form-group col-md-6">
            <input
              type="text"
              class="form-control"
              id="bluesnap-first-name"
              v-model="firstName"
              placeholder="First name*"
              required
            />
          </div>

          <div class="form-group col-md-6">
            <input
              type="text"
              class="form-control"
              id="bluesnap-last-name"
              v-model="lastName"
              placeholder="Last name*"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <div
            class="form-control"
            id="card-number"
            data-bluesnap="ccn"
            placeholder="Card number*"
          ></div>
          <span class="helper-text">
            16 digits on your card, e.g., 1234 5678 9123 4567
          </span>
        </div>

        <div class="form-row">
          <div class="form-group col-md-6">
            <div
              class="form-control"
              id="exp-date"
              data-bluesnap="exp"
              placeholder="Exp. Date*"
            ></div>
          </div>
          <div class="form-group col-md-6">
            <div
              class="form-control"
              id="cvv"
              data-bluesnap="cvv"
              placeholder="CVC/CVV*"
            ></div>
          </div>
        </div>

        <div class="form-check">
          <input
            type="checkbox"
            id="bluesnap-save-card"
            class="form-check-input"
            v-model="saveCard"
          />
          <label for="bluesnap-save-card" class="form-check-label">
            Save card for future payment
          </label>
        </div>
      </div>

      <button type="submit" class="btn btn-primary mt-3 submit-button">
        Secure payments
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from "vue";
import { useBluesnapPayment } from "../composables/useBlueSnapPayment.ts";

export default defineComponent({
  name: "BluesnapCreditCard",
  emits: ["capture-success", "capture-failure"],
  props: {
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
  },
  setup(props, { emit }) {
    const {
      useSavedCard,
      firstName,
      lastName,
      saveCard,
      cardNumberDisplay,
      cardHolderName,
      cardLogoUrl,
      fetchPfToken,
      creditCardCapture,
      vaultedCapture,
      errorMessage,
    } = useBluesnapPayment({ currency: props.currency });

    const modifiedCreditCardCapture = async () => {
      if (useSavedCard.value) {
        await vaultedCapture();
      } else {
        await creditCardCapture(
          (result) => {
            const parsedJSON = JSON.parse(result.message);
            const transactionID = parsedJSON.transactionId;
            emit("capture-success", transactionID);
          },
          (error) => {
            console.error("Payment failed:", error);
            emit("capture-failure", error);
          }
        );
      }
    };

    onMounted(() => {
      if (!useSavedCard.value) {
        fetchPfToken();
      }
    });

    watch(useSavedCard, (newValue) => {
      if (!newValue) {
        fetchPfToken();
      }
    });

    return {
      useSavedCard,
      firstName,
      lastName,
      saveCard,
      cardNumberDisplay,
      cardHolderName,
      cardLogoUrl,
      onOrderSubmitButtonClick: modifiedCreditCardCapture,
      errorMessage,
    };
  },
});
</script>

<style>
#bluesnap-credit-card {
  border: 1px solid #e6e9ec;
  border-radius: 12px;
  padding: 24px;
  width: 520px;
  background-color: #fff;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  justify-content: space-between;
}

.header-text h3 {
  font-size: 18px;
  font-weight: bold;
  color: #1d1d1f;
  margin: 0;
}

.header-text p {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.payment-logos img {
  height: 32px;
  margin-left: 8px;
}

/* Form Fields */
.form-control {
  height: 48px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  color: #495057;
  width: 100%;
}

.form-control::placeholder {
  color: #adb5bd;
}

.helper-text {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.form-check-label {
  font-size: 14px;
  color: #495057;
  margin-left: 8px;
}

.form-check {
  text-align: left;
}

.submit-button {
  width: 100%;
  height: 48px;
  background-color: #007bff;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  text-transform: uppercase;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #0056b3;
}

.error-message {
  margin-top: 16px;

  background-color: #fde4e4;

  border-left: 40px solid #eb5757;
  border-radius: 4px;
  color: #6f6f6f;
  font-size: 14px;
  text-align: left;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 12px;
  position: relative;
  gap: 8px;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #eb5757;
  border-radius: 50%;
  color: #fff;
  font-weight: bold;
  position: absolute;
  left: 8px;
}

.error-text {
  flex: 1;
  line-height: 1.4;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.form-group {
  flex: 1;
  margin-bottom: 16px;
}

.col-md-6 {
  flex: 0 0 48%;
}

.header-text h3 {
  text-align: left;
}

.form-check-input {
  border-color: #6c757d;
}

.form-check {
  display: flex;
  align-items: center;
  margin: 8px 0 8px 0;
}

.form-check-input {
  margin-bottom: 5px;
}

.error-text {
  margin-left: 40px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  .col-md-6 {
    flex: 1;
  }
}
</style>
