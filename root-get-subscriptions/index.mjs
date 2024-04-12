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

    // Is Root
    utils.parseAndCheckHttpError(await utils.isRoot(email));
    
    const subscriptions = await queryFunction.subscriptions(
      client, 
      { command: 'get-subscription' }
    );

    if (!subscriptions?.rows?.length === 0) {
      return {
        statusCode: 404,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Subscriptions not found.' }),
      };
    }

    const showStripeMetadata = event.queryStringParameters && event.queryStringParameters.show_stripe_metadata;

    let responseBody = !subscriptions?.rows?.length === 0 ? undefined : [];

    for (const subscription of subscriptions?.rows) {
      let subscriptionData = subscription;
      let licensesData = undefined;
      let userEmailAdmin = undefined;
      const licenses = await queryFunction.licenses(
        client, 
        { command: 'get-license-by-subscription_id',
          filters: { subscription_id: subscriptionData.id }
        }
      );
      licensesData = licenses?.rows;
      userEmailAdmin = subscriptionData?.user_email;

      if (showStripeMetadata !== undefined && showStripeMetadata !== null && showStripeMetadata === 'true') {
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
      let pending_plan_change_date = null;
      if (subscriptionData?.stripe_data?.subscription?.id !== undefined && subscriptionData?.stripe_data?.subscription?.id !== null )
      {
        const stripeSubscriptionData = await stripeInstance.subscriptions.retrieve(subscriptionData?.stripe_data?.subscription?.id);
        
        if ( stripeSubscriptionData.schedule != null )
        {
          const subscriptionSchedule = await stripeInstance.subscriptionSchedules.retrieve(stripeSubscriptionData.schedule);
          
          if (subscriptionSchedule !== undefined && subscriptionSchedule != null) {
            
            const currPhase = subscriptionSchedule.current_phase;
            const phase1 = subscriptionSchedule.phases[(subscriptionSchedule.phases.length - 1)];
            
            // If currPhase.end_date = phase1.end_date, the product update has happened and we can schedule a new change
            pending_plan_change = currPhase.end_date != phase1.end_date;
            
            if (pending_plan_change)
            {
              const date = new Date(phase1.start_date * 1000);
              pending_plan_change_date = date.toISOString();
            }
          }
        }
      }
      if (responseBody) {
        responseBody.push({
          subscription: subscriptionData,
          licenses: licensesData,
          pending_plan_change: pending_plan_change,
          pending_plan_change_date: pending_plan_change_date,
          user_email_admin: userEmailAdmin,
        })
      }
    }

    const response = {
      statusCode: 200,
      headers: configEnv.headers,
      body: JSON.stringify({
        subscriptions: responseBody
      }),
    };

    return response;
  } catch (error) {
    console.log(error);
    return {
      statusCode: error?.details?.statusCode || 500,
      headers: configEnv.headers,
      body: JSON.stringify(error?.details?.body || { error: 'Internal Server Error.' }),
    };
  } finally {
    await client.end();
  }
};
