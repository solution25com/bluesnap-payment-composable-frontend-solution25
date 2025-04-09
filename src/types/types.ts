export interface GooglePaymentData {
    gToken: string;
    amount: number;
    currency: string;
}

export interface PaymentData {
    pfToken: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    firstName: string;
    lastName: string;
    amount: number;
    currency: string;
}

export interface ApplePaymentData {
    aToken: string;
    amount: number;
    currency: string;
}


export interface RefundData {
    transactionId: string;
    amount: number;
    reason?: string;
}

export interface RefundResponse {
    success: boolean;
    refundId?: string;
    message?: string;
}

export interface PaymentDataToSend {
    pfToken: string;
    firstName: string;
    lastName: string;
    amount: number;
    currency: string;
}

export interface PaymentResponse {
    success: boolean;
    data?: {
        transactionId?: string;
        message?: string;
    };
    errors?: Array<{
        property: string;
        message: string;
    }>;
}
export interface TransactionData {
    transactionId: string,
    orderId: string,
}
