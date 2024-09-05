import * as configEnv from "./config.mjs";
import { addMoreMinutes, createUserAndSendEmail, resetMinutes } from "./utils.mjs";
const stripeProductPrices = configEnv.stripeProductPrices;
const minutesToAdd90 = configEnv.minutesToAdd90;
const minutesToAdd200 = configEnv.minutesToAdd200;
const minutesToAdd400 = configEnv.minutesToAdd400;
const minutesToAdd700 = configEnv.minutesToAdd700;
// Private methods
async function createPaymentEvent(
  db,
  event_type,
  event_data,
  user_email = null,
  subscription_id = null
) {
  return db.query(
    "INSERT INTO payment_events (id, user_email, subscription_id, event_type, event_data, created_date) VALUES (nextval('payment_events_id_seq'::regclass), $1, $2, $3, $4, NOW()) RETURNING *",
    [user_email, subscription_id, event_type, event_data]
  );
}

async function createLicense(
  db,
  user_email,
  subscription_id,
  status,
  account_created,
  stripe_data,
  is_admin = false,
  free_account = false,
  price
) {
  subscription_id = free_account == true ? null : subscription_id;
  is_admin = free_account == true ? false : is_admin;
  return db.query(
    "INSERT INTO licenses (id, user_email, subscription_id, status, account_created, stripe_data, is_admin, free_account, created_date, price) VALUES (nextval('licenses_id_seq'::regclass), $1, $2, $3, $4, $5, $6, $7, NOW(), $8) RETURNING *",
    [
      user_email,
      subscription_id,
      status,
      account_created,
      stripe_data,
      is_admin,
      free_account,
      price,
    ]
  );
}

async function createSubscription(
  db,
  user_email,
  subscriptions_amount,
  stripe_data
) {
  return db.query(
    "INSERT INTO subscriptions (id, user_email, subscriptions_amount, stripe_data, created_date) VALUES (nextval('subscriptions_id_seq'::regclass), $1, $2, $3, NOW()) RETURNING *",
    [user_email, subscriptions_amount, stripe_data]
  );
}

async function updateSubscription(db, id, subscriptions_amount, stripe_data) {
  return db.query(
    "UPDATE subscriptions SET subscriptions_amount = $2, stripe_data = $3 WHERE id = $1 RETURNING *",
    [id, subscriptions_amount, stripe_data]
  );
}

async function getSubscription(db, stripeSubscriptionId) {
  return db.query(
    "SELECT * FROM subscriptions WHERE stripe_data->'subscription'->>'id' = $1",
    [stripeSubscriptionId]
  );
}

async function getLicenses(db, subscriptionId) {
  return db.query("SELECT * FROM licenses WHERE subscription_id = $1", [
    subscriptionId,
  ]);
}

async function deleteSubscription(db, id) {
  return db.query("DELETE FROM subscriptions WHERE id = $1", [id]);
}

async function getLicensesBySubscriptionId(db, subscriptionId, numLicenses) {
  let stringQuery =
    "SELECT * FROM licenses WHERE subscription_id = $1 AND is_admin = false ORDER BY created_date DESC";
  if (numLicenses == 0) {
    stringQuery =
      "SELECT * FROM licenses WHERE subscription_id = $1 ORDER BY created_date DESC";
  }
  return db.query(stringQuery, [subscriptionId]);
}

