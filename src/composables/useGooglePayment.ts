import BlueSnapApi from "../services/BlueSnapApi.ts";
import { ref, Ref } from "vue";
import { BlueSnapConfigResponse } from "../types/ConfigTypes.ts";
import {
  BlueSnapMode,
  GOOGLE_PAY_URL,
  PAYMENT_METHOD,
  PAYMENT_TYPE,
} from "../config/constants.ts";

export function useGooglePayment(options?: { currency: string }) {
  const fetchedTotalPrice: Ref<number> = ref(0);
  const fetchedIsoCountry: Ref<string> = ref("");
  const blueSnapConfig: Ref<BlueSnapConfigResponse["message"]> = ref({
    mode: BlueSnapMode.Sandbox,
    merchantId: "",
    "3D": false,
    merchantGoogleId: "",
  });

  const successPayment = ref<boolean | null>(null);

  const paymentResult = ref<{
    success: boolean;
    transactionId?: string;
  } | null>(null);

  let paymentsClient: google.payments.api.PaymentsClient | null = null;

  const initializeCart = async (): Promise<void> => {
    const { totalPrice, isoCountryCode } = await BlueSnapApi.fetchCart();
    fetchedTotalPrice.value = totalPrice;
    fetchedIsoCountry.value = isoCountryCode;
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
      } else {
        console.error(
          "Failed to fetch valid BlueSnap configurations:",
          response
        );
      }
    } catch (error) {
      console.error("Error fetching BlueSnap configurations:", error);
    }
  };

  const loadGooglePayScript = (onGooglePayLoaded: () => void): void => {
    if (typeof google === "undefined") {
      const script = document.createElement("script");
      script.src = GOOGLE_PAY_URL;
      script.async = true;
      script.onload = onGooglePayLoaded;
      document.head.appendChild(script);
    } else {
      onGooglePayLoaded();
    }
  };

  const onGooglePayLoaded = (): void => {
    const baseRequest: google.payments.api.PaymentDataRequest = {
      allowedPaymentMethods: [],
      apiVersion: 2,
      apiVersionMinor: 0,
    };

    const tokenizationSpecification: google.payments.api.PaymentMethodTokenizationSpecification =
      {
        type: PAYMENT_TYPE.PAYMENT_GATEWAY,
        parameters: {
          gateway: "bluesnap",
          gatewayMerchantId: blueSnapConfig.value.merchantId,
        },
      };

    const baseCardPaymentMethod: google.payments.api.PaymentMethodSpecification =
      {
        type: PAYMENT_TYPE.CARD,
        parameters: {
          allowedAuthMethods: [
            PAYMENT_METHOD.PAN_ONLY,
            PAYMENT_METHOD.CRYPTOGRAM_3DS,
          ],
          allowedCardNetworks: [
            "AMEX",
            "DISCOVER",
            "INTERAC",
            "JCB",
            "MASTERCARD",
            "VISA",
          ],
        },
        tokenizationSpecification,
      };

    const cardPaymentMethod = { ...baseCardPaymentMethod };

    const getGooglePaymentsClient = (): google.payments.api.PaymentsClient => {
      if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({
          environment: "TEST",
        });
      }
      return paymentsClient;
    };

    const getGoogleIsReadyToPayRequest =
      (): google.payments.api.IsReadyToPayRequest =>
        Object.assign({}, baseRequest, {
          allowedPaymentMethods: [baseCardPaymentMethod],
        });

    const getGoogleTransactionInfo =
      (): google.payments.api.TransactionInfo => ({
        countryCode: fetchedIsoCountry.value,
        currencyCode: options?.currency,
        totalPriceStatus: "FINAL",
        totalPrice: fetchedTotalPrice.value.toString(),
      });

    const getGooglePaymentDataRequest =
      (): google.payments.api.PaymentDataRequest => {
        const paymentDataRequest = { ...baseRequest };
        paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
        paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
        paymentDataRequest.merchantInfo = {
          merchantId: blueSnapConfig.value.merchantGoogleId,
          merchantName: "Google Merchant ID",
        };
        paymentDataRequest.emailRequired = true;
        paymentDataRequest.shippingAddressRequired = true;
        paymentDataRequest.shippingAddressParameters = {
          phoneNumberRequired: true,
        };
        return paymentDataRequest;
      };

    const addGooglePayButton = (): void => {
      const client = getGooglePaymentsClient();
      const button = client.createButton({
        onClick: onGooglePaymentButtonClicked,
        allowedPaymentMethods: [baseCardPaymentMethod],
      });
      document.getElementById("container")?.appendChild(button);
    };

    const prefetchGooglePaymentData = (): void => {
      const paymentDataRequest = getGooglePaymentDataRequest();
      paymentDataRequest.transactionInfo = {
        totalPriceStatus: "NOT_CURRENTLY_KNOWN",
        currencyCode: options?.currency,
        totalPrice: fetchedTotalPrice.value.toString(),
      };
      const client = getGooglePaymentsClient();
      client.prefetchPaymentData(paymentDataRequest);
    };

    const onGooglePaymentButtonClicked = (): void => {
      const paymentDataRequest = getGooglePaymentDataRequest();
      const client = getGooglePaymentsClient();
      client
        .loadPaymentData(paymentDataRequest)
        .then((paymentData) => processPayment(paymentData))
        .catch((err) => console.error("Payment error:", err));
    };

    const processPayment = async (
      paymentData: google.payments.api.PaymentData
    ): Promise<{ success: boolean; transactionId?: string }> => {
      try {
        const paymentToken = b64EncodeUnicode(JSON.stringify(paymentData));
        const formattedAmount = parseFloat(fetchedTotalPrice.value.toFixed(2));
        const floatAmount = formattedAmount.toFixed(2);
        const body = { gToken: paymentToken, amount: floatAmount };
        const result = await BlueSnapApi.processGooglePayment(body);

        if (result && result.success) {
          let transactionId: string | undefined;
          try {
            const parsedMessage = JSON.parse(result?.message);
            transactionId = parsedMessage.transactionId;
          } catch (e) {
            console.warn("No transactionId found in response message", e);
          }
          successPayment.value = true;
          paymentResult.value = { success: true, transactionId };
          return { success: true, transactionId };
        } else {
          successPayment.value = false;
          paymentResult.value = { success: false };
          return { success: false };
        }
      } catch (error) {
        console.error(error);
        successPayment.value = false;
        paymentResult.value = { success: false };
        return { success: false };
      }
    };

    const b64EncodeUnicode = (str: string): string =>
      btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        })
      );

    const client = getGooglePaymentsClient();
    client
      .isReadyToPay(getGoogleIsReadyToPayRequest())
      .then((response) => {
        if (response.result) {
          addGooglePayButton();
          prefetchGooglePaymentData();
        }
      })
      .catch((err) => console.error("isReadyToPay error:", err));
  };

  return {
    fetchedTotalPrice,
    initializeCart,
    getBlueSnapConfig,
    loadGooglePayScript,
    onGooglePayLoaded,
    successPayment,
    paymentResult,
  };
}
