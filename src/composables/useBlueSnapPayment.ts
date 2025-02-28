// useBluesnapCreditCard.ts

import { ref, onMounted, watch } from 'vue';
import BlueSnapApi from '../services/BlueSnapApi.ts';
import {
    // BlueSnap,
    BlueSnapCallback,
    BlueSnapHostedPaymentFieldsCreateOptions,
    ThreeDSecureObj,
} from '../types/BlueSnapTypes.ts'

    ;

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
    // const currency = ref<string>(currency.value); // Set default currency or fetch from API
    const logMessages = ref<string>('');
    const tokenLoaded = ref<boolean>(false);
    const cardTypeToServer = ref<string>('');
    const vaultedCardCC = ref<string>('');
    const vaultedFirstName = ref<string>('');
    const vaultedLastName = ref<string>('');
    const last4Digits = ref<string>('');
    // BlueSnap configuration
    const threeDSecureObj = ref<ThreeDSecureObj>({
        amount: amount.value,
        currency: currency,
        billingFirstName: firstName.value,
        billingLastName: lastName.value,
    });

    const cardUrl: Record<string, string> = {
        AMEX: 'https://files.readme.io/97e7acc-Amex.png',
        DINERS: 'https://files.readme.io/8c73810-Diners_Club.png',
        DISCOVER: 'https://files.readme.io/caea86d-Discover.png',
        JCB: 'https://files.readme.io/e076aed-JCB.png',
        MASTERCARD: 'https://files.readme.io/5b7b3de-Mastercard.png',
        VISA: 'https://files.readme.io/9018c4f-Visa.png',
    };

    // Initialize BlueSnap Hosted Payment Fields
    const initializeBlueSnap = (): void => {
        if (!pfToken.value) {
            console.error('pfToken is not available.');
            return;
        }

        const blueSnapObject: BlueSnapHostedPaymentFieldsCreateOptions = {
            '3DS': true,
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
                        if(cardType) {
                            cardTypeToServer.value = cardType
                        }
                        console.log('card type type', cardTypeToServer);
                        cardLogoUrl.value = cardUrl[cardType];
                        const helpElement = document.getElementById(`${tagId}-help`);
                        if(helpElement) {
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
    // Change impacted element classes
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

    // Fetch vaulted shopper details
    const fetchVaultedShopperDetails = async (): Promise<void> => {
        // Replace with actual vaultedShopperId fetching logic
        const vaultedShopperId = localStorage.getItem('vaultedShopperId') || ''; // Default to an empty string if null

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
                console.log('first name', vaultedFirstName.value)
                console.log(' l name', vaultedLastName.value)
                console.log('cc card', vaultedCardCC.value)
                console.log('lastzz 4 digits',last4Digits.value)
            }
        } catch (error) {
            console.error('Error fetching shopper details:', error);
        }
    };

    // Handle form submission
    const onOrderSubmitButtonClick = async (event: Event): Promise<void> => {
        console.log('Submit button clicked');
        event.preventDefault();
        console.log('Saved card value:', useSavedCard.value);

        if (useSavedCard.value) {
            console.log('Fetching PF token for saved card...');
            await fetchPfToken(); // Ensure `pfToken` is updated before proceeding
            console.log('Saved card process initiated');
             await vaultedCapture(); // Proceed to vaulted capture after fetching token
        } else {
            console.log('Using new credit card...');
            await creditCardCapture(); // Handle new card flow
        }
    };
    // Vaulted capture process
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

    // Credit card capture process
    const creditCardCapture = async (onSuccess: () => void, onFailure: () => void ): Promise<void> => {
        if (!tokenLoaded.value) {
            console.error('BlueSnap is not initialized.');
            onFailure();
            return;
        }
        console.log('CreditCardCapture:', cardTypeToServer.value);

        // Update threeDSecureObj with current values
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
                    onFailure(); // Trigger onFail for callback errors
                    return;
                }

                if (
                    !callbackResult.threeDSecure ||
                    callbackResult.threeDSecure.authResult !== 'AUTHENTICATION_SUCCEEDED'
                ) {
                    onFailure();
                    return;
                }

                const body = {
                    pfToken: pfToken.value,
                    firstName: firstName.value,
                    lastName: lastName.value,
                    saveCard: saveCard.value,
                    threeDSecureReferenceId: callbackResult.threeDSecure.threeDSecureReferenceId,
                    authResult: callbackResult.threeDSecure.authResult,
                    amount: amount.value.toString(),
                    cardType: cardTypeToServer.value
                };

                try {
                    const result = await BlueSnapApi.BlueSnapCardCapture(body);

                    // Check if the capture was successful
                    if (result?.data?.success) {
                        console.log('Credit card capture successful:', result.data);

                        // Check if "Save Card" is checked before storing the vaultedShopperId
                        if (saveCard.value) {
                            const vaultedShopperId = result.vaultedShopperId;
                            if (vaultedShopperId) {
                                console.log('valuted', vaultedShopperId)
                                storeVaultedShopperId(vaultedShopperId);
                            } else {
                                console.warn('No Vaulted Shopper ID returned to store.');
                            }
                        }

                        onSuccess(); // Trigger onSuccess callback
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
                    onFailure(); // Trigger onFail callback on API error
                }
            },
            threeDSecureObj.value
        );
    };


    // Fetch pfToken and initialize BlueSnap
    const fetchPfToken = async (): Promise<void> => {
        try {
            const response = await BlueSnapApi.getPfToken(); // Fetch the token dynamically
            // console.log('PfToken response:', response);
            if (response != null) {
                pfToken.value = response;
            }
            // console.log('pfToken retrieved:', pfToken.value);
            logMessages.value = `pfToken retrieved: ${pfToken.value}`;

            // After fetching pfToken, initialize BlueSnap
            initializeBlueSnap();
        } catch (error) {
            logMessages.value = 'Failed to retrieve pfToken.';
            console.error('Error fetching pfToken:', error);
        }
    };

    // Lifecycle hooks
    onMounted(() => {
        // Load BlueSnap SDK
        initializeCart()
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

    // Watch for changes in the useSavedCard checkbox
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
