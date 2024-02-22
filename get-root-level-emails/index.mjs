// index.mjs

import * as configEnv from './config.mjs';
// import * as utils from './utils.mjs';

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

    // Check token email (current user)
    // utils.parseAndCheckHttpError(await utils.getTokenEmail(event));
    
    const emails = [
      'Erwin@syneurgy.com',
      'Michael@syneurgy.com',
      'shijia@syneurgy.com',
      'david@syneurgy.com',
      'pcastanog@unal.edu.co'
    ]
    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        emails
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
