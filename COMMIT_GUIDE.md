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
fix: resolve login authentication error
feat: add user profile picture upload
docs: update README with new installation instructions
refactor: simplify user authentication logic
```

```
feat: redesign user authentication system

BREAKING CHANGE: Completely restructured auth flow,
requires updating client-side login method
```
