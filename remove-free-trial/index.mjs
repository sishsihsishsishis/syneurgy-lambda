// index.mjs

import stripe from "stripe";

import * as configEnv from './config.mjs';
import * as queryFunction from './query.mjs';
import * as utils from './utils.mjs';

const stripeInstance = stripe(configEnv.stripeSecretKey);

// Function to save the current state of the subscription
async function saveCurrentState(subscriptionId) {
  try {
      const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
      return {
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          step: 'save the current state of the subscription: OK'
      };
  } catch (error) {
      console.error('Error retrieving subscription details:', error);
      throw error;
  }
}

// Function to restore the previous state of the subscription
async function restorePreviousState(subscriptionId, trialStart, trialEnd) {
  try {
      await stripeInstance.subscriptions.update(subscriptionId, {
          trial_start: trialStart,
          trial_end: trialEnd
      });
      console.log('Previous subscription state has been successfully restored.');
  } catch (error) {
      console.error('Error restoring previous subscription state:', error);
      throw error;
  }
}

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

    let isTrialValid0 = false;
    let remainingTime0 = 0;
    let isTrialValid = false;
    let remainingTime = 0;
    let data = { email, error: undefined, steps: undefined, message: undefined, before: undefined, after: undefined };
    const subscriptionStripe = await stripeInstance.subscriptions.retrieve(subscriptionData.stripe_data.subscription.id);

    if (subscriptionStripe.status === 'trialing' && subscriptionStripe.trial_end !== null) {
      data.steps = [];
      // Save the current state of the subscription
      const { trial_start, trial_end, step } = await saveCurrentState(subscriptionData.stripe_data.subscription.id);

      data.steps.push(step);
      isTrialValid0 = utils.isTrialPeriodValid(trial_start, trial_end);
      remainingTime0 = utils.calculateRemainingTime(trial_end);

      const updatedSubscription = await stripeInstance.subscriptions.update(subscriptionData.stripe_data.subscription.id, {
        trial_end: 'now',
        proration_behavior: 'create_prorations',
      });

      if (updatedSubscription.status === 'active') {
        data.steps.push('remove free trail period: OK');
        // try {
        //   // Create an invoice immediately for the subscription
        //   await stripeInstance.invoices.create({
        //       customer: subscriptionData.stripe_data.customer.id,
        //       subscription: subscriptionData.stripe_data.subscription.id,
        //       auto_advance: true
        //   });
        //   data.steps.push('create an invoice immediately for the subscription: OK');
        //   console.log('Invoice has been successfully created.');
        // } catch (error) {
        //   data.steps.push('create an invoice immediately for the subscription: FAIL');
        //   data.error = 'error creating invoice.';
        //   console.error('Error creating invoice:', error);
  
        //   // If an error occurs, restore the previous state of the subscription
        //   if (error.statusCode === 404) {
        //     data.message = 'the subscription does not exist, no need to revert the state.';
        //     console.log('The subscription does not exist, no need to revert the state.');
        //   } else {
        //     console.log('Restoring the previous state of the subscription...');
        //     await restorePreviousState(subscriptionData.stripe_data.subscription.id, trial_start, trial_end);
        //     data.message = 'the previous status of the subscription is restored.';
        //   }
        // }
      } else {
        await restorePreviousState(subscriptionData.stripe_data.subscription.id, trial_start, trial_end);
      }

      isTrialValid = utils.isTrialPeriodValid(updatedSubscription.trial_start, updatedSubscription.trial_end);
      remainingTime = utils.calculateRemainingTime(updatedSubscription.trial_end);

      data = {
        ...data,
        before: {
          is_trial_valid: isTrialValid0,
          remaining_time_text: utils.formatTimeRemaining(remainingTime0),
          remaining_time_seconds: remainingTime0 / 1000,
          remaining_time_milliseconds: remainingTime0
        },
        after: {
          is_trial_valid: isTrialValid,
          remaining_time_text: utils.formatTimeRemaining(remainingTime),
          remaining_time_seconds: remainingTime / 1000,
          remaining_time_milliseconds: remainingTime
        }
      };

      data.message = 'free trial period removed successfully.';
    } else {
      data.message = 'the subscription does not have a free trial period.';
    }
    
    const response = {
      statusCode: data.error ? 403 : 200,
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
