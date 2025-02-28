// types/googlePayTypes.ts
export interface GooglePayCardPaymentMethod {
    type: string;
    parameters: {
        allowedAuthMethods: string[];
        allowedCardNetworks: string[];
    };
}

export interface GoogleTransactionInfo {
    countryCode: string;
    currencyCode: string;
    totalPriceStatus: string;
    totalPrice: string;
}


export interface BlueSnapApiResponse {
    success: boolean;
}


export interface GooglePaymentData {
    gToken: string; // The encoded payment token
    amount: number; // The amount in float format (e.g., 0.00)
}

export interface GooglePaymentResponse {
    success: boolean; // Indicates whether the payment was successful
}

export interface GoogleApiVersion {
    apiVersion: number;
    apiVersionMinor: number;
}

export interface GoogleTokenizationSpecification {
    type: string; // Specifies the type of tokenization, e.g., "PAYMENT_GATEWAY"
    parameters: {
        gateway: string; // The name of the payment gateway, e.g., "bluesnap"
        gatewayMerchantId: string; // The merchant ID for the payment gateway
    };
}