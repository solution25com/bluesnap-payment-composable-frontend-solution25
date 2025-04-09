import { BlueSnapMode } from "../config/constants";

export interface BlueSnapConfigResponse {
  message: {
    mode: BlueSnapMode.Sandbox | BlueSnapMode.Production;
    merchantId: string;
    "3D": boolean;
    merchantGoogleId?: string;
  };
  success: boolean;
  apiAlias: string;
}

export interface TotalPriceResponse {
  price: {
    totalPrice: number;
  };
}

export interface PfTokenResponse {
  message: string;
  success: boolean;
  apiAlias?: string;
}
