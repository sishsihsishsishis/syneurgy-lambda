// index.mjs

import stripe from "stripe";

import * as configEnv from './config.mjs';
import * as queryFunction from './query.mjs';
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

    // Get token email (current user)
    const email = utils.parseAndCheckHttpError(await utils.getTokenEmail(event));

    // Is Root
    utils.parseAndCheckHttpError(await utils.isRoot(email));

    const id = event.queryStringParameters && event.queryStringParameters.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing id parameter.' }),
      };
    }

    // Check license
    let result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-id',
        filters: { id }
      }
    );
    let licenseData = result?.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'License not found.' }),
      };
    }

    if (licenseData.is_admin === true) {
      const subscription = await queryFunction.subscriptions(
        client, 
        { command: 'get-subscription-by-id',
          filters: { id: licenseData.subscription_id }
        }
      );
      const subscriptionData = subscription?.rows[0];

      if (!subscriptionData) {
        return {
          statusCode: 400,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 'Subscription not found.' }),
        };
      }

      await stripeInstance.subscriptions.cancel(subscriptionData.stripe_data.subscription.id);
      
      return {
        statusCode: 200,
        headers: configEnv.headers,
        body: JSON.stringify({ message: 'The subscription was cancelled and all licenses associated with this subscription were removed.',
        subscription: subscriptionData.stripe_data.subscription.id }),
      };
    }

    // Delete license
    result = await queryFunction.licenses(
      client, 
      { command: 'delete-license-by-id',
        filters: { id }
      }
    );

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        message: 'License deleted.',
        deleteCount: result.rowCount,
      }),
    };

    return response;
  } catch (error) {
    return {
      statusCode: error?.details?.statusCode || 500,
      headers: configEnv.headers,
      body: JSON.stringify(error?.details?.body || { error: 'Internal Server Error.' }),
    };
  } finally {
    await client.end();
  }
};
