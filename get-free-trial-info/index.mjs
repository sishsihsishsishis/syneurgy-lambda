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

    // Check license
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

    // Check subscription
    const subscription = licenseData.free_account == true ? undefined : (await queryFunction.subscriptions(
      client, 
      { command: 'get-subscription-by-id',
        filters: { id: licenseData.subscription_id }
      }
    ));

    let data = { free_account: licenseData.free_account };
    if (subscription) {
      const subscriptionData = subscription?.rows[0];

      if (!subscriptionData) {
        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 'Subscription not found.' }),
        };
      }

      let isTrialValid = false;
      let remainingTime = 0;
      const subscriptionStripe = await stripeInstance.subscriptions.retrieve(subscriptionData.stripe_data.subscription.id);
      if (subscriptionStripe.trial_end !== null) {        
        isTrialValid = utils.isTrialPeriodValid(subscriptionStripe.trial_start, subscriptionStripe.trial_end);
        remainingTime = utils.calculateRemainingTime(subscriptionStripe.trial_end);
      }
      data = {
        email,
        is_trial_valid: isTrialValid,
        remaining_time_text: utils.formatTimeRemaining(remainingTime),
        remaining_time_seconds: remainingTime / 1000,
        remaining_time_milliseconds: remainingTime
      };
    }
    
    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({ data }),
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
