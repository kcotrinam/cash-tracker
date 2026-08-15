import Joi from 'joi';

export interface AppConfiguration {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  corsOrigins: string[];
}

export const configuration = (): AppConfiguration => ({
  nodeEnv: (process.env.NODE_ENV ?? 'development') as AppConfiguration['nodeEnv'],
  port: Number(process.env.PORT ?? 3001),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});

export function validateEnvironment(environment: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'test', 'production')
      .default('development'),
    PORT: Joi.number().port().default(3001),
    CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ['postgres', 'postgresql'] })
      .optional(),
  }).unknown(true);
  const { error, value } = schema.validate(environment, { abortEarly: false });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  return value;
}
