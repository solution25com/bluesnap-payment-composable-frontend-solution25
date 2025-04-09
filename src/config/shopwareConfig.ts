export const shopwareConfig = {
    accessToken: '',
    endpoint: '',
    contextToken: '',
};

// Function to update the configuration dynamically
export const setShopwareConfig = (config: Partial<typeof shopwareConfig>) => {
    if (config.accessToken) shopwareConfig.accessToken = config.accessToken;
    if (config.endpoint) shopwareConfig.endpoint = config.endpoint;
    if (config.contextToken) shopwareConfig.contextToken = config.contextToken;
};


// Function to retrieve the current configuration
export const getShopwareConfig = () => shopwareConfig;
