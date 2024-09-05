import stripe from "stripe";

import * as configEnv from './config.mjs';
import * as utils from './utils.mjs';

const stripeInstance = stripe(configEnv.stripeSecretKey);

export const handler = async (event) => {
  const client = utils.parseAndCheckHttpError(await utils.getDBInstance());
  
  try {
    // CORS Preflight
    if (event?.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: configEnv.headers,
        body: '',
      };
    }

    const email = event.queryStringParameters && event.queryStringParameters.email;
    const callbackSuccess = event.queryStringParameters && event.queryStringParameters.callback_success;
    const callbackFailure = event.queryStringParameters && event.queryStringParameters.callback_failure;
    const price = event.queryStringParameters && event.queryStringParameters.price;
    let quantity = event.queryStringParameters && event.queryStringParameters.quantity;
    
    if (!callbackSuccess) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing callback_success parameter.' }),
      };
    }

    if (!callbackFailure) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing callback_failure parameter.' }),
      };
    }
    
    if (!price) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing price parameter.' }),
      };
    }

    if (!quantity) {
      quantity = 1;
    }

    // Launch paywall
    const session = await stripeInstance.checkout.sessions.create({
      line_items: [
        {
          price: price,
          quantity: quantity,
        },
      ],
      mode: "payment",  
      success_url: callbackSuccess,
      cancel_url: callbackFailure,
      customer_email: email,
      metadata: {
        email
      },
    });

    const response = {
      statusCode: 303,
      headers: {
        ...configEnv.headers,
        Location: session.url,
      },
      body: '',
    };

    return response;
  } catch (error) {
    return {
      statusCode: error?.details?.statusCode || 500,
      headers: configEnv.headers,
      body: JSON.stringify(error || { error: 'Internal Server Error.' }),
    };
  } finally {
    await client.end();
  }
};
