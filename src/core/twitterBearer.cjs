/**
 * Twitter bearer token from the environment only.
 * getAuthHeaders('twitter') calls this. A missing or blank value throws
 * so a placeholder cannot ship in source again.
 */

function readTwitterBearerToken(env = process.env) {
  const raw = env && env.TWITTER_BEARER_TOKEN
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      'TWITTER_BEARER_TOKEN is not set. Set the Twitter bearer token in the environment before requesting Twitter auth headers. Do not hardcode a bearer token in source.'
    )
  }
  return raw.trim()
}

function twitterAuthorizationHeader(env = process.env) {
  return `Bearer ${readTwitterBearerToken(env)}`
}

module.exports = {
  readTwitterBearerToken,
  twitterAuthorizationHeader
}
