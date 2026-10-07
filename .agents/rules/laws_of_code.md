# Laws of Code

## Law 1: Existing Systems Are Sacred

Existing systems are sacred.

Before modifying existing code, understand what the system currently does and preserve its behavior.

Do not remove, replace, simplify, refactor, or rewrite working systems unless explicitly instructed.

New features must be added around existing functionality whenever possible.

If a new feature conflicts with an existing system, resolve the conflict without silently breaking the existing system.

Do not remove existing functionality simply because it is not required for the current task.

Do not change existing controls, mechanics, visuals, data structures, map behavior, or gameplay rules unless explicitly instructed.

After every major change, verify that previously working functionality still works.

A feature is NOT complete if it works while breaking something that worked before.

### The Order of Priority:
**PRESERVE → EXTEND → TEST → IMPROVE**

### Never:
**REPLACE → BREAK → “FIX LATER”**

If uncertain, preserve the existing system.
