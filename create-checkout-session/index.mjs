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
    // const email = utils.parseAndCheckHttpError(await utils.getTokenEmail(event));

    const email = event.queryStringParameters && event.queryStringParameters.email;
    const callbackSuccess = event.queryStringParameters && event.queryStringParameters.callback_success;
    const callbackFailure = event.queryStringParameters && event.queryStringParameters.callback_failure;
    const price = event.queryStringParameters && event.queryStringParameters.price;
    
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

    let result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email: email }
      }
    );
    const licenseData = result.rows[0];

    if (licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'You already have a license, if there is any inconsistency with your license please contact your administrator or license provider.' }),
      };
    }

    // Check trial period days (default)
    let freeTrial = 5;
    const trialPeriodDays = await queryFunction.paymentSettings(
      client, 
      { command: 'get-by-key',
        filters: { key: 'trial_period_days' }
      }
    );
    const trialPeriodDaysData = trialPeriodDays?.rows[0];

    if (trialPeriodDaysData) {
      freeTrial = parseInt(trialPeriodDaysData?.arg_value, 10) || 5;
    }

    // Launch paywall
    const session = await stripeInstance.checkout.sessions.create({
      line_items: [
        {
          price: price,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 99,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: callbackSuccess,
      cancel_url: callbackFailure,
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        trial_period_days: freeTrial,
      },
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
