import 'dotenv/config';

export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || '';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '30min';
export const REFRESH_TOKEN_EXPIRY =
  process.env.REFRESH_TOKEN_EXPIRY || '30days';
export const METRICS_SERVER_PORT = process.env.METRICS_SERVER_PORT || 9100;
export const METRICS_SERVER_USERNAME =
  process.env.METRICS_SERVER_USERNAME || '';
export const METRICS_SERVER_PASSWORD =
  process.env.METRICS_SERVER_PASSWORD || '';
export const PORT = process.env.PORT || 3000;
export const WHITELISTED_DOMAINS = process.env.WHITELISTED_DOMAINS || '';
export const WHITELISTED_DOMAINS_ARRAY = WHITELISTED_DOMAINS.split(',') || [];

export const CORS_OPTIONS = {
  origin: WHITELISTED_DOMAINS_ARRAY,
  methods: 'GET,PUT,POST,DELETE',
  credentials: true,
};
