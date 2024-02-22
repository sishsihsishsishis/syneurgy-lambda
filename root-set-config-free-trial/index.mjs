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
    const { key, value } = requestBody;
  
    if (!key) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing key parameter.' }),
      };
    }

    if (!value) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Missing value parameter.' }),
      };
    }

    // Check trial period days (default)
    const trialPeriodDays = await queryFunction.paymentSettings(
      client, 
      { command: 'get-by-key',
        filters: { key }
      }
    );
    let trialPeriodDaysData = trialPeriodDays?.rows[0];

    if (!trialPeriodDaysData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Trial period days not found.' }),
      };
    }

    trialPeriodDaysData = (await queryFunction.paymentSettings(
      client, 
      { command: 'update-value-by-key',
        data: { value },
        filters: { key }
      }
    )).rows[0];

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        ...trialPeriodDaysData
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
