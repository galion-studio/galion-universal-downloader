# Purge plan: committed `.runpod/.key` (do not execute)

Date of survey: 2026-11-15.

Repository: `galion-studio/galion-universal-downloader`.

This file is a plan. It is not permission to run it. Rewriting history, force-pushing, deleting pull-request refs, contacting GitHub Support, or deleting the backup all wait for an explicit yes from Maciej Grajczyk. Nothing in this document was executed.

Do not print the key. Do not paste it into a ticket, a commit, or a chat. Commands below check that a path exists. They do not show file contents. `git show <commit>:.runpod/.key` and `git cat-file -p <blob>` print the secret. Do not run those.

## Treat the key as compromised

The committed file is the local encryption key for this downloader's API-key store.

`src/core/ApiKeyManager.js` writes it at `.runpod/.key` in `getOrCreateEncryptionKey()`. The generator is `crypto.randomBytes(32).toString('hex')`. Every tainted commit found below points at one blob, and that blob is 64 bytes, which is that format. In those commits the directory `.runpod/` contains only `.runpod/.key`. No fetched commit contains `api-keys.json`.

Service to rotate: this app's local API-key encryption key (`ApiKeyManager`). Discard every copy of the committed key and create a new `.runpod/.key` outside git. Re-encrypt any `api-keys.json` that was encrypted with the old key. If that file holds platform tokens, rotate those tokens at the platform that issued them. This survey did not find `api-keys.json` in git, so it cannot name those platforms.

RunPod did not issue this file. A RunPod account API key, if one exists separately, is a different secret and is not what these commits contain. Opening a RunPod revocation for these 64 bytes will not invalidate them.

Do this rotation before any history rewrite. GitHub Support only purges sensitive data when they decide that rotating the credential is not enough. Rotation does not delete the git objects. The bytes stay readable through the pull-request refs below until those refs are removed and GitHub garbage-collects them.

## Where the file still is

Path: `.runpod/.key`.

Current branch tips do not contain it. On 2026-11-15 these refs were fetched and the path is absent from every commit reachable from them. `tidy/galion-hygiene-20261114` has moved since the row below: this plan is a later commit on that branch, and the commit does not add `.runpod/.key`. The row is the surveyed tip, `fe63f18a2f9af1c45a4b31929709e57a7f810896`, which is still an ancestor.

| Ref | Tip | Role |
| --- | --- | --- |
| `main` | `1b69422deb9c2c1e64e48b4940b2d1e076aa1494` | rewritten history, root `b952cc3f4007da763eec32ab8be1770653be2eb9` |
| `tidy/galion-hygiene-20261114` at survey (`refs/pull/3/head` then) | `fe63f18a2f9af1c45a4b31929709e57a7f810896` | draft pull request 3, before this plan |
| `refs/pull/3/merge` | `73f40414bc38fc168fb28f4979a2ffaf58d1839b` | GitHub's test merge of pull request 3, before this update |
| `cursor/drop-hardcoded-twitter-bearer-2ed9` (`refs/pull/4/head`) | `2b19dc31aba45452ef188aebe5fbe8cc2f457340` | closed pull request 4 |
| `cursor/gitleaks-secret-scan-9c0c` (`refs/pull/5/head`) | `95eb7d8001dc0142ea2d4e10028bfd69fa5eaaf6` | closed pull request 5 |

There were no tags. `git ls-remote origin 'refs/pull/*'` did not advertise `refs/pull/1/merge` or `refs/pull/2/merge`.

The path is still in the pre-rewrite history. That history is a different root from `main`. It is reachable from two frozen pull-request refs:

- Pull request **1** (closed draft), `refs/pull/1/head` = `abde1736ccbf7855a61fbe380cbb175aa7e61b90`. This tip deletes `.runpod/.key` (the diff stat is one deleted file). The file is not in this commit. It is in every ancestor listed below, and this ref is what keeps those ancestors reachable.
- Pull request **2** (closed draft), `refs/pull/2/head` = `d52346ec8ff03b503f34728f4247fe33a4a71343`. This tip still has `.runpod/.key` in its tree.

