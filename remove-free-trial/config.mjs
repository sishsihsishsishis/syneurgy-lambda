export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
  'Access-Control-Allow-Credentials': true,
};
export const rootLevelEmailUrl = process.env.ROOT_LEVEL_EMAIL_URL;
export const validateTokenExternalUrl = process.env.VALIDATE_TOKEN_EXTERNAL_URL;
export const dbHost = process.env.DB_HOST;
export const dbUser = process.env.DB_USER;
export const dbName = process.env.DB_NAME;
export const dbPwd = process.env.DB_PWD;
export const dbPort = parseInt(process.env.DB_PORT, 10) || 5432;
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
