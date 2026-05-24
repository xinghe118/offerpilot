export function isAuthRequired() {
  return process.env.AUTH_REQUIRED === "true";
}

export function hasOAuthProviderConfig() {
  return Boolean(
    (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) ||
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  );
}