The branch names have since moved. `tidy/galion-hygiene-20261114` now points at pull request 3, not at `abde1736`. `cursor/drop-hardcoded-twitter-bearer-2ed9` now points at pull request 4 (`2b19dc31`), not at `d52346ec`. Moving a branch does not move `refs/pull/*/head`.

These 26 commits have `.runpod/.key` in the tree. The same blob is in all of them. Oldest commit first. "PRs" means which `refs/pull/*/head` can reach that commit.

| Commit | PRs | Subject |
| --- | --- | --- |
| `8b18b129a95ede807c141c24b2b4757bdf67e3d2` | 1, 2 | feat: Add cognitive engine, search capabilities, and neural-net analytics - Implement CognitiveEngine with semantic knowledge graph - Add search/filter for API Keys configuration - Implement usage analytics with time decay - Add show top 3 with expand pattern - Create beautiful GitHub README - Galion v3 design system integration (introducing commit, no parent) |
| `1bd57e82fd810cfe1091b6f6f94a957660e9f659` | 1, 2 | docs: Add comprehensive v2.0 roadmap - React + shadcn/ui migration plan |
| `f11a4fc642f5336d84316444583f84436967c27e` | 1, 2 | feat: Galion Universal Downloader v2.0 🚀 |
| `54b1ab22610936bb93b7c512c070108814eb571a` | 1, 2 | docs: Update GitHub URLs and prepare for release |
| `58157927bd901070fd9904718f6e1029f8a35dc3` | 1, 2 | feat: Add GitHub Pages demo with ecosystem integrations |
| `4b48faefcb8b5aaae1b6d86328d8e2a170529fab` | 1, 2 | docs: Add live demo link and ecosystem branding to README |
| `211926c0c39f51b7c825583905e1a60f96a15d26` | 1, 2 | docs: Add comprehensive Docusaurus documentation |
| `e268c6e418a1c98a25edb6111fac53eeb1097437` | 1, 2 | docs: Add comprehensive agent handoff summary with TODO list |
| `476a015ea77e5900fdad9c62dd730ddb5f07c9d9` | 1, 2 | feat: Phase 1 & 2 - Galion shield logo + awesome animations |
| `e7fec2f8402799c0fab9d5e50c31a09ceab7046b` | 1, 2 | docs: Update all documentation with freedom manifesto and open source philosophy |
| `15aaeaff263ec206a0258172d661497d50072545` | 1, 2 | fix: Logo path now works with Vite base URL |
| `ce35c17348dffd3b136eeb1692fdedc2b8f08f34` | 1, 2 | Add Hugging Face Spaces deployment configuration |
| `0e1b4681d753468caf5c2561c6dc1a952a49d986` | 1, 2 | feat: v2.1.0 - Whisper transcription, API search, Downloads to user folder |
| `e6eb054f334210ef2ed5b7d14bc73fd9bd15667e` | 1, 2 | fix: Knowledge Graph now connects to real API |
| `d871e255c491b3919f3582000b6fd21ff2fb5449` | 1, 2 | Fix download path to C:\Users\Downloads\Galion + Add API key flow for 18+ content |
| `b5eb543f9129b960fb602f082e98350e2ad8a56c` | 1, 2 | 📚 Update all documentation with 36+ platforms, API docs, and open-source info |
| `747b314ee3fef6e6de99e798e8792e6865b80c32` | 1, 2 | 🎨 Fix logo - remove old vite.svg, use text-based header in README |
| `0b85a5cab311432acf5965abda660e7d9691c110` | 1, 2 | 🎨 Add official Galion logo - updated all favicons and app icons |
| `46c9d3d3b21cf5273df9fd7ccfbf30dfb1221f0e` | 1, 2 | 🖼️ Use official B&W Galion logo (3) for GitHub |
| `f9e819496cd3baa52c47c2bc53182048368e926a` | 1, 2 | 🎨 Add logo with rounded borders to all documentation |
| `9e89b03deeceac3bfabc3cf590a628fcdf00e7ce` | 1, 2 | 🏴‍☠️ Pirate theme branding + Adaptive Scraping Engine - README with Freedom Manifesto - Frontend pirate navigation (Plunder, Log, Navigator, Helm) - AdaptiveScrapingEngine for auto-fallback scraping - Updated taglines and ecosystem docs - CivitAI article download fix with regex patterns |
| `d4ba3868c4530dff99bb5336d49b69b8058adf20` | 1, 2 | Update README and YoutubePlatform |
| `1c068742989534867054025abc3ff59aa86ab9ff` | 1, 2 | 📚 Comprehensive documentation overhaul - modern, fun, developer-friendly |
| `6c938865638fff02287e6ddd5e3c8d9e438a9b5a` | 1, 2 | Add browser download feature and fix download pipeline |
| `7680a710d8c577f09dbd91d1604495f33a92c05f` | 1, 2 | 🚀 Complete v3 rebuild - Python/FastAPI for RunPod GPU deployment |
| `d52346ec8ff03b503f34728f4247fe33a4a71343` | 2 | Stop embedding a Twitter bearer token in AuthManager. |

