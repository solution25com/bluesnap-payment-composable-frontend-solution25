// useBluesnapCreditCard.ts

import { ref, onMounted, watch, Ref, computed } from 'vue';
import BlueSnapApi from '../services/BlueSnapApi.ts';
import {
    // BlueSnap,
    BlueSnapCallback,
    BlueSnapHostedPaymentFieldsCreateOptions,
    ThreeDSecureObj,
} from '../types/BlueSnapTypes.ts';
import { BlueSnapConfigResponse } from "../types/ConfigTypes.ts";

export function useBluesnapPayment({ currency }: { currency: string }) {
    // Reactive variables
    const useSavedCard = ref<boolean>(false);
    const errorMessage = ref<string>('');
    const firstName = ref<string>('');
    const lastName = ref<string>('');
    const saveCard = ref<boolean>(false);
    const cardNumberDisplay = ref<string>('');
    const cardHolderName = ref<string>('');
    const cardLogoUrl = ref<string>('https://files.readme.io/d1a25b4-generic-card.png');
    const pfToken = ref<string>('');
    const amount = ref<number>(0); // Set default amount or fetch from API
    const logMessages = ref<string>('');
    const tokenLoaded = ref<boolean>(false);
    const cardTypeToServer = ref<string>('');
    const vaultedCardCC = ref<string>('');
    const vaultedFirstName = ref<string>('');
    const vaultedLastName = ref<string>('');
    const last4Digits = ref<string>('');
    // BlueSnap configuration object for 3DS
    const threeDSecureObj = ref<ThreeDSecureObj>({
        amount: amount.value,
        currency: currency,
        billingFirstName: firstName.value,
        billingLastName: lastName.value,
    });
    // Dynamic BlueSnap config with default values
    const blueSnapConfig: Ref<BlueSnapConfigResponse['message']> = ref({
        mode: 'sandbox', // Default mode
        merchantId: '',
        "3D": true,
        // merchantGoogleId: '',
    });
    // Computed property for the dynamic 3DS flag
    const threeDS = computed(() => blueSnapConfig.value["3D"]);

    const cardUrl: Record<string, string> = {
        AMEX: 'https://files.readme.io/97e7acc-Amex.png',
        DINERS: 'https://files.readme.io/8c73810-Diners_Club.png',
        DISCOVER: 'https://files.readme.io/caea86d-Discover.png',
        JCB: 'https://files.readme.io/e076aed-JCB.png',
        MASTERCARD: 'https://files.readme.io/5b7b3de-Mastercard.png',
        VISA: 'https://files.readme.io/9018c4f-Visa.png',
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

    // Initialize BlueSnap Hosted Payment Fields
    const initializeBlueSnap = (): void => {
        if (!pfToken.value) {
            console.error('pfToken is not available.');
            return;
        }

        const blueSnapObject: BlueSnapHostedPaymentFieldsCreateOptions = {
            '3DS': threeDS.value, // Use the dynamic 3DS flag
            token: pfToken.value,
            onFieldEventHandler: {
                onFocus: (tagId: string) => {
                    changeImpactedElement(tagId, 'hosted-field-valid hosted-field-invalid', 'hosted-field-focus');
                },
                onBlur: (tagId: string) => {
                    changeImpactedElement(tagId, 'hosted-field-focus');
                },
                onError: (
                    tagId: string,
                    errorCode: string,
                    errorDescription: string,
                    eventOrigin: string
                ) => {
                    changeImpactedElement(tagId, 'hosted-field-valid hosted-field-focus', 'hosted-field-invalid');
                    const helpElement = document.getElementById(`${tagId}-help`);
                    if (helpElement) {
                        helpElement.textContent = `${errorCode} - ${errorDescription} - ${eventOrigin}`;
                    }
                },
                onType: (tagId: string, cardType: string) => {
                    console.log('card type', cardType);
                    if (cardUrl[cardType]) {
                        if (cardType) {
                            cardTypeToServer.value = cardType;
                        }
                        console.log('card type type', cardTypeToServer);
                        cardLogoUrl.value = cardUrl[cardType];
                        const helpElement = document.getElementById(`${tagId}-help`);
                        if (helpElement) {
                            helpElement.textContent = '';
                        }
                    }
                },
                onValid: (tagId: string) => {
                    changeImpactedElement(tagId, 'hosted-field-focus hosted-field-invalid', 'hosted-field-valid');
                    const helpElement = document.getElementById(`${tagId}-help`);
                    if (helpElement) {
                        helpElement.textContent = '';
                    }
                },
            },
            style: {
                input: {
                    'font-size': '14px',
                    'font-family': 'Helvetica Neue,Helvetica,Arial,sans-serif',
                    'line-height': '1.42857143',
                    color: '#555',
                },
                ':focus': {
                    color: '#555',
                },
            },
            ccnPlaceHolder: 'Card Number *',
            cvvPlaceHolder: 'CVV *',
            expPlaceHolder: 'MM / YY *',
        };

        // Initialize the hosted payment fields
        bluesnap.hostedPaymentFieldsCreate(blueSnapObject);
        tokenLoaded.value = true;
        logMessages.value = 'BlueSnap initialized.';
    };

    const initializeCart = async (): Promise<void> => {
        const { totalPrice } = await BlueSnapApi.fetchCart();
        amount.value = totalPrice;
    };

    const changeImpactedElement = (tagId: string, removeClass = '', addClass = ''): void => {
        const element = document.querySelector(`[data-bluesnap="${tagId}"]`);
        if (element instanceof HTMLElement) {
            if (removeClass) {
                element.classList.remove(...removeClass.split(' '));
            }
            if (addClass) {
                element.classList.add(...addClass.split(' '));
            }
        }
    };

    const fetchVaultedShopperDetails = async (): Promise<void> => {
        const vaultedShopperId = localStorage.getItem('vaultedShopperId') || '';
        if (!vaultedShopperId) return;
        try {
            const result = await BlueSnapApi.getVaultedShopperCreditCardData(vaultedShopperId);
            if (result.success) {
                const message = JSON.parse(result.message);
                console.log('message', message);
                const creditCardInfo = message.paymentSources.creditCardInfo[0];
                const cardLastFourDigits = creditCardInfo.creditCard.cardLastFourDigits;
                vaultedFirstName.value = message.firstName;
                vaultedLastName.value = message.lastName;
                vaultedCardCC.value = message.lastPaymentInfo.creditCard.cardType;
                last4Digits.value = message.lastPaymentInfo.creditCard.cardLastFourDigits;

                cardNumberDisplay.value = `**** **** **** ${cardLastFourDigits}`;
                cardHolderName.value = `${creditCardInfo.billingContactInfo.firstName} ${creditCardInfo.billingContactInfo.lastName}`;
                console.log('first name', vaultedFirstName.value);
                console.log(' l name', vaultedLastName.value);
                console.log('cc card', vaultedCardCC.value);
                console.log('lastzz 4 digits', last4Digits.value);
            }
        } catch (error) {
            console.error('Error fetching shopper details:', error);
        }
    };

    const onOrderSubmitButtonClick = async (event: Event): Promise<void> => {
        console.log('Submit button clicked');
        event.preventDefault();
        console.log('Saved card value:', useSavedCard.value);

        if (useSavedCard.value) {
            console.log('Fetching PF token for saved card...');
            await fetchPfToken();
            console.log('Saved card process initiated');
            await vaultedCapture();
        } else {
            console.log('Using new credit card...');
            await creditCardCapture();
        }
    };

    const vaultedCapture = async (): Promise<void> => {
        console.log('Vaulted Capture process started');
        const body = {
            pfToken: pfToken.value,
            vaultedId: localStorage.getItem('vaultedShopperId'),
            amount: amount.value.toString(),
        };
        const result = await BlueSnapApi.vaultedShopper(body);
        console.log('Vaulted shopper API result:', result);
        if (result?.success) {
            console.log('Transaction successful:', result);
        } else {
            console.error('Transaction failed:', result);
        }
    };

    function storeVaultedShopperId(vaultedShopperId: number): void {
        localStorage.setItem('vaultedShopperId', vaultedShopperId.toString());
        console.log('Vaulted Shopper ID stored in localStorage:', vaultedShopperId);
    }

    const creditCardCapture = async (onSuccess: () => void, onFailure: () => void ): Promise<void> => {
        if (!tokenLoaded.value) {
            console.error('BlueSnap is not initialized.');
            onFailure();
            return;
        }
        console.log('CreditCardCapture:', cardTypeToServer.value);

        threeDSecureObj.value.billingFirstName = firstName.value;
        threeDSecureObj.value.billingLastName = lastName.value;
        threeDSecureObj.value.amount = amount.value;
        threeDSecureObj.value.currency = currency;

        bluesnap.hostedPaymentFieldsSubmitData(
            async (callbackResult) => {
                if (callbackResult.error) {
                    const errorArray = callbackResult.error;
                    for (const error of errorArray) {
                        const helpElement = document.getElementById(`${error.tagId}-help`);
                        if (helpElement) {
                            helpElement.textContent = `${error.errorCode} - ${error.errorDescription}`;
                        }
                    }
                    onFailure();
                    return;
                }

                if (threeDS.value) {
                    if (
                        !callbackResult.threeDSecure ||
                        callbackResult.threeDSecure.authResult !== 'AUTHENTICATION_SUCCEEDED'
                    ) {
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
                    cardType: cardTypeToServer.value
                };

                if (callbackResult.threeDSecure) {
                    body.threeDSecureReferenceId = callbackResult.threeDSecure.threeDSecureReferenceId;
                    body.authResult = callbackResult.threeDSecure.authResult;
                }

                try {
                    const result = await BlueSnapApi.BlueSnapCardCapture(body);
                    if (result?.data?.success) {
                        console.log('Credit card capture successful:', result.data);
                        if (saveCard.value) {
                            const vaultedShopperId = result.vaultedShopperId;
                            if (vaultedShopperId) {
                                console.log('valuted', vaultedShopperId);
                                storeVaultedShopperId(vaultedShopperId);
                            } else {
                                console.warn('No Vaulted Shopper ID returned to store.');
                            }
                        }
                        onSuccess();
                    } else {
                        console.warn('Capture result was not successful:', result?.data);
                        onFailure();
                    }
                } catch (error) {
                    const rawMessage = error?.response?.data?.message || 'An unexpected error occurred.';
                    let extractedError = '';

                    try {
                        const parsed = JSON.parse(rawMessage);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            const { errorName, code } = parsed[0];
                            extractedError = `Error: ${errorName} (Code: ${code})`;
                        } else {
                            extractedError = rawMessage;
                        }
                    } catch (parseError) {
                        console.error("Error parsing backend error message:", parseError);
                        extractedError = rawMessage;
                    }

                    console.error('Error in credit card capture:', extractedError);
                    errorMessage.value = extractedError;
                    onFailure();
                    onFailure();
                }
            },
            threeDSecureObj.value
        );
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
            logMessages.value = 'Failed to retrieve pfToken.';
            console.error('Error fetching pfToken:', error);
        }
    };

    onMounted(async () => {
        // First, fetch the BlueSnap config so the dynamic 3DS flag is set correctly
        await getBlueSnapConfig();
        // Then, initialize the cart and load the BlueSnap SDK as before
        await initializeCart();
        if (typeof bluesnap === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://sandpay.bluesnap.com/web-sdk/5/bluesnap.js';
            script.onload = () => {
                fetchPfToken();
            };
            document.head.appendChild(script);
        } else {
            fetchPfToken();
        }
    });

    watch(useSavedCard, (newVal) => {
        if (newVal) {
            fetchVaultedShopperDetails();
        } else {
            cardNumberDisplay.value = '';
            cardHolderName.value = '';
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
        errorMessage
    };
}
