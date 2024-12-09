import pg from 'pg';
import axios from 'axios';
import * as configEnv from './config.mjs';

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
        body: JSON.stringify({ error: 'Authorization token not provided.' }),
      };
    }

    if (!configEnv.validateTokenExternalUrl) {
      return {
        statusCode: 500,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Could not resolve URL to validate token.' }),
      };
    }

    const response = await axios.post(configEnv.validateTokenExternalUrl, { jwtToken: authorizationToken });

    if (response.status === 200) {
      if (response.data.email !== '') {
        return { statusCode: response.status, headers: {}, body: { email: response.data.email } };
      }
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Unauthorized: Token is invalid or expired.' }),
      };
    } else {
      return {
        statusCode: 500,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Internal server error.' }),
      };
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ error: 'Unauthorized: Token is invalid or expired.' }),
      };
    }

    return {
      statusCode: 500,
      headers: configEnv.headers,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
}

export async function isRoot(email) {
  let _isRoot;
  try {
    const response = await axios.get(configEnv.rootLevelEmailUrl);

    if (response.status === 200) {
      _isRoot = response.data.emails.indexOf(email) !== -1 ? true : false;
    }
  } catch (error) {
    _isRoot = false;
  } finally {
    if (!email || (email && !_isRoot)) {
      return {
        statusCode: 401,
        headers: configEnv.headers,
        body: JSON.stringify({ email, error: 'You do not have permission for this resource.' }),
      };
    }
  }
}

export async function getTokenEmail(event) {
  const authorizationToken = event.headers && event.headers['authorization'].replace('Bearer ', '');;
  const responseData = await validateTokenExternal(authorizationToken)
  if (responseData.statusCode !== 200) {
    return responseData;
  }

  return responseData.body.email.toLowerCase();
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
