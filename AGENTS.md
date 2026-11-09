# AGENTS.md

## Package manager

- Use pnpm exclusively for dependency installation and project scripts.
- Do not create or use npm, Yarn, or Bun lockfiles.

## Neon backend

- Project: **posada-del-hechicero** (`aged-glitter-54886997`), AWS São Paulo.
- Use the installed Neon plugin and its `neon`, `neon-postgres` and `neon-auth` guidance.
- The CLI reads the gitignored `.neon` link. Credentials belong in `.env.local`; never print or commit them.
- `neon.ts` declares managed Neon Auth. Use pooled `DATABASE_URL` for the app and direct `DATABASE_URL_UNPOOLED` for migrations.
- Create a Neon branch for schema changes and test there before applying to production.
- Application tables use `pdh_`. The consolidated schema is `migrations/neon/20261109_pdh.sql`; earlier root migrations are historical InsForge migrations, not Neon setup scripts.
- SQL runs only on the server via `lib/db`. Public reads use the `pdh_reader` role and RLS; private writes require `requireAdmin` or an explicitly validated public submission flow.
- Neon Auth identities map to stable application UUIDs through `pdh_users`. Preserve those IDs and the foreign keys from administrators and tournaments. Only verified emails allowed by `PDH_ADMIN_EMAILS` may administer the site.
- ImageKit stores new images. Keep image URLs and `imagekit:<fileId>` keys together.
- SQL backups and `.migration/` contain private data and are gitignored.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
