import * as configEnv from './config.mjs';
import stripe from 'stripe';

const stripeInstance = stripe(configEnv.stripeSecretKey);

export const handler = async (event) => {
  try {
    // CORS Preflight
    if (event?.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: configEnv.headers,
        body: '',
      };
    }

    // Fetch prices and products
    const prices = await stripeInstance.prices.list();
    const products = await stripeInstance.products.list();

    // Map product IDs to product details
    const productDetails = products.data.reduce((acc, product) => {
      acc[product.id] = {
        name: product.name || 'No name available',
        description: product.description || 'No description available',
      };
      return acc;
    }, {});

    // Add product details to prices
    const pricesWithDetails = prices.data.map(price => ({
      ...price,
      productName: productDetails[price.product]?.name || 'No name available',
      productDescription: productDetails[price.product]?.description || 'No description available',
    }));

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        prices: pricesWithDetails
      }),
    };
    return response;
  } catch (error) {
    return {
      statusCode: error?.details?.statusCode || 500,
      headers: configEnv.headers,
      body: JSON.stringify(error?.details?.body || { error: 'Internal Server Error.' }),
    };
  }
};