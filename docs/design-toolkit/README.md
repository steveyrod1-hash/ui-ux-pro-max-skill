# Design toolkit for Claude Code

Six design and development tools installed into Claude Code at user scope, plus
the workflow that coordinates them. Verified on 2026-11-10 with Claude Code
2.1.321, Node 22.23.4 and Ubuntu 24.04.

- [`setup-design-toolkit.sh`](setup-design-toolkit.sh): idempotent, version-pinned installer. Tested from an empty `$HOME`: 9 of 9 steps passed, and a second run changed nothing.
- [`demo/`](demo/): a small working site built with this workflow.

## What is installed

| Tool | Version | Entry points | Auth | Status |
|---|---|---|---|---|
| **Impeccable** | npm `impeccable` 4.8.2, engine 0.1.21 | Skill `/impeccable` (24 sub-commands: `audit`, `critique`, `polish`, `typeset`, `layout`, `adapt`, `animate`…); 4 agents (`impeccable-*`); design-check hooks on Edit/Write and Stop; CLI `~/.claude/skills/impeccable/scripts/impeccable detect <file\|url>` | None | **Verified.** Found 9 of 9 planted anti-patterns in a test page and audited the demo. |
| **frontend-design** (Anthropic) | 1.1.1 from `claude-plugins-official` | Skill `frontend-design:frontend-design` (loads automatically for UI work) | None | **Verified.** Plugin validated, enabled, and registered in a new session. |
| **Claude Design** | `jiji262/claude-design-skill` @ 35a20e5 | Skill `claude-design` | None | **Verified.** Registered, and byte-identical to the reviewed source. |
| **21st.dev** | CLI `@21st-dev/cli` 1.18.0; MCP server `21st` 0.1.1 | MCP `21st` (51 tools: `search`, `get_component`, `search_logo`, `get_inspiration`…); skills `21st-cli-use`, `21st-ui-explore`, `21st-ui-build`, `21st-ui-review`, `21st-ai`, `21st-registry`, `21st-design-sync`, `21st-video`; CLI `npx @21st-dev/cli` | API key (`x-api-key`) | **Verified.** `claude mcp list` shows Connected, and a component search returned results. Free tier: 2 code retrievals per day, and 21st AI generation is off. |
| **Motion AI Kit** | `motion-ai` 14.2.0 | Skill `motion` (best practices, CSS springs, performance audit, transition editor); agent `motion-reviewer`; MCP `motion` (`search-motion-docs`, `insert-motion-component`); MCP `motion-plus` | `motion`: none. `motion-plus`: OAuth, Motion+ (paid) | **Verified** for `motion`, which returned a docs search. `motion-plus` needs a Motion+ sign-in. |
| **Higgsfield** | CLI `@higgsfield/cli` 1.2.2; plugin `higgsfield` 0.14.0 | 9 skills (`higgsfield:higgsfield-generate`, `-brandkit`, `-product-photoshoot`, `-websites`, `-youtube-thumbnail`, `-video-explainer`, `-faceless-video`, `-soul-id`, `-marketplace-cards`); MCP `higgsfield`; CLI `higgsfield` (alias `hf`) | OAuth (browser login), paid credits | **Installed, not authenticated.** The MCP endpoint is reachable and returns its OAuth challenge. No generations were run. |

## Outstanding steps (yours)

1. **Higgsfield login.** The CLI uses a browser OAuth flow with a `localhost` callback, so it cannot finish inside a cloud session. On your own machine, run `bash docs/design-toolkit/setup-design-toolkit.sh`, then:
   - `higgsfield auth login`, then `higgsfield workspace set <workspace_id>`
   - In Claude Code, open `/mcp`, select `higgsfield`, and choose **Authenticate**.
   - Check your balance before generating anything: `higgsfield account`. To price a job without running it: `higgsfield generate cost <model> ...`.
2. **Motion+ (optional, paid).** In Claude Code, open `/mcp`, select `motion-plus`, and choose **Authenticate**. Without it, the free `motion` server and skill still work.
3. **21st.dev outside the cloud.** Get a key at https://21st.dev/settings/api-keys, then `export API_KEY_21ST=...` in your shell profile. Run `npx @21st-dev/cli login` for the CLI. (In Claude Code cloud, the key is a saved network secret and the proxy injects it.)
4. **Impeccable project context.** In each new project, run `/impeccable init` once. It writes the project's `PRODUCT.md` / `DESIGN.md`, which the audits use. The engine sends anonymous usage telemetry; turn it off with `impeccable telemetry off`.

## How the tools work together

Pick tools by task. Most jobs need two or three of them, not all six.

```
 brief ─▶ 1 DIRECTION ─▶ 2 BUILD ─▶ 3 COMPONENTS ─▶ 4 MOTION ─▶ 5 ASSETS ─▶ 6 AUDIT
          claude-design   frontend-   21st (only if   motion       higgsfield   impeccable
          (or 21st-ui-    design      the stack is    skill + MCP  (only with   (hooks run on
          explore)                    React/shadcn)                approval)    every edit)
```