Pull request 1's tip, `abde1736ccbf7855a61fbe380cbb175aa7e61b90`, is not in that table. Its tree does not contain the path. Its parent is `7680a710d8c577f09dbd91d1604495f33a92c05f`, which does.

No other path for this file showed up in the survey. A later rename would need its own `--path`. This plan only covers `.runpod/.key`.

## Why a force-push cannot remove `refs/pull/*`

`refs/pull/<number>/head` and `refs/pull/<number>/merge` are GitHub's internal refs. GitHub creates them and moves them when a pull request changes. The repository owner cannot update or delete them.

`git push --force` and `git push --force --mirror` are rejected for every ref under `refs/pull/`. GitHub's own removal guide says to keep pushing until the only failures are those refs, then contact Support. Closing pull requests 1 and 2 did not delete `refs/pull/1/head` or `refs/pull/2/head`. They are still the old commits above.

A force-push of `main` and the other branches also does not touch this leak. Those branches already point at the rewritten history, which does not contain the path. Force-pushing them, today, would either do nothing or discard newer work. It would leave `abde1736` and `d52346ec` in place.

Cached views are separate from branch tips. GitHub can still serve a commit by its SHA, and can still show the old pull-request diffs, after every branch has moved. Support is what removes those views and then runs garbage collection. Until that happens the blob remains reachable.

## Exact `git filter-repo` sequence

Do not run this sequence unless Maciej Grajczyk has explicitly said yes after the rotation above.

Use `git-filter-repo` 2.47 or newer. That is the first release with `--sensitive-data-removal`. Install it from the `newren/git-filter-repo` release or from the operating-system package. Do not install it by copying the secret into a script.

Work in a fresh clone. `--sensitive-data-removal` fetches every ref from `origin`, including `refs/pull/*`, and will discard unpushed local commits.

```bash
# 1. Offline backup. This mirror contains the key. Do not push it anywhere.
git clone --mirror https://github.com/galion-studio/galion-universal-downloader.git \
  galion-universal-downloader.backup-YYYYMMDDTHHMMSSZ.git

# 2. A second clone, not the backup, is the one that gets rewritten.
git clone https://github.com/galion-studio/galion-universal-downloader.git \
  galion-universal-downloader-rewrite
cd galion-universal-downloader-rewrite

# 3. Drop the path from every ref the fetch can see.
#    Do not use --replace-text. That flag needs a copy of the secret.
git filter-repo --sensitive-data-removal --invert-paths --path .runpod/.key

# 4. Stop if the path is still mentioned. This prints names, not contents.
git log --all --name-status -- .runpod/.key

# 5. Save the two facts Support asks for.
#    First Changed Commit(s): the NOTE line printed by filter-repo.
#    Affected pull-request heads:
grep '^refs/pull/.*/head$' .git/filter-repo/changed-refs
```

The survey predicts that the grep lists `refs/pull/1/head` and `refs/pull/2/head`, and that the first changed commit is `8b18b129a95ede807c141c24b2b4757bdf67e3d2`. Paste the tool's output, not this prediction, if they differ. This repository had no `.gitattributes` and no Git LFS objects in the survey, so an "LFS Objects Orphaned" note is not expected. If the tool prints one, follow it and attach the file it names. Do not invent that note.

