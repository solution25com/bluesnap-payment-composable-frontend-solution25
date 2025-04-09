import { getShopwareConfig } from '../config/shopwareConfig';

export const useShopwareApi = () => {
    const fetchProducts = async () => {
        const { accessToken, endpoint, contextToken } = getShopwareConfig();

        if (!accessToken || !endpoint) {
            throw new Error('Shopware configuration is missing. Please set it before using the library.');
        }

        const response = await fetch(`${endpoint}/product`, {
            headers: {
                'sw-access-key': accessToken,
                'sw-context-token': contextToken || '',
            },
        });

        return await response.json();
    };

    return { fetchProducts };
};
