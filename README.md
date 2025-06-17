#  BlueSnap Payment Plugin – Composable Frontend for Shopware 6

The BlueSnap Payment Plugin for Shopware's Composable Frontend provides a modern, headless-compatible integration that supports seamless, secure, and scalable payment experiences. This plugin is tailored for custom storefronts built using frameworks like Vue.js and Nuxt, enabling API-first, frontend-agnostic commerce solutions.

---

##  Features

-  RESTful API integration based on the Shopware Store API.
-  Secure payment processing with BlueSnap tokenization and 3D Secure.
-  Real-time transaction status tracking and webhook support.
-  Vue/Nuxt-compatible frontend SDK with composables and UI components.
-  Published JS packages for flexible integration:
  - `@bluesnap/payments`
  - `@bluesnap/payments/vue`
  - `@bluesnap/payments/nuxt`

---

##  JavaScript SDK Packages

### 1. `@bluesnap/payments`  
Core service logic with TypeScript support for API methods like:

- `initPaymentSession()`
- `getPaymentStatus()`
- `processRefund()`
- `getTransactionHistory()`

### 2. `@bluesnap/payments/vue`  
Vue 3-specific composables and UI components.

### 3. `@bluesnap/payments/nuxt`  
Nuxt 3-ready package with helper modules and automatic integration support.

---

##  Custom API Endpoints

These endpoints extend the Shopware Store API and are fully documented via OpenAPI:

| Method | Endpoint                           | Description                              |
|--------|------------------------------------|------------------------------------------|
| GET    | `/bluesnap/init`                   | Initialize payment session (token setup) |
| GET    | `/bluesnap/payment-status`         | Check current payment status             |
| POST   | `/bluesnap/payment/callback`       | Handle BlueSnap gateway callbacks        |
| POST   | `/bluesnap/payment/refund`         | Process a refund                         |
| GET    | `/bluesnap/payment/methods`        | Retrieve available payment methods       |
| POST   | `/bluesnap/payment/validate`       | Validate payment method before charging  |
| GET    | `/bluesnap/payment/transactions`   | Get payment history for order/user       |
| GET    | `/bluesnap/payment/options`        | Get dynamic options based on cart data   |

---

##  Developer Integration

### 1. Nuxt Setup

```bash
npm install @bluesnap/payments @bluesnap/payments/nuxt
