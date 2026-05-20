# Git Branch & Merge Request Workflow

**IMPORTANT:** Follow this workflow for every implementation task (features, fixes, refactors).

## Before Starting Any Implementation

1. **Create a feature branch** from `nex-dev-sg` (the main branch):
   ```bash
   git checkout nex-dev-sg && git pull
   git checkout -b <branch-name>
   ```

2. **Branch naming convention:**
   - Feature: `feat/<short-kebab-slug>` (e.g. `feat/menu-search-component`)
   - Bug fix: `fix/<short-kebab-slug>` (e.g. `fix/header-layout-overflow`)
   - Refactor: `refactor/<short-kebab-slug>`
   - Chore/docs: `chore/<short-kebab-slug>`

3. **Skip branch creation only if:**
   - User is already on a feature branch (not `nex-dev-sg`)
   - User explicitly says "work on current branch" or "don't create a branch"

## After Finishing Implementation

After commits are made on the feature branch, create a Merge Request into `nex-dev-sg`:

```bash
git push -u origin <branch-name>
git mr create --target-branch nex-dev-sg --title "<title>" --description "<description>"
```

Or use `glab` (GitLab CLI) since this is a GitLab repo:
```bash
glab mr create --target-branch nex-dev-sg --title "<title>" --fill
```

Or use `git push` with `-o merge_request.create` GitLab option:
```bash
git push -u origin <branch-name> \
  -o merge_request.create \
  -o merge_request.target=nex-dev-sg \
  -o "merge_request.title=<title>"
```

**MR title format:** Same as the main commit message (conventional commit style).

## Summary

| Step | Action |
|------|--------|
| Before coding | `git checkout -b feat/<slug>` from `nex-dev-sg` |
| After coding | Commit → push → create MR → target `nex-dev-sg` |
