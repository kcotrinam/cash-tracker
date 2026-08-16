import Joi from 'joi';

export interface AppConfiguration {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  corsOrigins: string[];
  jwtAccessSecret: string;
  accessTokenTtl: string;
  refreshTokenTtlDays: number;
  cookieDomain?: string;
}

export const configuration = (): AppConfiguration => ({
  nodeEnv: (process.env.NODE_ENV ?? 'development') as AppConfiguration['nodeEnv'],
  port: Number(process.env.API_PORT ?? 3001),
  corsOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
});

export function validateEnvironment(environment: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'test', 'production')
      .default('development'),
    API_PORT: Joi.number().port().default(3001),
    WEB_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
    DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    ACCESS_TOKEN_TTL: Joi.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(90).default(30),
    COOKIE_DOMAIN: Joi.string().optional().allow(''),
  }).unknown(true);
  const { error, value } = schema.validate(environment, { abortEarly: false });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  return value;
}
