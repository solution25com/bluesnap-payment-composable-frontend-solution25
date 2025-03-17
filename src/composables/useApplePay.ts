import { ref, onMounted, Ref, computed } from 'vue';
import BlueSnapApi from '../services/BlueSnapApi.ts';
import {
    ApplePayRequest,
    AppleValidationBody,
    CaptureBody,
} from '../types/AppleTypes.ts';
import { BlueSnapConfigResponse } from '../types/ConfigTypes.ts';


export function useApplePay({ currency, domain }: { currency: string, domain: string }) {
    const isApplePayAvailable = ref<boolean>(false);
    // Added warning message ref
    const applePayWarningMessage = ref<string>('');
    const fetchedTotalPrice: Ref<number> = ref(0);
    const fetchedIsoCountry: Ref<string> = ref('US');
    const blueSnapConfig: Ref<BlueSnapConfigResponse['message']> = ref({
        mode: 'sandbox', // Default mode
        merchantId: '',
        "3D": true,
        // merchantGoogleId: '',
    });
    const merchantID = computed(() => blueSnapConfig.value.merchantId);
    // const domain = 'wealthy-lionfish-hugely.ngrok-free.app';

    // Helper to detect iOS version from the user agent
    const getiOSVersion = (): number | null => {
        const match = navigator.userAgent.match(/OS (\d+)_/i);
        return match ? parseInt(match[1], 10) : null;
    };

    const getBlueSnapConfig = async (): Promise<void> => {
        console.log('Fetching BlueSnap configuration...');
        try {
            const response = await BlueSnapApi.fetchBlueSnapConfig();
            if (response.success && response.message) {
                blueSnapConfig.value = {
                    mode: response.message.mode,
                    merchantId: response.message.merchantId,
                    "3D": response.message["3D"],
                    merchantGoogleId: response.message.merchantGoogleId,
                };
                console.log('BlueSnap configuration fetched:', blueSnapConfig.value);
            } else {
                console.error('Failed to fetch valid BlueSnap configurations:', response);
            }
        } catch (error) {
            console.error('Error fetching BlueSnap configurations:', error);
        }
    };

    const initializeCart = async (): Promise<void> => {
        console.log('Initializing cart...');
        try {
            const { totalPrice, isoCountryCode } = await BlueSnapApi.fetchCart();
            fetchedTotalPrice.value = totalPrice;
            fetchedIsoCountry.value = isoCountryCode;
            console.log(`Cart initialized. Total Price: ${totalPrice}, ISO Country: ${isoCountryCode}`);
        } catch (error) {
            console.error('Error initializing cart:', error);
        }
    };

    const checkApplePayAvailability = async (): Promise<void> => {
        console.log('Checking if Apple Pay is available...');
        const iOSVersion = getiOSVersion();
        console.log('Detected iOS version:', iOSVersion);
        if (typeof ApplePaySession !== 'undefined') {
            if (ApplePaySession.canMakePayments()) {
                try {
                    const canMakePaymentsWithActiveCard = await ApplePaySession.canMakePaymentsWithActiveCard(
                        `${merchantID.value}-${domain}`
                    );
                    console.log('ApplePaySession.canMakePaymentsWithActiveCard result:', canMakePaymentsWithActiveCard);
                    if (canMakePaymentsWithActiveCard) {
                        isApplePayAvailable.value = true;
                        console.log('Apple Pay is available');
                    } else {
                        console.log('Apple Pay is not available with an active card.');
                        if (iOSVersion && iOSVersion < 18) {
                            applePayWarningMessage.value = 'Apple Pay on third‑party browsers requires iOS 18 or later. Please update your iOS or use Safari.';
                        }
                    }
                } catch (error) {
                    console.error('Error checking Apple Pay compatibility:', error);
                }
            } else {
                console.error('ApplePaySession.canMakePayments returned false.');
            }
        } else {
            console.log ('ApplePaySession is not defined on this device / browser.');
        }
    };

    const applePayClicked = async (onSuccess: (result) => void, onFailure: () => void): Promise<void> => {
        console.log('Apple Pay button clicked. Preparing payment request...');
        const request: ApplePayRequest = {
            countryCode: fetchedIsoCountry.value,
            currencyCode: currency,
            supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
            merchantCapabilities: ['supports3DS'],
            total: { label: 'BlueSnap', amount: fetchedTotalPrice?.value.toString() },
        };

        console.log('Apple Pay request:', request);
        const session = new ApplePaySession(3, request);

        session.onvalidatemerchant = async (event: ApplePayJS.ApplePayValidateMerchantEvent) => {
            console.log('onvalidatemerchant triggered:', event);
            const validationURL = event.validationURL;
            const body: AppleValidationBody = {
                validationUrl: validationURL,
                domainName: domain,
                displayName: 'BlueSnap',
            };

            try {
                const result = await BlueSnapApi.appleCreateWallet(body);
                console.log('Merchant validation result:', result);
                if (result && result.success) {
                    const parsedTokenObj = JSON.parse(result.message);
                    session.completeMerchantValidation(parsedTokenObj);
                    console.log('Merchant validation completed successfully.');
                } else {
                    console.error('Merchant validation failed:', result);
                    session.abort();
                }
            } catch (error) {
                console.error('Error during merchant validation:', error);
                session.abort();
            }
        };

        session.onpaymentauthorized = async (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => {
            console.log('onpaymentauthorized triggered:', event);
            const paymentToken = event.payment;
            const encodedPaymentToken = btoa(JSON.stringify(paymentToken));
            console.log('Encoded payment token:', encodedPaymentToken);

            const captureBody: CaptureBody = {
                appleToken: encodedPaymentToken,
                amount: fetchedTotalPrice?.value.toString()
            };

            try {
                const captureResult = await BlueSnapApi.appleCapture(captureBody);
                console.log('Capture result:', captureResult);
                if (captureResult) {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    console.log('Payment Successful');
                    onSuccess(captureResult);
                } else {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                    console.log('Payment Failed');
                    onFailure();
                }
            } catch (error) {
                session.completePayment(ApplePaySession.STATUS_FAILURE);
                console.error('Error during payment capture:', error);
            }
        };

        console.log('Beginning Apple Pay session...');
        session.begin();
    };

    onMounted(async () => {
        console.log('Component mounted, starting initialization...');
        await getBlueSnapConfig();
        await checkApplePayAvailability();
        await initializeCart();
        console.log('Initialization complete.');
    });

    return {
        isApplePayAvailable,
        applePayWarningMessage, // Expose the warning message for display
        applePayClicked,
    };
}
