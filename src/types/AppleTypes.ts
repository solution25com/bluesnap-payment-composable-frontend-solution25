// Define the request structure for Apple Pay
import ApplePayMerchantCapability = ApplePayJS.ApplePayMerchantCapability;

export interface ApplePayRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: ApplePayMerchantCapability[]; // Use stricter type
  total: { label: string; amount: string };
}

// Define the structure for the validation body
export interface AppleValidationBody {
  validationUrl: string;
  domainName: string;
  displayName: string;
}

// Define the structure for the capture body
export interface CaptureBody {
  appleToken: string;
  amount: string;
}

export interface AppleCreateWalletResponse {
  message: string; // JSON string containing MerchantSession
  success: boolean;
  apiAlias?: string; // Optional
}

export interface AppleCaptureResponse {
  message: string; // JSON string containing transaction details
  success: boolean;
  apiAlias?: string; // Optional
}
