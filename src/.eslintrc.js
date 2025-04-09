// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 12,
        sourceType: 'module',
    },
    extends: [
        'plugin:vue/vue3-recommended',
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended',
        // Add any additional style guides if desired
    ],
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        // Add custom rules here
    },
};
