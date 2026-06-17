# Take Three Deployment Notes

This fork contains the approved Take Three deployment patch for the Gortex web
UI. It is deployed as a developer-facing browser UI for the shared EKS-hosted
Gortex codegraph service.

## Runtime

- Public UI origin: `https://gortex.take3tech.dev`
- Backend API origin: same-origin `/v1/*` and `/v1/events`
- Gortex backend version: `v0.47.0`
- Indexed repositories: `takethree/loanmaps` and `takethree/infrastructure`
- Access boundary: Cloudflare Access Development Team policy
- MCP upstream boundary: `gortex.mcp.take3tech.dev` remains service-token-only

## Build

Use Node.js 22 for local and CI builds. The upstream package does not declare an
`engines` field, so the infrastructure workflow and Dockerfile pin the build
runtime instead.

```powershell
npm ci
$env:NEXT_PUBLIC_GORTEX_URL = "https://gortex.take3tech.dev"
npm run typecheck
npm run build
npm run check:browser-secrets
```

Production images are built from pinned commits in `takethree/gortex-web` with
`npm ci` and the checked-in lockfile. Runtime pods must not clone source code or
install application dependencies at startup.

## Credential Guardrail

Do not configure `NEXT_PUBLIC_GORTEX_TOKEN`, `CF-Access-Client-Id`,
`CF-Access-Client-Secret`, or equivalent backend bearer credentials for this UI.
The UI and API are intentionally same-origin behind Cloudflare Access, and the
browser must not receive service-token material.
