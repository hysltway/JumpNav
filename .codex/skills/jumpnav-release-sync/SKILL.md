---
name: jumpnav-release-sync
description: Review the current JumpNav repository changes, summarize what changed, sync release documentation, bump the extension version with repo-specific semver rules, and create a detailed Chinese local git commit. Use when work in this repo is implementation-complete and Codex needs to finish the release-style wrap-up before a local commit.
---

# JumpNav Release Sync

Use this skill only inside the `chatgpt-nav-extension` repository. Treat it as the finalization workflow after code changes are already in place.

## Workflow

### 1. Inspect the real change set first

- Start with `git status --short` and `git diff --stat`.
- Read the actual modified files before writing release notes or bumping versions.
- Summarize the user-visible change in plain language. Distinguish between bug fix, feature addition, and large-scale architectural change.
- Do not guess from filenames alone.
- Do not revert unrelated user edits. Work with the existing dirty tree.

### 2. Apply JumpNav version rules

Use these release levels for this repository:

- Patch: small fixes, copy tweaks, visual polish, or low-risk behavior corrections with no new user-facing capability. Only bump the last segment, for example `3.5.0 -> 3.5.1`.
- Minor: added user-facing functionality, new settings, new supported interaction, or broader capability. Bump the middle segment and reset the patch, for example `3.5.0 -> 3.6.0`.
- Major: large-scale rewrites, framework migration, architecture refactor, or broad behavioral redesign. Bump the first segment and reset the rest, for example `3.5.0 -> 4.0.0`.

When uncertain, decide from user impact and code scope, then state the reasoning explicitly before editing version files.

### 3. Update the version source of truth

Sync the chosen version in these files:

- `package.json`
- `public/manifest.json`
- `README.md`
- `README_EN.md`

If the current task changed additional release-facing docs, update those too. Do not create extra documents unless they are already part of the repo workflow.

### 4. Sync the release documentation

- Update the current version string in both README files.
- Rewrite the "this release" section so it matches the real code changes instead of stale text.
- Update any feature bullets that became outdated because of the new behavior.
- Keep Chinese and English README content aligned in meaning, not necessarily word-for-word.

### 5. Validate before committing

- Run `npm run typecheck`.
- Run `npm run build` when the code, manifest, or version changed.
- If validation fails, fix the real issue before committing.
- Report any validation steps that could not be completed.

### 6. Commit locally with a detailed Chinese message

- Use a Conventional Commit header with a Chinese summary.
- The header should match the dominant change type, such as `feat: ...`, `fix: ...`, or `refactor: ...`.
- Add 3 to 5 Chinese bullet points in the commit body.
- The body should mention:
  - the actual feature or fix,
  - affected areas such as Prompt Library, locales, UI, or docs,
  - the version bump,
  - validation that was run.

## Guardrails

- Keep changes minimal and repository-native.
- Do not introduce extra release automation, changelog systems, or helper scripts unless the user explicitly asks for them.
- Do not skip the diff inspection step.
- Do not bump the version mechanically; justify the bump from the actual change set.
- Do not commit unrelated files.

## Expected Output

When using this skill successfully, produce:

1. A short summary of what changed in the code.
2. The chosen version bump and why it fits JumpNav's version rules.
3. The synced documentation and version files.
4. The validation result.
5. The completed local git commit hash and the full Chinese commit message.
