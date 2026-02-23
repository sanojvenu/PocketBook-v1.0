# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in PocketBook, please report it responsibly:

1. **Do NOT** open a public GitHub issue.
2. Email the maintainer at **mail@mypocketbook.in** with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within **48 hours** and aim to release a fix within **7 days** for critical issues.

## Security Best Practices for Contributors

- Never commit API keys, secrets, or credentials to the repository.
- Use environment variables (`.env.local`) for all sensitive configuration.
- Reference `.env.example` for the required variables.
- Ensure `google-services.json` and `keystore.properties` are never committed.

Thank you for helping keep PocketBook secure!
