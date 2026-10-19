# CLAUDE.md

## Working Agreement

- Read `graphify-out/GRAPH_REPORT.md` first (if present), before new prompts.
- Terse responses; don't restate context back to user.
- No code comments unless the WHY is non-obvious.
- Short var names (`i`,`err`,`req`,`res`) > long descriptive ones — minimal but clear.
- After edits: `graphify update "<path>"` on changed paths.
- Prefer existing libs over reinventing. Priority: PrimeVue → Tailwind-composed → hand-rolled.

## Commits / Push

- No attributions — no names in the message.
- Follow Conventional Commits.
- Small commits, not combined.

## Note

- If you are unsure, please ask the user and never goes with yourself
- Playwright CLI is installed, and Claude in chrome install. use that to test it
- You can ask user to login with that playwright / claude in chrome to test it
- The user usually have the dev server and local running. so use that instead of running pnpm dev again
