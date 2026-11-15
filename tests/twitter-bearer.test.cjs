/**
 * TWITTER_BEARER_TOKEN is read from the environment.
 * Public downloads keep working when it is missing: the Authorization header
 * is omitted and a hint is logged. The header is attached only when the
 * variable is set.
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const {
  MISSING_TWITTER_BEARER_HINT,
  readTwitterBearerToken,
  twitterAuthorizationHeader
} = require('../src/core/twitterBearer.cjs')

function capture(env) {
  const hints = []
  const log = {
    warn(message) {
      hints.push(message)
    }
  }
  const header = twitterAuthorizationHeader(env, log)
  return { header, hints }
}

assert.match(MISSING_TWITTER_BEARER_HINT, /TWITTER_BEARER_TOKEN is not set/)
assert.match(MISSING_TWITTER_BEARER_HINT, /Public downloads do not need a bearer/)

for (const env of [{}, { TWITTER_BEARER_TOKEN: '' }, { TWITTER_BEARER_TOKEN: '   ' }]) {
  assert.strictEqual(readTwitterBearerToken(env), null)
  const { header, hints } = capture(env)
  assert.strictEqual(header, null)
  assert.deepStrictEqual(hints, [MISSING_TWITTER_BEARER_HINT])
}

const present = capture({ TWITTER_BEARER_TOKEN: '  env-only-token  ' })
assert.strictEqual(readTwitterBearerToken({ TWITTER_BEARER_TOKEN: '  env-only-token  ' }), 'env-only-token')
assert.strictEqual(present.header, 'Bearer env-only-token')
assert.deepStrictEqual(present.hints, [])

const authPath = path.join(__dirname, '../src/core/AuthManager.js')
const source = fs.readFileSync(authPath, 'utf8')
assert.ok(!source.includes('Bearer REMOVED'), 'AuthManager must not keep the rewritten placeholder')
assert.ok(
  !/Authorization'\s*=\s*'Bearer /.test(source),
  'AuthManager must not assign a hardcoded Bearer literal'
)
assert.ok(source.includes('twitterAuthorizationHeader'))

const authModule = new Module(authPath)
authModule.filename = authPath
authModule.paths = Module._nodeModulePaths(path.dirname(authPath))
authModule._compile(source, authPath)

const { AuthManager } = authModule.exports
const manager = new AuthManager()
const previous = process.env.TWITTER_BEARER_TOKEN
const originalWarn = console.warn
const logged = []
console.warn = (message) => {
  logged.push(message)
}

try {
  delete process.env.TWITTER_BEARER_TOKEN
  const withoutToken = manager.getAuthHeaders('twitter')
  assert.strictEqual(withoutToken.Authorization, undefined)
  assert.ok(withoutToken['User-Agent'])
  assert.deepStrictEqual(logged, [MISSING_TWITTER_BEARER_HINT])

  const instagram = manager.getAuthHeaders('instagram')
  assert.strictEqual(instagram.Authorization, undefined)
  assert.strictEqual(instagram['X-IG-App-ID'], '936619743392459')

  logged.length = 0
  process.env.TWITTER_BEARER_TOKEN = 'env-only-token'
  const twitter = manager.getAuthHeaders('twitter')
  assert.strictEqual(twitter.Authorization, 'Bearer env-only-token')
  assert.deepStrictEqual(logged, [])
} finally {
  console.warn = originalWarn
  if (previous === undefined) {
    delete process.env.TWITTER_BEARER_TOKEN
  } else {
    process.env.TWITTER_BEARER_TOKEN = previous
  }
}

console.log('twitter bearer env checks passed')
