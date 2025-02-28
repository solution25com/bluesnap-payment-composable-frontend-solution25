// composables/useGooglePay.ts

import BlueSnapApi from "../services/BlueSnapApi.ts";
import { ref, Ref } from 'vue';
import { BlueSnapConfigResponse } from '../types/ConfigTypes.ts';

export function useGooglePayment(options?: { currency: string }) {
    const fetchedTotalPrice: Ref<number> = ref(0);
    const fetchedIsoCountry: Ref<string> = ref('');
    const blueSnapConfig: Ref<BlueSnapConfigResponse['message']> = ref({
        mode: 'sandbox', // Default mode
        merchantId: '',
        "3D": false,
        merchantGoogleId: '',
    });
    const successPayment = ref<boolean | null>(null); // Allows 'true', 'false', or 'null'

    let paymentsClient: google.payments.api.PaymentsClient | null = null; // Declare paymentsClient in the composable scope

    const initializeCart = async (): Promise<void> => {
        const { totalPrice, isoCountryCode } = await BlueSnapApi.fetchCart();

        fetchedTotalPrice.value = totalPrice;
        fetchedIsoCountry.value = isoCountryCode;
    };

    const getBlueSnapConfig = async (): Promise<void> => {
        try {
            const response = await BlueSnapApi.fetchBlueSnapConfig();
            console.log('Fetched BlueSnap Config:', response.message.mode); // Validate response logging

            if (response.success && response.message) {
                // Map the response correctly
                blueSnapConfig.value = {
                    mode: response.message.mode,
                    merchantId: response.message.merchantId,
                    "3D": response.message["3D"],
                    merchantGoogleId: response.message.merchantGoogleId,
                };

            } else {
                console.error('Failed to fetch valid BlueSnap configurations:', response);
            }
        } catch (error) {
            console.error('Error fetching BlueSnap configurations:', error);
        }
    };

    const loadGooglePayScript = (onGooglePayLoaded: () => void): void => {
        if (typeof google === "undefined") {
            const script = document.createElement("script");
            script.src = "https://pay.google.com/gp/p/js/pay.js";
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
            apiVersionMinor: 0
        };

        const tokenizationSpecification: google.payments.api.PaymentMethodTokenizationSpecification = {
            // BLUE SNAP MERCHANT ID
            type: "PAYMENT_GATEWAY",
            parameters: {
                gateway: "bluesnap",
                gatewayMerchantId: blueSnapConfig.value.merchantId
            },
        };

        const baseCardPaymentMethod: google.payments.api.PaymentMethodSpecification = {
            type: "CARD",
            parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"],
            },
            tokenizationSpecification
        };

        const cardPaymentMethod = Object.assign({}, baseCardPaymentMethod, {
            tokenizationSpecification: tokenizationSpecification,
        });

        const getGooglePaymentsClient = (): google.payments.api.PaymentsClient => {
            if (paymentsClient === null) {
                paymentsClient = new google.payments.api.PaymentsClient({ environment: "TEST" });
            }
            return paymentsClient;
        };

        const getGoogleIsReadyToPayRequest = (): google.payments.api.IsReadyToPayRequest =>
            Object.assign({}, baseRequest, {
                allowedPaymentMethods: [baseCardPaymentMethod],
            });

        const getGoogleTransactionInfo = (): google.payments.api.TransactionInfo => ({
            countryCode: fetchedIsoCountry.value,
            currencyCode: options?.currency,
            totalPriceStatus: "FINAL",
            totalPrice: fetchedTotalPrice?.value.toString()
        });

        const getGooglePaymentDataRequest = (): google.payments.api.PaymentDataRequest => {
            const paymentDataRequest = Object.assign({}, baseRequest);
            paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
            paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

            paymentDataRequest.merchantInfo = {
                // GOOGLE MERCHANT ID
                merchantId: blueSnapConfig.value.merchantGoogleId,
                merchantName: "Google Merchant ID",
            };

            paymentDataRequest.emailRequired = true;
            paymentDataRequest.shippingAddressRequired = true;
            // paymentDataRequest.billingAddressRequired = true;

            paymentDataRequest.shippingAddressParameters = {
                phoneNumberRequired: true
            };

            // paymentDataRequest.billingAddressParameters = {
            //   format: 'FULL',
            //   phoneNumberRequired: true
            // };

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
                totalPrice: fetchedTotalPrice?.value.toString()
            };
            const client = getGooglePaymentsClient();
            client.prefetchPaymentData(paymentDataRequest);
        };

        const onGooglePaymentButtonClicked = (): void => {
            const paymentDataRequest = getGooglePaymentDataRequest();
            const client = getGooglePaymentsClient();
            client.loadPaymentData(paymentDataRequest)
                .then((paymentData) => processPayment(paymentData))
                .catch((err) => console.error("Payment error:", err));
        };

        const processPayment = async (paymentData: google.payments.api.PaymentData): Promise<void> => {
            try {
                const paymentToken = b64EncodeUnicode(JSON.stringify(paymentData));
                const formattedAmount = parseFloat(fetchedTotalPrice.value.toFixed(2));
                const floatAmount = formattedAmount.toFixed(2);
                const body = { gToken: paymentToken, amount: floatAmount };
                const result = await BlueSnapApi.processGooglePayment(body);
                console.log("Payment processed successfully:", result.success);
                successPayment.value = result?.success === true;
            } catch (error) {
                console.log(error);
                successPayment.value = false;
            }
        };

        const b64EncodeUnicode = (str: string): string =>
            btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            }));

        const client = getGooglePaymentsClient();
        client.isReadyToPay(getGoogleIsReadyToPayRequest())
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
        successPayment
    };
}
