export interface ThreeDSecureObj {
    amount: number;
    currency: string;
    billingFirstName: string;
    billingLastName: string;
    // cardType: string;
}

export interface BlueSnapError {
    tagId: string;
    errorCode: string;
    errorDescription: string;
    eventOrigin?: string;
}

export interface BlueSnapThreeDSecure {
    authResult: string;
    threeDSecureReferenceId: string;
}

export interface BlueSnapCallback {
    error?: BlueSnapError[];
    threeDSecure?: BlueSnapThreeDSecure;
}

export interface BlueSnapFieldEventHandlers {
    onFocus?: (tagId: string) => void;
    onBlur?: (tagId: string) => void;
    onError?: (tagId: string, errorCode: string, errorDescription: string, eventOrigin: string) => void;
    onType?: (tagId: string, cardType: string) => void;
    onValid?: (tagId: string) => void;
}

export interface BlueSnapStyle {
    input?: {
        'font-size'?: string;
        'font-family'?: string;
        'line-height'?: string;
        color?: string;
    };
    ':focus'?: {
        color?: string;
    };
}

export interface BlueSnapHostedPaymentFieldsCreateOptions {
    '3DS'?: boolean;
    token: string;
    onFieldEventHandler?: BlueSnapFieldEventHandlers;
    style?: BlueSnapStyle;
    ccnPlaceHolder?: string;
    cvvPlaceHolder?: string;
    expPlaceHolder?: string;
}

// export interface BlueSnap {
//     hostedPaymentFieldsCreate: (options: BlueSnapHostedPaymentFieldsCreateOptions) => void;
//     hostedPaymentFieldsSubmitData: (
//         callback: (result: BlueSnapCallback) => void,
//         threeDSecureObj?: ThreeDSecureObj
//     ) => void;
//     three
// }

export interface VaultedShopperRequestBody {
    pfToken: string;
    vaultedId?: string;
    threeDSecureReferenceId: string;
    authResult: string;
    amount: number;
    cardType: string;
}

export interface VaultedShopperData {
    success: boolean;
    message: string;
}

export interface CaptureRequestBody {
    pfToken: string;
    firstName: string;
    lastName: string;
    saveCard: boolean;
    threeDSecureReferenceId: string;
    authResult: string;
    amount: string;
}

export interface CaptureResponse {
    success: boolean;
    message: string;
}
