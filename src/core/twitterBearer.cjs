/**
 * Twitter bearer token from the environment only.
 * Public downloads do not need it. When TWITTER_BEARER_TOKEN is missing or
 * blank, callers omit the Authorization header and a hint is logged.
 */

const MISSING_TWITTER_BEARER_HINT = 'TWITTER_BEARER_TOKEN is not set. Omitting the Twitter Authorization header. Public downloads do not need a bearer; set TWITTER_BEARER_TOKEN in the environment to send one.'

function readTwitterBearerToken(env = process.env) {
  const raw = env && env.TWITTER_BEARER_TOKEN
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null
  }
  return raw.trim()
}

function twitterAuthorizationHeader(env = process.env, log = console) {
  const token = readTwitterBearerToken(env)
  if (!token) {
    if (log && typeof log.warn === 'function') {
      log.warn(MISSING_TWITTER_BEARER_HINT)
    }
    return null
  }
  return `Bearer ${token}`
}

module.exports = {
  MISSING_TWITTER_BEARER_HINT,
  readTwitterBearerToken,
  twitterAuthorizationHeader
}
