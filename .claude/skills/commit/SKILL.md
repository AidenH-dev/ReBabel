---
name: commit
description: Create a git commit following ReBabel's commit message conventions
disable-model-invocation: false
allowed-tools: Bash(git *)
---

Stage and commit changes using one of these required prefixes:

| Prefix        | Use for                                                 |
| ------------- | ------------------------------------------------------- |
| `feat`        | A new feature                                           |
| `fix`         | A bug fix                                               |
| `improvement` | Streamlines/improves an existing feature                |
| `refactor`    | Code change that neither fixes a bug nor adds a feature |
| `css`         | Page styling changes                                    |
| `chore`       | Routine maintenance (dependency updates, cleanup)       |
| `docs`        | Documentation only changes                              |
| `test`        | Adding or correcting tests                              |
| `perf`        | Performance improvements                                |
| `style`       | Whitespace, formatting, semicolons (no logic change)    |
| `auth`        | Authentication-related changes                          |
| `build`       | Build system or external dependency changes             |
| `seo`         | Site traffic / SEO improvements                         |
| `confi`       | Configuration file changes (VSCode, Prettier, etc.)     |
| `vuln`        | Security vulnerability patch                            |
| `development` | In-progress / WIP changes                               |
| `edit`        | General code change                                     |

**Format:** `<prefix>: <short description>`
**Example:** `feat: add anki deck import for vocabulary sets`

## Current git state

- Status: !`git status --short`
- Staged diff: !`git diff --staged`
- Unstaged diff: !`git diff`

## Steps

1. Review the git state above to understand what has changed
2. Stage relevant files — prefer specific file names over `git add -A`
3. Choose the most accurate prefix from the table above
4. Write a concise description in imperative mood
5. Commit: `git commit -m "<prefix>: <description>"`

## Rules

- Sentences should be brief and concise
- Never use "and" use & instead
- Never use `--no-verify` (do not skip the pre-commit hook)
- Never amend a previous commit unless explicitly asked
- Never commit `.env`, `.env.local`, or credential files
- Scope the staged files to only what was asked about — don't accidentally include unrelated changes
- Never add `Co-Authored-By` lines to commit messages
