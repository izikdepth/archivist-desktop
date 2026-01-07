# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to security@basedmint.org (replace with your actual security contact)
2. **GitHub Security Advisories**: Use the [Security tab](../../security/advisories/new) to report privately

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., remote code execution, path traversal, XSS)
- Full paths of source files related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability and how it might be exploited

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the vulnerability and determine its severity
3. **Updates**: We will keep you informed of our progress
4. **Fix & Disclosure**: Once fixed, we will coordinate disclosure with you
5. **Credit**: With your permission, we will credit you in our release notes

## Security Best Practices for Users

### Verifying Downloads

All official releases are:
- Published on the [GitHub Releases](../../releases) page
- Signed with our Tauri update key (pubkey in `src-tauri/tauri.conf.json`)

### Sidecar Binary Verification

The archivist-node sidecar binary is downloaded from the official durability-labs/archivist-node repository. The download script includes SHA256 checksum verification.

### Network Security

- The archivist-node API binds to `127.0.0.1` (localhost only) by default
- P2P connections use libp2p with encrypted channels
- No external API calls except for update checks to GitHub

## Security Architecture

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Archivist Desktop                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  React Frontend │────│     Tauri Rust Backend          │ │
│  │  (Webview)      │IPC │     (Native Process)            │ │
│  └─────────────────┘    └──────────────┬──────────────────┘ │
│                                        │ HTTP (localhost)   │
│                         ┌──────────────▼──────────────────┐ │
│                         │   archivist-node Sidecar        │ │
│                         │   (Separate Process)            │ │
│                         └──────────────┬──────────────────┘ │
│                                        │ P2P (encrypted)    │
└────────────────────────────────────────┼────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   External Peers    │
                              │   (libp2p network)  │
                              └─────────────────────┘
```

### Security Controls

| Layer | Control |
|-------|---------|
| Frontend | Content Security Policy (CSP), React XSS prevention |
| IPC | Tauri command allowlist, capability-based permissions |
| Backend | Input validation, path sanitization, error handling |
| Sidecar | Process isolation, localhost-only binding |
| Network | TLS for GitHub API, libp2p encryption for P2P |

## Known Limitations

- The application requires the archivist-node sidecar which is downloaded at build/install time
- CSP includes `unsafe-inline` for styles (required by some UI frameworks)
- File system access is scoped by Tauri capabilities but users should be cautious about watched folders

## Acknowledgments

We thank the following individuals for responsibly disclosing security issues:

*No security issues have been reported yet.*
