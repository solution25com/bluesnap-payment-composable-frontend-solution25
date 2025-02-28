import GooglePayComponent from './components/GooglePayComponent.vue';
import ApplePayComponent from './components/ApplePayComponent.vue';
import PaymentCapture from './components/PaymentCapture.vue';
import BlueSnapApi from './services/BlueSnapApi.ts';
import { setShopwareConfig } from './config/shopwareConfig';
import BlueSnapHostedPages from "./components/BlueSnapHostedPages.vue";

// Export individual components and utilities
export {BlueSnapHostedPages, GooglePayComponent, ApplePayComponent, PaymentCapture, BlueSnapApi, setShopwareConfig };

export default {
    install(app, options = {}) {
        // Register components globally
        app.component('GooglePayComponent', GooglePayComponent);
        app.component('ApplePayComponent', ApplePayComponent);
        app.component('PaymentCapture', PaymentCapture);
        app.component('BlueSnapHostedPages', BlueSnapHostedPages);

        // Initialize Shopware configuration if provided
        if (options.accessToken || options.endpoint || options.contextToken) {
            setShopwareConfig({
                accessToken: options.accessToken,
                endpoint: options.endpoint,
                contextToken: options.contextToken,
            });
            console.log('Shopware configuration initialized:', options);
        } else {
            console.warn('No Shopware configuration provided during library installation.');
        }
    },
};
