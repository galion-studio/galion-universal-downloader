# Security policy

## Reporting a vulnerability

Email [contact@galion.studio](mailto:contact@galion.studio) with a description, the affected path, and steps to reproduce. Do not open a public GitHub issue that contains a live token, key, or other credential, and do not paste secret values into pull requests.

This repository does not offer a bounty. The report will be acknowledged, and a fix will be proposed in this repository. This policy does not change GitHub repository settings.

## Secrets

Do not commit API tokens, bearer tokens, private keys, or environment files that hold them.

`.gitignore` ignores environment files and key material:

- `.env` and `.env.*`, except `.env.example`, `.env.sample`, and `.env.template`
- `api-keys.json`, `secrets.json`, `credentials.json`, and service-account JSON
- `*.key`, `*.pem`, `*.p12`, `*.pfx`, `*.p8`, `*.jks`, `*.keystore`, and `*.kdbx`
- SSH private keys (`id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519` and their `.pub` files)
- `.runpod/`, where the local API key store writes `.key` and `api-keys.json`

Tokens used for authenticated requests are read from environment variables. `AuthManager.getAuthHeaders('twitter')` reads `TWITTER_BEARER_TOKEN` and throws an error that names that variable when it is missing or blank. Do not hardcode a bearer token or other credential in source.

The v3 downloader already loads `TWITTER_BEARER_TOKEN` from the environment (`v3-rebuild/app/config.py`) and attaches it only when the variable is set. Public tweet downloads do not require a bearer.

On 2026-11-14 the git history of this repository was rewritten to remove a Twitter bearer that had been committed. Treat any copy of that token outside this rewritten history as exposed and rotate it. This document does not include the token value.

## Secret scanning

GitHub Actions runs [gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1 on every push and pull request (`.github/workflows/gitleaks.yml`). The job scans the checkout with full git history and fails when it finds a leak. Secret text is redacted in the log.

## Scope

This policy covers the source tree of `galion-universal-downloader`. License terms are the MIT license in `LICENSE`.
