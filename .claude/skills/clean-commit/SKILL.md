---
name: clean-commit
description: Atomic git commits, terse messages. Use when committing changes.
---

# Clean Commit

- One logical change per commit. Split unrelated. Stage by path.
- Format: `[bugfix|feature|config|docs](scope?): description`
- Subject only. No body. No co-author. No trailers. No comments in code.
- Imperative, lowercase, no period.

```
feature(auth): add refresh token rotation
bugfix(parser): handle empty input
config(hypr): bind super+q to close window
docs: describe stow layout
```
