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

    // Is Root
    utils.parseAndCheckHttpError(await utils.isRoot(email));

    if (!event.body) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing request body.' }),
      };
    }
  
    const requestBody = JSON.parse(event.body);
    const { user_email, status } = requestBody;
    let account_created = false;
    if (!user_email) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing user_email parameter.' }),
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
      // return {
      //   statusCode: 404,
      //   headers: configEnv.headers,
      //   body: JSON.stringify({ error: 'User not found.' }),
      // };
      account_created = false;
    } else {
      account_created = true;
    }

    // Verify e-mail availability in licenses
    const result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email  }
      }
    );
    let licenseData = result?.rows[0];

    if (licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'This license is registered, try another email.' }),
      };
    }

    const license = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email  }
      }
    );
    licenseData = license?.rows[0];
    let updatedLicense;

    if (!licenseData) {
      // Create license
      updatedLicense = await queryFunction.licenses(
        client, 
        { command: 'create-license',
          data: { user_email, subscription_id: null, status: status || true, account_created: account_created , free_account: true }
        }
      );

      if (!updatedLicense) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ email: user_email, error: 'License not created.' }),
        };
      }
    } else {
      // Update license
      updatedLicense = await queryFunction.licenses(
        client, 
        { command: 'update-license',
          data: { id: licenseData.id, subscription_id: null, status: status || true, free_account: true }
        }
      );

      if (!updatedLicense) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ email: user_email, error: 'License not updated.' }),
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
