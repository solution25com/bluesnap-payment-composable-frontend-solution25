import { createRouter, createWebHistory } from 'vue-router';

const SuccessTemplate = { template: '<div><h2>Success</h2><p>Payment successful!</p></div>' };
const FailureTemplate = { template: '<div><h2>Failure</h2><p>Payment failed!</p></div>' };

// Define routes
const routes = [
    { path: '/success', name: 'Success', component: SuccessTemplate },
    { path: '/failure', name: 'Failure', component: FailureTemplate },
];

// Log the routes for debugging
console.log('Defined Routes:', routes);

// Create router instance
const lame = createRouter({
    history: createWebHistory(),
    routes,
});

// Export router
export default lame;
