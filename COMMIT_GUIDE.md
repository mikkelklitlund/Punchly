# Conventional Commits Guide

## Commit Types and Version Impact

- `feat`: Adds a new feature (MINOR version)
- `fix`: Patches a bug (PATCH version)
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Test-related changes
- `chore`: Maintenance tasks

## Commit Message Format

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

## Example Commit Messages

```
feat(auth): implement OAuth login

Adds support for Google and Facebook authentication.
Integrates with existing user management system.

Closes #123
```

```
fix(payment): resolve stripe webhook parsing

Correctly handle edge cases in webhook events.
Improves error logging and tracking.

BREAKING CHANGE: Requires updated webhook endpoint configuration
```
