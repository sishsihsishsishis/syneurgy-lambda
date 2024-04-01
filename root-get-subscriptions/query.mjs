export async function getSubscriptions(db, options = {}) {
  return db.query('SELECT * FROM subscriptions');
}

export async function getSubscription(db, options = {}) {
  const { id, user_email } = options;
  if (id !== undefined) {
    return db.query("SELECT * FROM subscriptions WHERE id = $1", [id]);
  }
  if (user_email !== undefined) {
    return db.query("SELECT * FROM subscriptions WHERE user_email = $1", [user_email]);
  }

  return undefined
}

export async function getLicenses(db, options = {}) {
  const { id, subscriptionId, status, user_email } = options;

  if (id !== undefined) {
    return db.query("SELECT * FROM licenses WHERE id = $1", [id]);
  }
  if (status !== undefined) {
    return db.query("SELECT * FROM licenses WHERE subscription_id = $1 AND status = $2", [subscriptionId, status]);
  }
  if (user_email !== undefined && subscriptionId !== undefined) {
    return db.query("SELECT * FROM licenses WHERE subscription_id = $1 AND user_email = $2", [subscriptionId, user_email]);
  }
  if (subscriptionId !== undefined) {
    return db.query("SELECT * FROM licenses WHERE subscription_id = $1", [subscriptionId]);
  }
  if (user_email !== undefined) {
    return db.query("SELECT * FROM licenses WHERE user_email = $1", [user_email]);
  }
  
  return undefined
}

export async function createLicense(db, user_email, subscription_id, status, account_created) {
  return db.query("INSERT INTO licenses (id, user_email, subscription_id, status, account_created, created_date) VALUES (nextval('licenses_id_seq'::regclass), $1, $2, $3, $4, NOW()) RETURNING *", [user_email, subscription_id, status, account_created]);
}

export async function updateLicense(db, id, subscriptionId, status) {
  return db.query("UPDATE licenses SET subscription_id = $2, status = $3, free_account = false WHERE id = $1 RETURNING *", [id, subscriptionId, status]);
}

export async function users(db, options = {}) {
  const { command, data, filters } = options;

  switch (command) {
    case 'get-users-by-id':
      return db.query("SELECT * FROM users WHERE id = $1", [filters.id]);
    case 'get-users-by-email':
      return db.query("SELECT * FROM users WHERE email = $1", [filters.email]);
  }
  return undefined;
}

export async function subscriptions(db, options = {}) {
  const { command, data, filters } = options;

  switch (command) {
    case 'get-subscription':
      return db.query("SELECT * FROM subscriptions");
    case 'get-subscription-by-id':
      return db.query("SELECT * FROM subscriptions WHERE id = $1", [filters.id]);
    case 'get-subscription-by-user_email':
      return db.query("SELECT * FROM subscriptions WHERE user_email = $1", [filters.user_email]);
  }
  return undefined;
}

export async function licenses(db, options = {}) {
  const { command, data, filters } = options;

  switch (command) {
    case 'create-license':
      return db.query("INSERT INTO licenses (id, user_email, subscription_id, status, account_created, free_account, created_date) VALUES (nextval('licenses_id_seq'::regclass), $1, $2, $3, $4, $5, NOW()) RETURNING *", [data.user_email, data.subscription_id, data.status, data.account_created, data.free_account]);
    case 'update-license':
      return db.query("UPDATE licenses SET subscription_id = $2, status = $3, free_account = $4 WHERE id = $1 RETURNING *", [data.id, data.subscription_id, data.status, data.free_account]);
    case 'get-license-by-user_email':
      return db.query("SELECT * FROM licenses WHERE user_email = $1", [filters.user_email]);
    case 'get-license-by-id':
      return db.query("SELECT * FROM licenses WHERE id = $1", [filters.id]);
    case 'get-license-by-user_email-and-is_admin':
      return db.query("SELECT * FROM licenses WHERE user_email = $1 AND is_admin = $2", [filters.user_email, filters.is_admin]);
    case 'get-license-by-subscription_id':
      return db.query("SELECT * FROM licenses WHERE subscription_id = $1", [filters.subscription_id]);
    case 'get-license-by-subscription_id-and-status':
      return db.query("SELECT * FROM licenses WHERE subscription_id = $1 AND status = $2", [filters.subscription_id, filters.status]);
    case 'get-license-by-subscription_id-and-status-no-id':
      return db.query("SELECT * FROM licenses WHERE subscription_id = $1 AND status = $2 AND id != $3", [filters.subscription_id, filters.status, filters.id]);
    case 'get-license-by-subscription_id-and-id':
      return db.query("SELECT * FROM licenses WHERE subscription_id = $1 AND id = $2", [filters.subscription_id, filters.id]);
    case 'update-license-status-and-id':
      return db.query("UPDATE licenses SET status = $2 WHERE id = $1 RETURNING *", [filters.id, data.status]);
    case 'get-license-by-id-and-is_admin':
      return db.query("SELECT * FROM licenses WHERE id = $1 AND is_admin = $2", [filters.id, filters.is_admin]);
    case 'get-license-by-id-and-is_admin-and-subscription_id':
      return db.query("SELECT * FROM licenses WHERE id = $1 AND subscription_id = $2 AND is_admin = $3", [filters.id, filters.subscription_id, filters.is_admin]);
    case 'get-license-by-user_email-and-is_admin-and-subscription_id':
      return db.query("SELECT * FROM licenses WHERE user_email = $1 AND subscription_id = $2 AND is_admin = $3", [filters.user_email, filters.subscription_id, filters.is_admin]);
    case 'get-license-by-user_email-and-is_admin-and-id':
      return db.query("SELECT * FROM licenses WHERE user_email = $1 AND id = $2 AND is_admin = $3", [filters.user_email, filters.id, filters.is_admin]);
    case 'delete-license-by-id':
      return db.query("DELETE FROM licenses WHERE id = $1 RETURNING *", [filters.id]);
  }
  return undefined;
}

export async function deleteLicense(db, options = {}) {
  const { id } = options;
  return db.query("DELETE FROM licenses WHERE id = $1 RETURNING *", [id]);
}

export async function activateOrAddFreeLicense(db, id, status, free_account) {
  return db.query("UPDATE licenses SET status = $2, free_account = $3 WHERE id = $1 RETURNING *", [id, status, free_account]);
}
