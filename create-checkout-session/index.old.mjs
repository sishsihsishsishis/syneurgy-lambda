// index.mjs

import pg from 'pg';
import stripe from "stripe";

const stripeInstance = stripe("sk_test_51OUhzLIWaeZ8PDgTT3vm7uTwCDTOiCSmeXcRArgNLva48lnXGUBiuvFQ9yMEL81ri4ckm9ul6RuIbiNzMpXhxIFr003xqGjRAS");

export const handler = async (event) => {
  let session
  const email = event.queryStringParameters && event.queryStringParameters.email;
  const callbackSuccess = event.queryStringParameters && event.queryStringParameters.callback_success;
  const callbackFailure = event.queryStringParameters && event.queryStringParameters.callback_failure;
  console.log('')
  if (!email) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Missing email parameter.' }),
    };
  }

  if (!callbackSuccess) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Missing callback_success parameter.' }),
    };
  }

  if (!callbackFailure) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Missing callback_failure parameter.' }),
    };
  }
  
  const dbConfig = {
    user: 'postgres',
    host: 'database-1.cf98jxsxxyfj.us-east-2.rds.amazonaws.com',
    database: 'testdb',
    password: 'CliFForD02116ClaVin(!)(#)',
    port: 5432,
  };
  
  const client = new pg.Client(dbConfig);
  
  try {
    await client.connect();

    let result = await client.query('SELECT * FROM licenses WHERE user_email = $1', [email]);
    const licenseData = result.rows[0];

    if (licenseData) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Headers' : '*',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
        },
        body: JSON.stringify({ error: 'You already have a license, if there is any inconsistency with your license please contact your administrator or license provider.' }),
      };
    }

    session = await stripeInstance.checkout.sessions.create({
      line_items: [
        {
          price: "price_1OZAtTAfx0x5xw4lkQqhVDIB",
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
        trial_period_days: 5,
      },
      metadata: {
        email
      },
    });

    const response = {
      statusCode: 303,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        Location: session.url,
      },
      body: '',
    };

    return response;
  } catch (error) {
    console.error('Error connecting to the database or stripe processing:', error, 'email:', email, 'stripe-session:', session);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers' : '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ error: 'Error connecting to the database or stripe processing.' }),
    };
  } finally {
    await client.end();
  }
};