async function activateDeactivateLicenses(
  db,
  subscriptionId,
  numLicenses,
  deactivateAllLicenses
) {
  let affectedLicenses = 0;
  const licenses = await getLicensesBySubscriptionId(
    db,
    subscriptionId,
    numLicenses
  );

  const pendingScheduledDowngrades = await getPendingScheduledDowngrades(
    db,
    subscriptionId
  );

  console.log("pendingScheduledDowngrades", pendingScheduledDowngrades.rows);

  if (pendingScheduledDowngrades.rows.length > 0) {
    // If there are pending scheduled downgrades, we need to deactivate all licenses
    // and activate only the ones that are in the pending scheduled downgrades

    await db.query(
      "UPDATE licenses SET status = $1 WHERE subscription_id = $2 and is_admin = $3",
      [false, subscriptionId, false]
    );

    for (const scheduledDowngrade of pendingScheduledDowngrades.rows) {
      await db.query("UPDATE licenses SET status = $1 WHERE id = $2", [
        true,
        scheduledDowngrade.license_id,
      ]);
      await db.query(
        "UPDATE scheduled_downgrades SET completed = $1 WHERE id = $2",
        [true, scheduledDowngrade.id]
      );
    }
  } else {
    await db.query(
      "UPDATE licenses SET status = $1 WHERE subscription_id = $2",
      [!deactivateAllLicenses, subscriptionId]
    );

    if (
      !deactivateAllLicenses &&
      licenses.rows.length > 0 &&
      numLicenses <= licenses.rows.length
    ) {
      affectedLicenses = licenses.rows.slice(0, numLicenses);

      for (const license of affectedLicenses) {
        await db.query("UPDATE licenses SET status = $1 WHERE id = $2", [
          false,
          license.id,
        ]);
      }
    }
  }

  return affectedLicenses;
}

async function getPendingScheduledDowngrades(db, subscriptionId) {
  let stringQuery =
    "SELECT * FROM scheduled_downgrades WHERE subscription_id = $1 AND completed = false AND scheduled_date <= NOW() ORDER BY created_date DESC";
  return db.query(stringQuery, [subscriptionId]);
}

async function customerSubscriptionDeleted(db, subscriptionId) {
  return await deleteSubscription(db, subscriptionId);
}

async function updateUserPaidStatus(db, user_email, price_id) {
  const products = JSON.parse(stripeProductPrices);
  let id = 0;
  for (let i = 0; i < products.length; i++) {
    if (price_id === products[i].price) {
      id = products[i].id;
      break;
    }
  }
  console.log("id~~~", id);
  if (id === 6) {
    return null;
  } else {
    return db.query("UPDATE users SET paid_status = $1 WHERE email = $2", [
      id,
      user_email,
    ]);
  }
}

