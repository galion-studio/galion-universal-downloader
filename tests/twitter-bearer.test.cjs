/**
 * TWITTER_BEARER_TOKEN must come from the environment.
 * Missing or blank values throw an error that names the variable.
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const {
  readTwitterBearerToken,
  twitterAuthorizationHeader
} = require('../src/core/twitterBearer.cjs')

function expectMissing(fn) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof Error)
    assert.match(error.message, /TWITTER_BEARER_TOKEN is not set/)
    assert.match(error.message, /environment/)
    return true
  })
}

expectMissing(() => readTwitterBearerToken({}))
expectMissing(() => readTwitterBearerToken({ TWITTER_BEARER_TOKEN: '' }))
expectMissing(() => readTwitterBearerToken({ TWITTER_BEARER_TOKEN: '   ' }))
expectMissing(() => twitterAuthorizationHeader({}))

assert.strictEqual(
  readTwitterBearerToken({ TWITTER_BEARER_TOKEN: '  env-only-token  ' }),
  'env-only-token'
)
assert.strictEqual(
  twitterAuthorizationHeader({ TWITTER_BEARER_TOKEN: 'env-only-token' }),
  'Bearer env-only-token'
)

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

try {
  delete process.env.TWITTER_BEARER_TOKEN
  expectMissing(() => manager.getAuthHeaders('twitter'))

  const instagram = manager.getAuthHeaders('instagram')
  assert.strictEqual(instagram.Authorization, undefined)
  assert.strictEqual(instagram['X-IG-App-ID'], '936619743392459')

  process.env.TWITTER_BEARER_TOKEN = 'env-only-token'
  const twitter = manager.getAuthHeaders('twitter')
  assert.strictEqual(twitter.Authorization, 'Bearer env-only-token')
  assert.ok(twitter['User-Agent'])
} finally {
  if (previous === undefined) {
    delete process.env.TWITTER_BEARER_TOKEN
  } else {
    process.env.TWITTER_BEARER_TOKEN = previous
  }
}

console.log('twitter bearer env checks passed')
