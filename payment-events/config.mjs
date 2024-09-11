export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
  "Access-Control-Allow-Credentials": true,
};

export const dbHost = process.env.DB_HOST;
export const dbUser = process.env.DB_USER;
export const dbName = process.env.DB_NAME;
export const dbPwd = process.env.DB_PWD;
export const dbPort = parseInt(process.env.DB_PORT, 10) || 5432;
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripeProductPrices = process.env.STRIPE_PRODUCT_PRICES;
export const stripeWebhookEndpointSecret =
  process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
export const postmarkToken = process.env.POSTMARK_TOKEN;
export const fromEmail = process.env.FROM_EMAIL;
export const frontendBaseUrl = process.env.FRONTEND_BASE_URL;
export const confirmEmailID = process.env.POSTMARK_CONFIRM_EMAIL_ID;
export const funnelAccountMinutes = process.env.FUNNEL_ACCOUNT_MINUTES; // 120
export const minutesToAdd90 = process.env.MINUTES_TO_ADD_90; // 90
export const minutesToAdd200 = process.env.MINUTES_TO_ADD_200; // 200
export const minutesToAdd400 = process.env.MINUTES_TO_ADD_400; // 400
export const minutesToAdd700 = process.env.MINUTES_TO_ADD_700; // 700