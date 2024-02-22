// index.mjs

import * as configEnv from './config.mjs';
import * as queryFunction from './query.mjs';
import * as utils from './utils.mjs';

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

    // Check if you are the administrator or provider of this license
    const subscription = await queryFunction.subscriptions(
      client, 
      { command: 'get-subscription-by-user_email',
        filters: { user_email: email }
      }
    );
    const subscriptionData = subscription?.rows[0];

    if (!subscriptionData) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ email, error: 'You do not have permission for this resource.' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing request body.' }),
      };
    }
  
    const requestBody = JSON.parse(event.body);
    const { id, status } = requestBody;
  
    if (!id) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing id parameter.' }),
      };
    }
  
    if (status === undefined && status === null) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing status parameter.', id, status }),
      };
    }

    // Check that the executed action is not for the same administrator or license provider.
    const result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email-and-is_admin-and-id',
        filters: { user_email: email, id, is_admin: true }
      }
    );
    let licenseData = result?.rows[0];

    if (licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'You do not have permission to activate or deactivate your own account.' }),
      };
    }

    // Check license availability
    const licenses = (await queryFunction.licenses(
      client, 
      { command: 'get-license-by-subscription_id-and-status-no-id', 
        filters: { subscription_id: subscriptionData.id, status: true, id }
      }
    )).rows;
    if (licenses.length >= subscriptionData.subscriptions_amount) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'You cannot activate this license, you must first increase the capacity of your licenses, go to the license purchase section.' }),
      };
    }

    // Check license
    const license = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-subscription_id-and-id',
        filters: { subscription_id: subscriptionData.id, id }
      }
    );
    licenseData = license?.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'You do not have permission for this resource.' }),
      };
    }

    licenseData = (await queryFunction.licenses(
      client, 
      { command: 'update-license-status-and-id',
        data: { status },
        filters: { id }
      }
    )).rows[0];

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        ...licenseData
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
