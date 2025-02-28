import { createRouter, createWebHistory } from 'vue-router';
import SuccessTemplate from '../components/SuccessTemplate.vue';
import FailureTemplate from '../components/FailureTemplate.vue';

const routes = [
    { path: '/successtemplate', name: 'SuccessTemplate', component: SuccessTemplate },
    { path: '/failuretemplate', name: 'FailureTemplate', component: FailureTemplate },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;