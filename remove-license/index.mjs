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

    const id = event.queryStringParameters && event.queryStringParameters.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing id parameter.' }),
      };
    }

    // Check that the executed action is not for the same administrator or license provider.
    let result = await queryFunction.licenses(
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
        body: JSON.stringify({ error: 'You do not have permission to remove your own account.' }),
      };
    }
    
    result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-id-and-is_admin-and-subscription_id',
        filters: { id, subscription_id: subscriptionData.id, is_admin: false }
      }
    );
    licenseData = result?.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'License not found.' }),
      };
    }

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
