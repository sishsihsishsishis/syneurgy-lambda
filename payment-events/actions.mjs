// Private methods
async function createPaymentEvent(db, event_type, event_data, user_email = null, subscription_id = null) {
  return db.query("INSERT INTO payment_events (id, user_email, subscription_id, event_type, event_data, created_date) VALUES (nextval('payment_events_id_seq'::regclass), $1, $2, $3, $4, NOW()) RETURNING *", [user_email, subscription_id, event_type, event_data]);
}

async function createLicense(db, user_email, subscription_id, status, account_created, stripe_data, is_admin=false, free_account=false) {
  subscription_id = free_account == true ? null : subscription_id;
  is_admin = free_account == true ? false : is_admin;
  return db.query("INSERT INTO licenses (id, user_email, subscription_id, status, account_created, stripe_data, is_admin, free_account, created_date) VALUES (nextval('licenses_id_seq'::regclass), $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *", [user_email, subscription_id, status, account_created, stripe_data, is_admin, free_account]);
}

async function createSubscription(db, user_email, subscriptions_amount, stripe_data) {
  return db.query("INSERT INTO subscriptions (id, user_email, subscriptions_amount, stripe_data, created_date) VALUES (nextval('subscriptions_id_seq'::regclass), $1, $2, $3, NOW()) RETURNING *", [user_email, subscriptions_amount, stripe_data]);
}

async function updateSubscription(db, id, subscriptions_amount, stripe_data) {
  return db.query("UPDATE subscriptions SET subscriptions_amount = $2, stripe_data = $3 WHERE id = $1 RETURNING *", [id, subscriptions_amount, stripe_data]);
}

async function getSubscription(db, stripeSubscriptionId) {
  return db.query("SELECT * FROM subscriptions WHERE stripe_data->'subscription'->>'id' = $1", [stripeSubscriptionId]);
}

async function getLicenses(db, subscriptionId) {
  return db.query("SELECT * FROM licenses WHERE subscription_id = $1", [subscriptionId]);
}

async function deleteSubscription(db, id) {
  return db.query("DELETE FROM subscriptions WHERE id = $1", [id]);
}

async function getLicensesBySubscriptionId(db, subscriptionId, numLicenses) {
  let stringQuery = "SELECT * FROM licenses WHERE subscription_id = $1 AND is_admin = false ORDER BY created_date DESC";
  if (numLicenses == 0) {
    stringQuery = "SELECT * FROM licenses WHERE subscription_id = $1 ORDER BY created_date DESC";
  }
  return db.query(stringQuery, [subscriptionId]);
}

async function activateDeactivateLicenses(db, subscriptionId, numLicenses, deactivateAllLicenses) {
  let affectedLicenses = 0;
  const licenses = await getLicensesBySubscriptionId(db, subscriptionId, numLicenses);

  await db.query('UPDATE licenses SET status = $1 WHERE subscription_id = $2', [!deactivateAllLicenses, subscriptionId]);

  if (!deactivateAllLicenses && licenses.rows.length > 0 && numLicenses <= licenses.rows.length) {
    affectedLicenses = licenses.rows.slice(0, numLicenses);

    for (const license of affectedLicenses) {
      await db.query('UPDATE licenses SET status = $1 WHERE id = $2', [false, license.id]);
    }
  }
  
  return affectedLicenses;
}

async function customerSubscriptionDeleted(db, subscriptionId) {
  return await deleteSubscription(db, subscriptionId);
}

// Export methods
// invoice.payment_succeeded: This event is triggered when a payment for an invoice has succeeded.
export async function handleInvoicePaymentSucceeded(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  console.log(`1. ${event.type} - handleInvoicePaymentSucceeded`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Perform actions in your application, e.g., update order status or send a confirmation email to the customer.
}

// invoice.payment_failed: This event is triggered when a payment for an invoice has failed.
export async function handleInvoicePaymentFailed(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  console.log(`2. ${event.type} - handleInvoicePaymentFailed`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Handle the failed payment, e.g., notify the customer and take additional actions.
}

// checkout.session.completed: This event is triggered when a Checkout session has been successfully completed.
export async function handleCheckoutSessionCompleted(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  const subscription = await stripe.subscriptions.retrieve(data.subscription);
  user_email = data.metadata.email;
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
  }
  
  const createdSubscription = await createSubscription(db, user_email, subscription.quantity, stripe_data);
  subscription_id = createdSubscription.rows[0].id;
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  await createLicense(db, user_email, subscription_id, true, true, null, true, false);
}

// customer.subscription.updated: This event is triggered when a customer's subscription is updated.
export async function handleCustomerSubscriptionUpdated(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  const subscription = (await getSubscription(db, data.id)).rows[0];
  subscription.stripe_data.subscription.quantity = data.quantity;
  subscription.stripe_data.subscription.status = data.status;
  subscription.status = data.status === 'trialing' || data.status === 'active' ? true : false;
  user_email = user_email || subscription.user_email;
  subscription_id = subscription_id || subscription.id;
  await updateSubscription(db, subscription_id, data.quantity, subscription.stripe_data);
  const deactivateAllLicenses = data?.pause_collection !== null ? true : data.quantity == 0;
  await activateDeactivateLicenses(db, subscription_id, !subscription.status ? 0 : data.quantity, deactivateAllLicenses);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
}

// customer.subscription.deleted: This event is triggered when a customer's subscription is canceled.
export async function handleCustomerSubscriptionDeleted(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  const subscription = (await getSubscription(db, data.id)).rows[0];
  user_email = user_email || subscription.user_email;
  subscription_id = subscription_id || subscription.id;
  await customerSubscriptionDeleted(db, subscription_id);
  await createPaymentEvent(db, event.type, data, null, null);
}

// payment_intent.succeeded: This event is triggered when a payment intent has succeeded.
export async function handlePaymentIntentSucceeded(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  console.log(`6. ${event.type} - handlePaymentIntentSucceeded`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
  // Perform actions after a payment intent has succeeded.
}

export async function handleDefault(db, stripe, event, user_email = null, subscription_id = null) {
  const data = event.data.object;
  console.log(`${event.type} - handleDefault`);
  await createPaymentEvent(db, event.type, data, user_email, subscription_id);
}
