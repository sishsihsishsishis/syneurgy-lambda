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
    const { user_email, status, account_created } = requestBody;
  
    if (!user_email) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing user_email parameter.' }),
      };
    }

    // Check that the executed action is not for the same administrator or license provider.
    let result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email-and-is_admin',
        filters: { user_email, is_admin: true }
      }
    );
    let licenseData = result?.rows[0];

    if (licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'You can\'t add yourself, try another email.' }),
      };
    }

    // Verify e-mail in users
    const user = await queryFunction.users(
      client, 
      { command: 'get-users-by-email',
        filters: { email: user_email  }
      }
    );
    const userData = user?.rows[0];

    if (!userData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'User not found.' }),
      };
    }

    // Verify e-mail availability in licenses
    result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email  }
      }
    );
    licenseData = result?.rows[0];

    if (licenseData) {
      if (licenseData.subscription_id === subscriptionData.id) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 
            licenseData.status === false ?
            'This license is already registered, but it is deactivated, try to activate it using the activate or enable license option.' :
            'This license is registered, try another email.'
          }),
        };
      }
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'This license is registered, try another email.' }),
      };
    }

    // Check license availability
    const licenses = (await queryFunction.licenses(
      client, 
      { command: 'get-license-by-subscription_id-and-status',
        filters: { subscription_id: subscriptionData.id, status: true }
      }
    ))?.rows;
    if (licenses?.length >= subscriptionData.subscriptions_amount) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: `You have no licenses available, contact your administrator or license provider: ${subscriptionData.user_email}.` }),
      };
    }

    // Check license
    const license = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email-and-is_admin-and-subscription_id',
        filters: { user_email, subscription_id: subscriptionData.id, is_admin: false }
      }
    );
    licenseData = license?.rows[0];
    let updatedLicense;

    if (!licenseData) {
      // Create license
      updatedLicense = await queryFunction.licenses(
        client, 
        { command: 'create-license',
          data: { user_email, subscription_id: subscriptionData.id, status: status || true, account_created: account_created || true, free_account: false }
        }
      );

      if (!updatedLicense) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 'License not created.' }),
        };
      }
    } else {
      // Update license
      updatedLicense = await queryFunction.licenses(
        client, 
        { command: 'update-license',
          data: { id: licenseData.id, subscription_id: subscriptionData.id, status: status || true, free_account: false }
        }
      );

      if (!updatedLicense) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 'This license already exists, but it cannot be updated.' }),
        };
      }
    }

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        ...updatedLicense.rows[0]
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
