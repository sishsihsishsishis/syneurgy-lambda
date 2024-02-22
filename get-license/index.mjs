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

    // Check payment status
    await utils.parseAndCheckHttpError(await utils.checkPaymentStatus(client, email));

    const result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email: email }
      }
    );
    const licenseData = result?.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'License not found.' }),
      };
    }

    const subscription = licenseData.free_account == true ? undefined : (await queryFunction.subscriptions(
      client, 
      { command: 'get-subscription-by-id',
        filters: { id: licenseData.subscription_id }
      }
    ))?.rows[0];

    const body = {
      licenses: licenseData,
      user_email_admin: subscription?.user_email,
    }

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        ...body
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
