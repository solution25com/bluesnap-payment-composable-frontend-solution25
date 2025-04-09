// GOOGLE PAYMENT CALL WORKING SERVICE WITH LOCALHOST SHOPWARE

import axios, { AxiosInstance, AxiosResponse } from "axios";

// import {
//     BlueSnapTokenResponse
// } from '../types/BlueSnapTypes.ts';
import {
  BlueSnapConfigResponse,
  PfTokenResponse,
  TotalPriceResponse,
} from "../types/ConfigTypes.ts";
import {
  GooglePaymentResponse,
  GooglePaymentData,
} from "../types/GooglePayTypes.ts";
import {
  AppleCreateWalletResponse,
  AppleValidationBody,
  CaptureBody,
  AppleCaptureResponse,
} from "../types/AppleTypes.ts";
import {
  CaptureRequestBody,
  CaptureResponse,
  VaultedShopperData,
} from "../types/BlueSnapTypes.ts";
import { getShopwareConfig } from "../config/shopwareConfig.ts";
import { TransactionData } from "../types/types.ts";

const axiosInstance: AxiosInstance = axios.create();

// Constants
axiosInstance.interceptors.request.use((config) => {
  const { accessToken, endpoint, contextToken } = getShopwareConfig();

  // Log the configuration for debugging
  console.log("Shopware Config:", { accessToken, endpoint, contextToken });

  // Ensure endpoint is set
  if (!endpoint) {
    throw new Error(
      "Shopware endpoint is not configured. Please set it before making API calls."
    );
  }

  // Update Axios configuration
  config.baseURL = endpoint;
  config.headers = {
    ...config.headers,
    "Sw-Access-Key": accessToken,
    "Sw-Context-Token": contextToken || "",
  };

  return config;
});

// BlueSnap API Object
const BlueSnapApi = {
  async processGooglePayment(
    googlePaymentData: GooglePaymentData
  ): Promise<GooglePaymentResponse | void> {
    try {
      const response = await axiosInstance.post<GooglePaymentResponse>(
        "bluesnap/google-capture",
        googlePaymentData
      );

      console.log("Payment Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in processGooglePayment:", error);
    }
  },

  async fetchCart(): Promise<{ totalPrice: number; isoCountryCode: string }> {
    const response: AxiosResponse<TotalPriceResponse> = await axiosInstance.get(
      "checkout/cart"
    );

    // Extract the total price and country ISO code
    const totalPrice = response.data?.price?.totalPrice || 0; // Default to 0 if undefined
    const isoCountryCode =
      response.data?.deliveries?.[0]?.location?.country?.iso || ""; // Default to empty string if undefined

    console.log("po de", isoCountryCode);
    console.log(isoCountryCode);
    // Return both values as an object
    return { totalPrice, isoCountryCode };
  },

  async appleCreateWallet(
    body: AppleValidationBody
  ): Promise<AppleCreateWalletResponse> {
    const response = await axiosInstance.post(
      "bluesnap/apple-create-wallet",
      body
    );
    return response.data; // Ensure this is the expected structure
  },

  async appleCapture(body: CaptureBody): Promise<AppleCaptureResponse> {
    try {
      const response = await axiosInstance.post("bluesnap/apple-capture", body);
      return response.data;
    } catch (error) {
      console.error("Error in appleCapture:", error);
      throw new Error("Failed to capture Apple Pay transaction");
    }
  },

  async vaultedShopper(body) {
    const response: AxiosResponse<VaultedShopperData> =
      await axiosInstance.post("bluesnap/vaulted-shopper", body);
    console.log("Vaulted Shopper Creation Response:", response.data);
    return response.data;
  },

  async getVaultedShopperCreditCardData(
    vaultedShopperId: string
  ): Promise<VaultedShopperData> {
    console.log("Fetching Vaulted Shopper Data for ID:", vaultedShopperId);
    const response: AxiosResponse<VaultedShopperData> = await axiosInstance.get(
      `bluesnap/vaulted-shopper-data/${vaultedShopperId}`
    );
    console.log("Vaulted Shopper Data Response:", response.data);
    return response.data;
  },

  async BlueSnapCardCapture(
    body: CaptureRequestBody
  ): Promise<{ data: CaptureResponse; vaultedShopperId: number | null }> {
    try {
      console.log("Capturing Payment with data:", body);

      // Make the API call
      const response: AxiosResponse<CaptureResponse> = await axiosInstance.post(
        "bluesnap/capture",
        body
      );

      // Parse the JSON string in the "message" field
      let vaultedShopperId: number | null = null;
      try {
        const parsedMessage = JSON.parse(response.data.message);
        vaultedShopperId = parsedMessage.vaultedShopperId;
        console.log("Vaulted Shopper ID:", vaultedShopperId);
      } catch (parseError) {
        console.error("Error parsing response.message:", parseError);
      }

      // Return the full response along with the extracted vaultedShopperId
      return { data: response.data, vaultedShopperId };
    } catch (error) {
      console.error("Error during BlueSnapCardCapture:", error);
      throw error;
    }
  },

  async getPfToken(): Promise<string | null> {
    try {
      const response: AxiosResponse<PfTokenResponse> = await axiosInstance.get(
        `bluesnap/get-pf-token`,
        {}
      );

      if (response.data.success && response.data.message) {
        const token = response.data.message;
        console.log("BlueSnap token retrieved:", token);
        return token;
      } else {
        console.error("Failed to retrieve token: Invalid response format.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching BlueSnap token:", error);
      return null;
    }
  },

  async hostedCheckout(body?: Record<string, any>): Promise<any> {
    try {
      console.log("Requesting Hosted Checkout Token with body:", body);

      const response: any = await axiosInstance.post(
        "bluesnap/hosted-pages-link",
        body
      );

      console.log("Hosted Checkout Token Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error in hostedCheckout:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async fetchBlueSnapConfig(): Promise<BlueSnapConfigResponse> {
    try {
      const response = await axiosInstance.get<BlueSnapConfigResponse>(
        "bluesnap/get-config"
      );

      return response.data; // Return the full response for consistency
    } catch (error) {
      console.error("Error fetching BlueSnap config:", error);
      throw new Error("Failed to fetch BlueSnap configuration");
    }
  },

  async createTransaction(
    transactionId: string,
    orderId: string,
    paymentMethod: string
  ): Promise<TransactionData> {
    try {
      const response: AxiosResponse<TransactionData> = await axiosInstance.post(
        "bluesnap/create-transaction",
        { transactionId, orderId, paymentMethod }
      );

      // Return only the transaction ID from the response
      // (Adjust according to your TransactionData structure.)
      return response.data;
    } catch (error) {
      console.error("Error sending transaction and order id:", error);
      throw error;
    }
  },
};

export default BlueSnapApi;
