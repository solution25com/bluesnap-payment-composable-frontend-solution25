import { ref, onMounted, watch, Ref, computed } from "vue";
import BlueSnapApi from "../services/BlueSnapApi.ts";
import {
  BlueSnapHostedPaymentFieldsCreateOptions,
  ThreeDSecureObj,
} from "../types/BlueSnapTypes.ts";
import { BlueSnapConfigResponse } from "../types/ConfigTypes.ts";
import {
  AUTH_SUCCESS,
  BlueSnapMode,
  CARD_URLS,
  CART_LOG_URG,
  SDK_URL,
} from "../config/constants.ts";

export function useBluesnapPayment({ currency }: { currency: string }) {
  const useSavedCard = ref<boolean>(false);
  const errorMessage = ref<string>("");
  const firstName = ref<string>("");
  const lastName = ref<string>("");
  const saveCard = ref<boolean>(false);
  const cardNumberDisplay = ref<string>("");
  const cardHolderName = ref<string>("");
  const cardLogoUrl = ref<string>(CART_LOG_URG);
  const pfToken = ref<string>("");
  const amount = ref<number>(0);
  const logMessages = ref<string>("");
  const tokenLoaded = ref<boolean>(false);
  const cardTypeToServer = ref<string>("");
  const vaultedCardCC = ref<string>("");
  const vaultedFirstName = ref<string>("");
  const vaultedLastName = ref<string>("");
  const last4Digits = ref<string>("");

  const threeDSecureObj = ref<ThreeDSecureObj>({
    amount: amount.value,
    currency: currency,
    billingFirstName: firstName.value,
    billingLastName: lastName.value,
  });

  const blueSnapConfig: Ref<BlueSnapConfigResponse["message"]> = ref({
    mode: BlueSnapMode.Sandbox,
    merchantId: "",
    "3D": true,
  });

  const threeDS = computed(() => blueSnapConfig.value["3D"]);

  const cardUrl: Record<string, string> = {
    AMEX: CARD_URLS.AMEX,
    DINERS: CARD_URLS.DINERS,
    DISCOVER: CARD_URLS.DISCOVER,
    JCB: CARD_URLS.JCB,
    MASTERCARD: CARD_URLS.MASTERCARD,
    VISA: CARD_URLS.VISA,
  };

  const getBlueSnapConfig = async (): Promise<void> => {
    try {
      const response = await BlueSnapApi.fetchBlueSnapConfig();
      if (response.success && response.message) {
        blueSnapConfig.value = {
          mode: response.message.mode,
          merchantId: response.message.merchantId,
          "3D": response.message["3D"],
          merchantGoogleId: response.message.merchantGoogleId,
        };
      }
    } catch (error) {
      console.error("Error fetching BlueSnap configurations:", error);
    }
  };

  const initializeBlueSnap = (): void => {
    if (!pfToken.value) {
      return;
    }

    const blueSnapObject: BlueSnapHostedPaymentFieldsCreateOptions = {
      "3DS": threeDS.value,
      token: pfToken.value,
      onFieldEventHandler: {
        onFocus: (tagId: string) => {
          changeImpactedElement(
            tagId,
            "hosted-field-valid hosted-field-invalid",
            "hosted-field-focus"
          );
        },
        onBlur: (tagId: string) => {
          changeImpactedElement(tagId, "hosted-field-focus");
        },
        onError: (
          tagId: string,
          errorCode: string,
          errorDescription: string,
          eventOrigin: string
        ) => {
          changeImpactedElement(
            tagId,
            "hosted-field-valid hosted-field-focus",
            "hosted-field-invalid"
          );
          const helpElement = document.getElementById(`${tagId}-help`);
          if (helpElement) {
            helpElement.textContent = `${errorCode} - ${errorDescription} - ${eventOrigin}`;
          }

          console.error(
            `Card Transaction Error on field ${tagId}: [${errorCode}] ${errorDescription}. Origin: ${eventOrigin}`
          );
        },
        onType: (tagId: string, cardType: string) => {
          if (cardUrl[cardType]) {
            if (cardType) {
              cardTypeToServer.value = cardType;
            }

            cardLogoUrl.value = cardUrl[cardType];
            const helpElement = document.getElementById(`${tagId}-help`);
            if (helpElement) {
              helpElement.textContent = "";
            }
          } else {
            cardLogoUrl.value = CART_LOG_URG
          }
        },
        onValid: (tagId: string) => {
          changeImpactedElement(
            tagId,
            "hosted-field-focus hosted-field-invalid",
            "hosted-field-valid"
          );
          const helpElement = document.getElementById(`${tagId}-help`);
          if (helpElement) {
            helpElement.textContent = "";
          }
        },
      },
      style: {
        input: {
          "font-size": "14px",
          "font-family": "Helvetica Neue,Helvetica,Arial,sans-serif",
          "line-height": "1.42857143",
          color: "#555",
        },
        ":focus": {
          color: "#555",
        },
      },
      ccnPlaceHolder: "Card Number *",
      cvvPlaceHolder: "CVV *",
      expPlaceHolder: "MM / YY *",
    };

    // Initialize the hosted payment fields
    bluesnap.hostedPaymentFieldsCreate(blueSnapObject);
    tokenLoaded.value = true;
    logMessages.value = "BlueSnap initialized.";
  };

  const initializeCart = async (): Promise<void> => {
    const { totalPrice } = await BlueSnapApi.fetchCart();
    amount.value = totalPrice;
  };

  const changeImpactedElement = (
    tagId: string,
    removeClass = "",
    addClass = ""
  ): void => {
    const element = document.querySelector(`[data-bluesnap="${tagId}"]`);
    if (element instanceof HTMLElement) {
      if (removeClass) {
        element.classList.remove(...removeClass.split(" "));
      }
      if (addClass) {
        element.classList.add(...addClass.split(" "));
      }
    }
  };

  const fetchVaultedShopperDetails = async (): Promise<void> => {
    const vaultedShopperId = localStorage.getItem("vaultedShopperId") || "";
    if (!vaultedShopperId) return;
    try {
      const result = await BlueSnapApi.getVaultedShopperCreditCardData(
        vaultedShopperId
      );
      if (result.success) {
        const message = JSON.parse(result.message);
        console.log("message", message);
        const creditCardInfo = message.paymentSources.creditCardInfo[0];
        const cardLastFourDigits = creditCardInfo.creditCard.cardLastFourDigits;
        vaultedFirstName.value = message.firstName;
        vaultedLastName.value = message.lastName;
        vaultedCardCC.value = message.lastPaymentInfo.creditCard.cardType;
        last4Digits.value =
          message.lastPaymentInfo.creditCard.cardLastFourDigits;

        cardNumberDisplay.value = `**** **** **** ${cardLastFourDigits}`;
        cardHolderName.value = `${creditCardInfo.billingContactInfo.firstName} ${creditCardInfo.billingContactInfo.lastName}`;
        // console.log('Vaulted shopper first name:', vaultedFirstName.value);
        // console.log('Vaulted shopper last name:', vaultedLastName.value);
        // console.log('Vaulted card type:', vaultedCardCC.value);
        // console.log('Last 4 digits:', last4Digits.value);
      }
    } catch (error) {
      console.error("Error fetching shopper details:", error);
    }
  };

  const onOrderSubmitButtonClick = async (event: Event): Promise<void> => {
    console.log("Submit button clicked");
    event.preventDefault();
    console.log("Saved card value:", useSavedCard.value);

    if (useSavedCard.value) {
      console.log("Fetching PF token for saved card...");
      await fetchPfToken();
      console.log("Saved card process initiated");
      await vaultedCapture();
    } else {
      console.log("Using new credit card...");
      await creditCardCapture(
        () => console.log("Credit card capture success."),
        () => console.log("Credit card capture failed.")
      );
    }
  };

  const vaultedCapture = async (): Promise<void> => {
    console.log("Vaulted Capture process started");
    const body = {
      pfToken: pfToken.value,
      vaultedId: localStorage.getItem("vaultedShopperId"),
      amount: amount.value.toString(),
    };
    const result = await BlueSnapApi.vaultedShopper(body);
    console.log("Vaulted shopper API result:", result);
    if (result?.success) {
      console.log("Transaction successful:", result);
    } else {
      console.error("Transaction failed:", result);
    }
  };

  function storeVaultedShopperId(vaultedShopperId: number): void {
    localStorage.setItem("vaultedShopperId", vaultedShopperId.toString());
    console.log("Vaulted Shopper ID stored in localStorage:", vaultedShopperId);
  }

  const creditCardCapture = async (
    onSuccess: (result) => void,
    onFailure: () => void
  ): Promise<void> => {
    if (!tokenLoaded.value) {
      console.error("BlueSnap is not initialized.");
      onFailure();
      return;
    }
    console.log(
      "CreditCardCapture: card type to server:",
      cardTypeToServer.value
    );

    threeDSecureObj.value.billingFirstName = firstName.value;
    threeDSecureObj.value.billingLastName = lastName.value;
    threeDSecureObj.value.amount = amount.value;
    threeDSecureObj.value.currency = currency;

    bluesnap.hostedPaymentFieldsSubmitData(async (callbackResult) => {
      if (callbackResult.error) {
        const errorArray = callbackResult.error;
        for (const error of errorArray) {
          const helpElement = document.getElementById(`${error.tagId}-help`);
          if (helpElement) {
            helpElement.textContent = `${error.errorCode} - ${error.errorDescription}`;
          }

          console.error(
            `Card Transaction Error on field ${error.tagId}: [${error.errorCode}] ${error.errorDescription}`
          );
        }
        onFailure();
        return;
      }

      if (threeDS.value) {
        if (
          !callbackResult.threeDSecure ||
          callbackResult.threeDSecure.authResult !== AUTH_SUCCESS
        ) {
          console.error(
            "3DS authentication failed:",
            callbackResult.threeDSecure
          );
          onFailure();
          return;
        }
      }

      const body: Record<string, any> = {
        pfToken: pfToken.value,
        firstName: firstName.value,
        lastName: lastName.value,
        saveCard: saveCard.value,
        amount: amount.value.toString(),
        cardType: cardTypeToServer.value,
      };

      if (callbackResult.threeDSecure) {
        body.threeDSecureReferenceId =
          callbackResult.threeDSecure.threeDSecureReferenceId;
        body.authResult = callbackResult.threeDSecure.authResult;
      }

      try {
        const result = await BlueSnapApi.BlueSnapCardCapture(body);
        if (result?.data?.success) {
          if (saveCard.value) {
            const vaultedShopperId = result.vaultedShopperId;
            if (vaultedShopperId) {
              storeVaultedShopperId(vaultedShopperId);
            }
          }
          onSuccess(result?.data);
        } else {
          onFailure();
        }
      } catch (error) {
        const rawMessage =
          error?.response?.data?.message || "An unexpected error occurred.";
        let extractedError = "";

        try {
          const parsed = JSON.parse(rawMessage);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const { errorName, code } = parsed[0];
            extractedError = `Error: ${errorName} (Code: ${code})`;
          } else {
            extractedError = rawMessage;
          }
        } catch (parseError) {
          extractedError = rawMessage;
        }

        errorMessage.value = extractedError;
        onFailure();
      }
    }, threeDSecureObj.value);
  };

  const fetchPfToken = async (): Promise<void> => {
    try {
      const response = await BlueSnapApi.getPfToken();
      if (response != null) {
        pfToken.value = response;
      }
      logMessages.value = `pfToken retrieved: ${pfToken.value}`;
      initializeBlueSnap();
    } catch (error) {
      logMessages.value = "Failed to retrieve pfToken.";
      console.error("Error fetching pfToken:", error);
    }
  };

  onMounted(async () => {
    await getBlueSnapConfig();
    await initializeCart();

    if (!blueSnapConfig.value) {
      return;
    }

    const sdkUrl =
      blueSnapConfig.value.mode === BlueSnapMode.Sandbox
        ? SDK_URL.SANDPAY
        : SDK_URL.PRODUCTION;

    loadBlueSnapSDK(sdkUrl);
  });

  function loadBlueSnapSDK(scriptUrl: string) {
    if (typeof bluesnap === "undefined") {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.onload = fetchPfToken;
      document.head.appendChild(script);
    } else {
      fetchPfToken();
    }
  }

  watch(useSavedCard, (newVal) => {
    if (newVal) {
      fetchVaultedShopperDetails();
    } else {
      cardNumberDisplay.value = "";
      cardHolderName.value = "";
    }
  });

  return {
    fetchPfToken,
    vaultedCapture,
    useSavedCard,
    firstName,
    lastName,
    saveCard,
    cardNumberDisplay,
    cardHolderName,
    cardLogoUrl,
    onOrderSubmitButtonClick,
    logMessages,
    vaultedLastName,
    vaultedFirstName,
    creditCardCapture,
    errorMessage,
  };
}