| Stage | Owner | Use it when | Skip it when |
|---|---|---|---|
| Direction and design system | **claude-design** | The brief is open: landing pages, prototypes, brand exploration, decks. It proposes 3 directions and commits to a token system. | The project already has a `DESIGN.md` or design tokens. Follow those instead. |
| Production code | **frontend-design** | Writing the actual UI. Its plan → review → build → critique loop keeps the result specific to the brief. | Never. It is the default for any UI code. |
| Components | **21st** (`21st-cli-use`, MCP `search` / `get_component`) | The stack is React + Tailwind/shadcn and you need a well-solved pattern (data table, command menu, date picker). | Plain HTML, Vue, Svelte or native stacks, or when the component is the page's signature element. Hand-build that one. |
| Motion | **motion** skill + `motion` MCP | Page transitions, scroll-linked effects, gestures, springs. Search the MCP docs before writing animation code. | Simple hover/focus states. Plain CSS transitions are enough. |
| Media | **higgsfield** | You need real imagery (product shots, hero video, brand kit) **and have approved the credit cost**. | By default. Use type, colour, SVG and CSS first. |
| Audit and polish | **impeccable** | Always. Its hooks run on every UI edit. Before you finish, run `/impeccable audit`, then `/impeccable polish`. | Never. |

**Avoiding overlap.** Several skills cover the same ground. Use one owner per job:

- **Review:** Impeccable owns it. Use `21st-ui-review` only for 21st-specific checks.
- **Building UI:** frontend-design owns it. `21st-ui-build` is for grounding a build in 21st inspiration.
- **Exploring directions:** claude-design owns it. `21st-ui-explore` is the alternative when you want catalogue-grounded variants.
- **Animation:** the Motion skill owns all animation code. This repo's own `ui-ux-pro-max --domain gsap` presets are for projects that already use GSAP. Don't load Motion and GSAP in the same project.
- **Dependencies:** install `motion` and any 21st components as project dependencies. Nothing here requires a global npm package except the Higgsfield CLI.

## Invocation cheat sheet

```text
/claude-design            explore directions, build a hi-fi HTML prototype
/frontend-design          (auto) distinctive production UI
/impeccable init|audit|critique|polish|typeset|layout|adapt|animate|harden
/motion                   Motion best practices, springs, perf audit
/21st-cli-use             search/install 21st components
/higgsfield:higgsfield-generate   image/video generation (needs auth and credits)
```

```bash
~/.claude/skills/impeccable/scripts/impeccable detect http://localhost:5173   # rendered-page audit
npx @21st-dev/cli search "command menu" --type c --limit 5
npx @21st-dev/cli usage                                                     # quota check, free
higgsfield model list && higgsfield generate cost <model> --prompt "..."    # price before spending
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --design-system       # this repo's data
```

## Master prompt for future sites

Paste this into a new session and replace the brackets:

```text
Build [SITE] for [AUDIENCE]. Its main job: [ONE SENTENCE]. Stack: [e.g. Next.js + Tailwind / plain HTML].
Real content: [paste copy, data, brand assets, or "draft it from the brief"].

Work as a senior design studio would, using the installed toolkit with one owner per job:
1. Direction: unless DESIGN.md exists, use claude-design to propose 3 distinct directions
   rooted in the subject's own world (materials, vernacular, artefacts). Wait for my pick.
   Then write the token system: 4-6 named colours, 1-2 typefaces with roles and a scale,
   a layout concept with ASCII wireframes, and 3 principles.
2. Build: follow frontend-design. Review the plan against the generic AI defaults before
   writing code. Put the boldness in ONE element and keep everything else quiet.
3. Components: if the stack is React/shadcn, search 21st for solved patterns (tables, menus,
   pickers). Adapt them to the tokens. Never paste them in unstyled.
4. Motion: search the Motion MCP docs first. Allow one orchestrated load moment, plus motion
   that answers user actions. Honour prefers-reduced-motion. Animate only transform and opacity.
5. Media: do NOT call Higgsfield unless I approve a specific job and its quoted credit cost.
6. Audit: fix every Impeccable hook finding. Run `impeccable detect` on the running page,
   then /impeccable audit and /impeccable polish. Screenshot at 390px and 1440px and critique them.

Quality floor: WCAG AA contrast, visible focus, keyboard reachable, 44px touch targets,
no horizontal scroll at 320px, line length under ~75ch, no layout shift, fonts with fallbacks.
Avoid: identical card grids, gradient text, purple/cyan AI palettes, ALL-CAPS eyebrows,
01/02/03 markers on content that isn't a sequence, fade-up on every section, filler copy.
Finish with: what you built, the audit results, and anything you could not verify.
```

## Demo

[`demo/`](demo/) is a page for a fictional rock-pooling club. It needs no build step, API or paid service:

```bash
cd docs/design-toolkit/demo && python3 -m http.server 8000   # open http://localhost:8000
```

How it used the toolkit:

- **frontend-design.** Planned before coding: palette (sea-glass, deep-water ink, kelp, sandstone, buoy orange used only for the low-water marker), Newsreader + Atkinson Hyperlegible, and one bold element.
- **ui-ux-pro-max** (this repo). Typography search shortlisted Newsreader.
- **Motion** 14.6.0, vendored in `demo/vendor/` (MIT), with APIs checked against the Motion MCP docs:
  - On load, the tide curve draws itself once.
  - Choosing a day morphs the curve and the low-water marker, so the motion answers your click.
  - `press()` gives the day buttons tactile feedback.
  - `scroll()` lowers the sea over the shore diagram as you read down the zones.
  - Reduced motion turns off all of it and shows the final state.
- **Impeccable.** The hooks flagged grey text on a coloured background, which was fixed. The rendered-page audit ends with 0 anti-patterns.
- **Tests.** Playwright checks at 1440px and 390px: no console errors, no horizontal overflow, day switching works, and the reduced-motion path works.
- **Not used.** No 21st components (the demo is plain HTML, not React) and no Higgsfield media (no paid generation was approved).
- **Not yet checked.** Tide figures come from a simple harmonic model and are labelled as sample data. The mobile layout hasn't been tested on a physical phone.
