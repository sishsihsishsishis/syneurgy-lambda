import pg from 'pg';
import axios from 'axios';
import * as configEnv from './config.mjs';
import * as queryFunction from './query.mjs';

function parseData(data) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    return parsedData;
  } catch (error) {
    return data;
  }
}

export function parseAndCheckHttpError(data) {
  const parsedData = parseData(data);

  if (parsedData?.statusCode && parsedData?.statusCode >= 400) {
    const customError = new Error('Unknown error');
    customError.details = {
      statusCode: parsedData.statusCode,
      body: JSON.parse(parsedData.body),
    };
    
    throw customError;
  }

  return data;
}

async function validateTokenExternal(authorizationToken) {
  try {
    if (!authorizationToken) {
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ status: 'bad_request'.toUpperCase(), error: 'Authorization token not provided.' }),
      };
    }

    if (!configEnv.validateTokenExternalUrl) {
      return {
        statusCode: 500,
        headers: configEnv.headers,
        body: JSON.stringify({ status: 'no_defined_validate_token_url'.toUpperCase(), error: 'Could not resolve URL to validate token.' }),
      };
    }

    let messageError = '';
    const response = await axios.post(configEnv.validateTokenExternalUrl, { jwtToken: authorizationToken });

    switch (response?.data?.status) {
      case 'expired':
        messageError = 'Unauthorized: Token has expired.';
        break;
      case 'invalid':
        messageError = 'Unauthorized: Token is invalid.';
      break;
      default:
        messageError = `Unauthorized: Token ${response?.data?.status}.`;
        break;
    }

    if (response.status === 200) {
      if (response.data.email !== '') {
        return { statusCode: response.status, headers: {}, body: { status: response?.data?.status.toUpperCase(), email: response?.data?.email } };
      }
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ status: (response?.data?.status || 'invalid').toUpperCase(), error: messageError }),
      };
    } else {
      return {
        statusCode: 500,
        headers: configEnv.headers,
        body: JSON.stringify({ status: (response?.data?.status || 'invalid').toUpperCase(), error: messageError }),
      };
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ status: (response?.data?.status || 'invalid').toUpperCase(), error: 'Unauthorized: Token is invalid or expired.' }),
      };
    }

    return {
      statusCode: 500,
      headers: configEnv.headers,
      body: JSON.stringify({ status: (response?.data?.status || 'bad_request').toUpperCase(), error: 'Internal server error.' }),
    };
  }
}

export async function getTokenEmail(event) {
  const authorizationToken = event.headers && event.headers['authorization'].replace('Bearer ', '');;
  const responseData = await validateTokenExternal(authorizationToken)
  if (responseData.statusCode !== 200) {
    return responseData;
  }

  return responseData.body.email;
}

export async function getDBInstance() {
  const dbConfig = {
    user: configEnv.dbUser,
    host: configEnv.dbHost,
    database: configEnv.dbName,
    password: configEnv.dbPwd,
    port: configEnv.dbPort,
  };

  const client = new pg.Client(dbConfig);

  try {
    await client.connect();
  } catch (error) {
    console.error('Error connecting to the database:', error);

    return {
      statusCode: 500,
      headers: configEnv.headers,
      body: JSON.stringify({ error: 'Error connecting to the database.' }),
    };
  } finally {
    return client;
  }
}

export async function checkPaymentStatus(client, email, callback = undefined) {
  let statusCode = 403;
  let body = { status: undefined, message: undefined, error: undefined };
  try {
    const license = await queryFunction.licenses(
      client, 
      { command: 'get-license-by-user_email',
        filters: { user_email: email }
      }
    );
    const licenseData = license?.rows[0];

    if (licenseData) {
      if (licenseData.free_account === false) {
        // Check payment status
        if (licenseData.status === true) {
          statusCode = 200;
        }
        // Double-check payment status
        if (licenseData.is_admin === true) {
          const subscription = await queryFunction.subscriptions(
            client, 
            { command: 'get-subscription-by-id',
              filters: { id: licenseData.subscription_id }
            }
          );
          const subscriptionData = subscription?.rows[0];
          if (subscriptionData) {
            switch (subscriptionData?.stripe_data?.subscription?.status) {
              case 'trialing':
                statusCode = 200;
                body.status = 'success';
                body.message = 'The subscription is in a free trial period.'
                break;
              case 'active':
                statusCode = 200;
                body.status = 'success';
                body.message = 'The subscription is active, and payments are being processed normally.'
                break;
              case 'past_due':
                statusCode = 403;
                body.status = 'paywall';
                body.message = 'The subscription has a payment overdue, and Stripe will attempt to automatically recover the payment.'
                break;
              case 'unpaid':
                statusCode = 403;
                body.status = 'paywall';
                body.message = 'The subscription has not been paid and is no longer active. Stripe will attempt to automatically recover the payment.'
                break;
              case 'canceled':
                statusCode = 403;
                body.status = 'paywall';
                body.message = 'The subscription has been canceled, either manually by the customer or automatically after a payment failure.'
                break;
              case 'incomplete':
                statusCode = 403;
                body.status = 'paywall';
                body.message = 'The subscription is in an incomplete state, possibly due to incorrect configuration or pending customer action.'
                break;
              case 'incomplete_expired':
                statusCode = 403;
                body.status = 'paywall';
                body.message = 'An incomplete state subscription has expired and will not be completed.'
                break;
              default:
                statusCode = 403;
                body.status = 'unimplemented';
                body.error = 'Error unknown.'
                break;
            }
          } else {
            // No found
            statusCode = 404;
            body.status = 'not_found';
            body.error = 'Subscription not found.'
          }
        }
      } else {
        statusCode = 200;
        body.status = 'free_account';
      }
    } else {
      // No found
      statusCode = 404;
      body.status = 'not_found';
      body.error = 'License not found.'
    }
  } catch (error) {
    // Error unknown
    statusCode = 500;
    body.status = 'unknown';
    body.error = 'Internal Server Error.'
  } finally {
    body.status = body?.status?.toUpperCase() || undefined;
    let response = {
      statusCode,
      headers: configEnv.headers,
      body: JSON.stringify(body),
      // 'Location': callback,
    };

    // if (statusCode !== 303) {
    //   delete response['Location'];
    // }

    return response;
  }
}
