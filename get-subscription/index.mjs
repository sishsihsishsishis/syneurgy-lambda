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

    // client = utils.parseAndCheckHttpError(await utils.getDBInstance());

    // Get token email (current user)
    const email = utils.parseAndCheckHttpError(await utils.getTokenEmail(event));

    let result = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email: email }
      }
    );

    const licenseData = result.rows[0];

    if (!licenseData) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'License not found.' }),
      };
    }

    const subscription = licenseData.is_admin === true ? 
      await queryFunction.subscriptions(
        client, 
        { command: 'get-subscription-by-id',
          filters: { id: licenseData.subscription_id }
        }
      ) : undefined;
    let subscriptionData = subscription?.rows[0];

    if (licenseData.is_admin === true && !subscriptionData) {
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Subscription not found.' }),
      };
    }

    let licensesData = undefined;
    let userEmailAdmin = undefined;
    if (licenseData.is_admin == true) {
      const licenses = await queryFunction.licenses(
        client, 
        { command: 'get-license-by-subscription_id',
          filters: { subscription_id: subscriptionData.id }
        }
      );
      licensesData = licenses?.rows;

      if (!licensesData) {
        return {
          statusCode: 400,
          headers: configEnv.headers,
          body: JSON.stringify({ error: 'Licenses not found.' }),
        };
      }
    } else {
      subscriptionData = undefined;
      licensesData = [licenseData];
      userEmailAdmin = subscriptionData?.user_email;
    }

    const showStripeMetadata = event.queryStringParameters && event.queryStringParameters.show_stripe_metadata;

    if (licenseData.is_admin === true && showStripeMetadata !== undefined && showStripeMetadata !== null && showStripeMetadata === 'true') {
      subscriptionData.stripe_data.session = subscriptionData?.stripe_data?.session?.id !== undefined && subscriptionData?.stripe_data?.session?.id !== null ?
        { ...await stripeInstance.checkout.sessions.retrieve(subscriptionData?.stripe_data?.session?.id) } : subscriptionData.stripe_data.session;
      subscriptionData.stripe_data.subscription = subscriptionData?.stripe_data?.subscription?.id !== undefined && subscriptionData?.stripe_data?.subscription?.id !== null ?
        { ...await stripeInstance.subscriptions.retrieve(subscriptionData?.stripe_data?.subscription?.id) } : subscriptionData.stripe_data.subscription;
      subscriptionData.stripe_data.invoice = subscriptionData?.stripe_data?.invoice?.id !== undefined && subscriptionData?.stripe_data?.invoice?.id !== null ?
      { ...await stripeInstance.invoices.retrieve(subscriptionData?.stripe_data?.invoice?.id) } : subscriptionData.stripe_data.invoice;
      subscriptionData.stripe_data.customer = subscriptionData?.stripe_data?.customer?.id !== undefined && subscriptionData?.stripe_data?.customer?.id !== null ?
      { ...await stripeInstance.customers.retrieve(subscriptionData?.stripe_data?.customer?.id) } : subscriptionData.stripe_data.customer;
    }

    let pending_plan_change = false;
    if (subscriptionData?.stripe_data?.subscription?.id !== undefined && subscriptionData?.stripe_data?.subscription?.id !== null )
    {
      const stripeSubscriptionData = await stripeInstance.subscriptions.retrieve(subscriptionData?.stripe_data?.subscription?.id);
      
      if ( stripeSubscriptionData.schedule != null )
      {
        const subscriptionSchedule = await stripeInstance.subscriptionSchedules.retrieve(stripeSubscriptionData.schedule);
        
        if (subscriptionSchedule !== undefined && subscriptionSchedule != null) {
          
          const currPhase = subscriptionSchedule.current_phase;
          const phase1 = subscriptionSchedule.phases[1];
          
          // If currPhase.end_date = phase1.end_date, the product update has happened and we can schedule a new change
          pending_plan_change = currPhase.end_date != phase1.end_date;
        }
      }
    }
    
    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        subscription: subscriptionData,
        licenses: licensesData,
        pending_plan_change: pending_plan_change,
        user_email_admin: userEmailAdmin,
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