// Export methods
// invoice.payment_succeeded: This event is triggered when a payment for an invoice has succeeded.
export async function handleInvoicePaymentSucceeded(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  console.log(`1. ${event.type} - handleInvoicePaymentSucceeded`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Perform actions in your application, e.g., update order status or send a confirmation email to the customer.
}

// invoice.payment_failed: This event is triggered when a payment for an invoice has failed.
export async function handleInvoicePaymentFailed(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  console.log(`2. ${event.type} - handleInvoicePaymentFailed`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Handle the failed payment, e.g., notify the customer and take additional actions.
}

// checkout.session.completed: This event is triggered when a Checkout session has been successfully completed.
export async function handleCheckoutSessionCompleted(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  console.log('data~~~', data);
  
  const isSubscription = data.mode === "subscription";
  if (isSubscription) {
    const subscription = await stripe.subscriptions.retrieve(data.subscription);
    console.log("subscription~~~", subscription.items.data[0].plan.id);
    const price = subscription.items.data[0].plan.id;
    user_email = data.metadata.email;
    console.log("price~~~", price);
    console.log("user_email~~~", user_email);
    const stripe_data = {
      session: {
        id: data.id,
        currency: data.currency,
        payment_status: data.payment_status,
        mode: data.mode,
        status: data.status,
      },
      invoice: {
        id: data.invoice,
      },
      customer: {
        id: data.customer,
        name: data.customer_details.name,
        email: data.customer_details.email,
      },
      subscription: {
        id: subscription.id,
        quantity: subscription.quantity,
        status: subscription.status,
      },
    };

    const products = JSON.parse(stripeProductPrices);
    let id = 0;
    for (let i = 0; i < products.length; i++) {
      if (price === products[i].price) {
        id = products[i].id;
        break;
      }
    }
    console.log("id~~~~~~", id);
    if (id === 5) {
      const createdUser = await createUserAndSendEmail(db, user_email, id);
      console.log("createdUser~~~", createdUser);
    } else if (id === 4) {
      await addMoreMinutes(db, user_email, minutesToAdd700);
    } else if (id === 3) {
      await addMoreMinutes(db, user_email, minutesToAdd400);
    } else if (id === 2) {
      await addMoreMinutes(db, user_email, minutesToAdd200);
    }

    const createdSubscription = await createSubscription(
      db,
      user_email,
      subscription.quantity,
      stripe_data
    );
    subscription_id = createdSubscription.rows[0].id;
    const price_id = subscription.items.data[0].price.id;
    console.log("subscription_id~~~", subscription_id);
    console.log("price_id~~~", price_id);

    await updateUserPaidStatus(db, user_email, price_id);
    await createPaymentEvent(db, event.type, data, user_email, subscription_id);
    await createLicense(
      db,
      user_email,
      subscription_id,
      true,
      true,
      null,
      true,
      false,
      price
    );
  } else {
    console.log("it is payment event ~~~~~~~");
    // Handle one-time payment logic
    console.log("data~~~", data);

    const lineItems = await stripe.checkout.sessions.listLineItems(data.id, {
      limit: 1,
    });
    const price_id = lineItems.data[0].price.id;
    console.log("Fixed price~~~", price_id);

    user_email = data.metadata.email;

    console.log("User email:", user_email);

    // Process the one-time payment (e.g., create a license or update user status)
    const products = JSON.parse(stripeProductPrices);
    let id = 0;
    for (let i = 0; i < products.length; i++) {
      if (price_id === products[i].price) {
        id = products[i].id;
        break;
      }
    }
    console.log("Fixed Product ID:", id);
    if (id === 6) {
      // Handle other product IDs as needed
      console.log("succeeded to pay fixed price.");
      await addMoreMinutes(db, user_email, minutesToAdd90);
    }
  }
}

// customer.subscription.updated: This event is triggered when a customer's subscription is updated.
export async function handleCustomerSubscriptionUpdated(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  const subscription = (await getSubscription(db, data.id)).rows[0];
  const stripeSubscription = await stripe.subscriptions.retrieve(data.id);
  subscription.stripe_data.subscription.quantity = data.quantity;
  subscription.stripe_data.subscription.status = data.status;
  subscription.status =
    data.status === "trialing" || data.status === "active" ? true : false;
  user_email = user_email || subscription.user_email;
  subscription_id = subscription_id || subscription.id;
  await updateSubscription(
    db,
    subscription_id,
    data.quantity,
    subscription.stripe_data
  );
  let deactivateAllLicenses =
    data?.pause_collection !== null ? true : data.quantity == 0;
  if (stripeSubscription !== undefined) {
    const price_id = stripeSubscription.items.data[0].price.id;
    await updateUserPaidStatus(db, user_email, price_id);
  } else {
    // If the subscription is not found in Stripe, we need to deactivate all licenses as it we assume it was canceled
    deactivateAllLicenses = true;
    await updateUserPaidStatus(db, user_email, 0);
  }

  await activateDeactivateLicenses(
    db,
    subscription_id,
    !subscription.status ? 0 : data.quantity,
    deactivateAllLicenses
  );
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
}

// customer.subscription.deleted: This event is triggered when a customer's subscription is canceled.
export async function handleCustomerSubscriptionDeleted(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  const subscription = (await getSubscription(db, data.id)).rows[0];
  user_email = user_email || subscription.user_email;
  subscription_id = subscription_id || subscription.id;
  await resetMinutes(db, user_email);
  await customerSubscriptionDeleted(db, subscription_id);
  await updateUserPaidStatus(db, user_email, 0);
  await createPaymentEvent(db, event.type, data, null, null);
}

// payment_intent.succeeded: This event is triggered when a payment intent has succeeded.
export async function handlePaymentIntentSucceeded(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  console.log(`6. ${event.type} - handlePaymentIntentSucceeded`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Perform actions after a payment intent has succeeded.
}

export async function handleDefault(
  db,
  stripe,
  event,
  user_email = null,
  subscription_id = null
) {
  const data = event.data.object;
  console.log(`${event.type} - handleDefault`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
}
