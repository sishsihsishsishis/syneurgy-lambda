// index.mjs

import pg from 'pg';
import stripe from "stripe";
import * as webhook from './events.mjs';

const stripeInstance = stripe("sk_test_51OWQU7Afx0x5xw4lYb2MXfpwPq1CnAu7K63gsMiEfkCHcfYSXeijBj92v83zuFbKlMuJ55VHyJd62M8VgeShDFqg00pRDjfSMg");
const endpointSecret = "whsec_qrl0RTxLsrXMYSdr2Cf00lyeS7VkEwol";

export const handler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Missing request body.' }),
    };
  }

  const requestBody = event.body;

  const dbConfig = {
    user: 'postgres',
    host: 'database-1.cf98jxsxxyfj.us-east-2.rds.amazonaws.com',
    database: 'testdb',
    password: 'CliFForD02116ClaVin(!)(#)',
    port: 5432,
  };
  
  const client = new pg.Client(dbConfig);
  const sig = event.headers['stripe-signature'];
  
  try {
    await client.connect();

    try {
      const event = stripeInstance.webhooks.constructEvent(requestBody, sig, endpointSecret);
      await webhook.handleStripeWebhook(client, stripeInstance, event);
    } catch (err) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Headers' : '*',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
        },
        body: JSON.stringify({ error: `Webhook error: ${err.message}` }),
      };
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: 'ok',
    };

    return response;
  } catch (error) {
    console.error('Webhook Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Webhook error.' }),
    };
  } finally {
    await client.end();
  }
};