Publishing the rewrite is a force-push. It is part of the plan and it is not authorized by this file.

```bash
# 6. Only after the explicit yes. Rejected refs/pull/* lines are expected.
git push --force --mirror origin
```

Repeat that push until the only rejections are `refs/pull/*`. If some other ref is rejected, stop. A protected branch is the usual cause. Do not turn protection off as part of this plan. As of the survey, no protected-branch update is required to drop `.runpod/.key` from branch history, because the branches do not contain it.

`git filter-repo` rewrites a commit when the path is in it, and it also rewrites later commits whose parent hash changed. Pull request 1's tip does not contain the file, but its parent does, so `refs/pull/1/head` still changes locally. GitHub will refuse the update. The remote ref stays on `abde1736ccbf7855a61fbe380cbb175aa7e61b90`.

## GitHub Support request

After step 6, and only if Maciej has said yes to this step too, open a request from the GitHub Support portal:

https://support.github.com/contact

The documentation for what they do next is:

https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

Give them:

- Repository: `galion-studio/galion-universal-downloader`
- The number of affected pull requests, counted from `.git/filter-repo/changed-refs` (expected: 2, pull requests 1 and 2)
- The `NOTE: First Changed Commit(s)` line from the filter-repo output
- The LFS note only if the tool printed one

Ask them to dereference or delete the affected pull-request refs and to garbage-collect the orphaned objects, including cached views of those SHAs. Dereferencing can keep the pull-request conversation and drop the historical diffs. Deleting a pull request removes the conversation, the reviews, and the diffs. Pull requests 1 and 2 are closed drafts. This plan does not inventory their comments. Maciej should choose dereference or deletion knowing that deletion is not reversible from git.

Say that the credential is the local `ApiKeyManager` encryption key at `.runpod/.key`, that it has to be treated as compromised, and that rotation does not remove the objects still reachable from `refs/pull/1/head` and `refs/pull/2/head`. Do not attach the key. Support can refuse if they decide rotation is enough. That refusal leaves the bytes on GitHub.

## Forks

On 2026-11-15 the repository API reported `forks_count: 0`, and the forks list was empty. There is no fork owner to write to from that survey. GitHub does not rewrite forks and does not give out fork owners' contact details.

A fork created from the pre-rewrite history still has the blob. A fork created from current `main` does not, unless that fork also fetched `refs/pull/1` or `refs/pull/2`. Anyone who cloned before the rewrite, or who fetched those pull refs, has a local copy. This plan cannot list those people. They have to delete the clone. A `git pull` and `git push` from an old clone will merge the tainted history back in.

If a fork appears before the purge is finished, stop and tell that owner to delete the fork or to drop the old history. This repository's force-push cannot do it for them.

## Backup and rollback

Step 1 is the backup: a mirror clone taken before `git filter-repo`, stored offline, and never pushed to a public remote. The backup contains the key. That is why it stays offline.

Rollback before step 6: delete the rewrite clone. GitHub has not changed. The backup is unused.

Rollback after step 6, if a branch tip moved and the rewrite is wrong: from the backup mirror, force-push only that branch back to the backup's SHA. On the survey date the branch tips do not contain `.runpod/.key`, so putting those tips back does not put the file onto `main`. If a later branch commit did contain the path, restoring that branch publishes the key again. Do not restore a tainted branch tip unless that is the intended outcome.

`refs/pull/*` cannot be rolled back with `git push` either. GitHub rejects those updates in both directions. Once Support dereferences or deletes pull requests 1 and 2, git cannot put those refs back. The offline mirror is the only remaining copy of the old objects, and it is also a copy of the key.

Delete the backup only when Maciej says it is no longer needed. That should be after the new encryption key is in use, after any tokens that were encrypted with the old key have been rotated, and after he accepts that GitHub no longer serves the old commits. Deleting the backup is not part of this survey and is not authorized by this file.
