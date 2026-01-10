// Environment configuration with validation

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvInProd(name: string, devDefault: string = ""): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return devDefault;
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  // Server
  port: parseInt(optionalEnv("PORT", "3000"), 10),
  host: optionalEnv("HOST", "localhost"),
  nodeEnv: optionalEnv("NODE_ENV", "development"),

  // Database
  databaseUrl: requireEnv("DATABASE_URL"),

  // GitHub OAuth (required in production, optional in dev)
  github: {
    clientId: requireEnvInProd("GITHUB_CLIENT_ID"),
    clientSecret: requireEnvInProd("GITHUB_CLIENT_SECRET"),
    callbackUrl: optionalEnv(
      "GITHUB_CALLBACK_URL",
      "http://localhost:3000/auth/github/callback",
    ),
    get isConfigured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  // Session
  sessionSecret: requireEnv("SESSION_SECRET"),

  // Badge signing
  badgeSecret: optionalEnv("BADGE_SECRET", "dev-badge-secret"),

  get isDev() {
    return this.nodeEnv === "development";
  },

  get isProd() {
    return this.nodeEnv === "production";
  },
} as const;
