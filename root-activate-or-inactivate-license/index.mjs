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
        body: JSON.stringify({ error: 'Missing status parameter.', status }),
      };
    }

    // Check license
    const license = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-id',
        filters: { id }
      }
    );
    let licenseData = license?.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'License not found.' }),
      };
    }

    licenseData = (await queryFunction.licenses(
      client, 
      { command: 'update-license-status-and-id',
        data: { status },
        filters: { id: licenseData.id }
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
