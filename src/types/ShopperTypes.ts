export interface CaptureRequestBody {
    pfToken: string;
    firstName: string;
    lastName: string;
    saveCard: boolean;
}

export interface VaultedShopperRequestBody {
    pfToken: string;
    vaultedId: string;
}

export interface VaultedShopperDataRequest {
    vaultedId: string;
}
