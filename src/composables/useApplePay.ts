import { ref, onMounted, Ref, computed } from "vue";
import BlueSnapApi from "../services/BlueSnapApi.ts";
import {
  ApplePayRequest,
  AppleValidationBody,
  CaptureBody,
} from "../types/AppleTypes.ts";
import { BlueSnapConfigResponse } from "../types/ConfigTypes.ts";
import { BlueSnapMode } from "../config/constants.ts";

export function useApplePay({
  currency,
  domain,
}: {
  currency: string;
  domain: string;
}) {
  const isApplePayAvailable = ref<boolean>(false);

  const applePayWarningMessage = ref<string>("");
  const fetchedTotalPrice: Ref<number> = ref(0);
  const fetchedIsoCountry: Ref<string> = ref("US");
  const blueSnapConfig: Ref<BlueSnapConfigResponse["message"]> = ref({
    mode: BlueSnapMode.Sandbox,
    merchantId: "",
    "3D": true,
  });

  const merchantID = computed(() => blueSnapConfig.value.merchantId);

  const getiOSVersion = (): number | null => {
    const match = navigator.userAgent.match(/OS (\d+)_/i);
    return match ? parseInt(match[1], 10) : null;
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

  const initializeCart = async (): Promise<void> => {
    try {
      const { totalPrice, isoCountryCode } = await BlueSnapApi.fetchCart();
      fetchedTotalPrice.value = totalPrice;
      fetchedIsoCountry.value = isoCountryCode;
    } catch (error) {
      console.error("Error initializing cart:", error);
    }
  };

  const checkApplePayAvailability = async (): Promise<void> => {
    const iOSVersion = getiOSVersion();

    if (typeof ApplePaySession !== "undefined") {
      if (ApplePaySession.canMakePayments()) {
        try {
          const canMakePaymentsWithActiveCard =
            await ApplePaySession.canMakePaymentsWithActiveCard(
              `${merchantID.value}-${domain}`
            );

          if (canMakePaymentsWithActiveCard) {
            isApplePayAvailable.value = true;
          } else {
            if (iOSVersion && iOSVersion < 18) {
              applePayWarningMessage.value =
                "Apple Pay on third‑party browsers requires iOS 18 or later. Please update your iOS or use Safari.";
            }
          }
        } catch (error) {
          console.error("Error checking Apple Pay compatibility:", error);
        }
      }
    }
  };

  const applePayClicked = async (
    onSuccess: (result: unknown) => void,
    onFailure: () => void
  ): Promise<void> => {
    const request: ApplePayRequest = {
      countryCode: fetchedIsoCountry.value,
      currencyCode: currency,
      supportedNetworks: ["visa", "masterCard", "amex", "discover"],
      merchantCapabilities: ["supports3DS"],
      total: { label: "BlueSnap", amount: fetchedTotalPrice?.value.toString() },
    };

    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async (
      event: ApplePayJS.ApplePayValidateMerchantEvent
    ) => {
      const validationURL = event.validationURL;
      const body: AppleValidationBody = {
        validationUrl: validationURL,
        domainName: domain,
        displayName: "BlueSnap",
      };

      try {
        const result = await BlueSnapApi.appleCreateWallet(body);

        if (result && result.success) {
          const parsedTokenObj = JSON.parse(result.message);
          session.completeMerchantValidation(parsedTokenObj);
        } else {
          session.abort();
        }
      } catch (error) {
        console.error("Error during merchant validation:", error);
        session.abort();
      }
    };

    session.onpaymentauthorized = async (
      event: ApplePayJS.ApplePayPaymentAuthorizedEvent
    ) => {
      const paymentToken = event.payment;
      const encodedPaymentToken = btoa(JSON.stringify(paymentToken));

      const captureBody: CaptureBody = {
        appleToken: encodedPaymentToken,
        amount: fetchedTotalPrice?.value.toString(),
      };

      try {
        const captureResult = await BlueSnapApi.appleCapture(captureBody);

        if (captureResult) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);

          onSuccess(captureResult);
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);

          onFailure();
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
      }
    };

    session.begin();
  };

  onMounted(async () => {
    await getBlueSnapConfig();
    await checkApplePayAvailability();
    await initializeCart();
  });

  return {
    isApplePayAvailable,
    applePayWarningMessage,
    applePayClicked,
  };
}
