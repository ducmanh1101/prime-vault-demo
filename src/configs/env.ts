/**
 * Environment
 */
const getEnv = () => {
  switch (import.meta.env.VITE_ENV) {
    case "development":
      return "development";
    case "staging":
      return "staging";
    case "production":
      return "production";
    default:
      return "development";
  }
};
export type Env = "development" | "staging" | "production";
export const env: Env = getEnv();
