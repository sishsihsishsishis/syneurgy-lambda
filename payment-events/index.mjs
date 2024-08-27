// index.mjs

import pg from "pg";
import stripe from "stripe";
import * as webhook from "./events.mjs";
import * as configEnv from "./config.mjs";

const stripeInstance = stripe(configEnv.stripeSecretKey);
const endpointSecret = configEnv.stripeWebhookEndpointSecret;

export const handler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ error: "Missing request body." }),
    };
  }

  const requestBody = event.body;

  const dbConfig = {
    user: configEnv.dbUser,
    host: configEnv.dbHost,
    database: configEnv.dbName,
    password: configEnv.dbPwd,
    port: configEnv.dbPort,
  };

  const client = new pg.Client(dbConfig);
  const sig = event.headers["stripe-signature"];

  try {
    await client.connect();

    try {
      const event = stripeInstance.webhooks.constructEvent(
        requestBody,
        sig,
        endpointSecret
      );

      await webhook.handleStripeWebhook(client, stripeInstance, event);
    } catch (err) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
        },
        body: JSON.stringify({ error: `Webhook error: ${err.message}` }),
      };
    }

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: "ok",
    };

    return response;
  } catch (error) {
    console.error("Webhook Error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ error: "Webhook error." }),
    };
  } finally {
    await client.end();
  }
};
