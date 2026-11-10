#!/usr/bin/env bash
# Design toolkit installer for Claude Code (user scope, idempotent).
#
# Installs: Impeccable, Anthropic frontend-design, Claude Design, 21st.dev
# (skills + MCP), Motion AI Kit (skill + MCP), Higgsfield (CLI + plugin + MCP).
# Versions are pinned so a re-run reproduces the audited setup; bump them on
# purpose after reviewing the new release.
#
# Writes only to: ~/.claude (skills, agents, plugins, settings hooks),
# ~/.claude.json (MCP entries) and the global npm prefix (Higgsfield CLI).
# Never writes secrets. 21st reads its key from $API_KEY_21ST at request time.
#
# Usage: bash docs/design-toolkit/setup-design-toolkit.sh

set -u
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1 DISABLE_TELEMETRY=1 DO_NOT_TRACK=1

IMPECCABLE_VERSION=4.8.2
SKILLS_CLI_VERSION=1.7.6
CLI_21ST_VERSION=1.18.0
MOTION_AI_VERSION=14.2.0
HIGGSFIELD_CLI_VERSION=1.2.2

ok=0; failed=()
step() {
  local name="$1"; shift
  echo "==> $name"
  if "$@"; then ok=$((ok + 1)); else failed+=("$name"); echo "!! $name failed"; fi
}

install_motion() {
  # motion-ai's CLI is interactive only, so call its own exported install
  # functions with the answers the prompts would get: global scope, Claude Code.
  local dir; dir="$(mktemp -d)" || return 1
  (
    cd "$dir" &&
    npm install --silent --no-audit --no-fund "motion-ai@${MOTION_AI_VERSION}" &&
    node --input-type=module -e '
      import { homedir } from "node:os";
      import { writeSkills, writeAgentExtras, configureMcp } from "motion-ai/dist/install.js";
      writeSkills(homedir(), [".claude"]);
      writeAgentExtras(homedir(), [".claude"]);
      const r = await configureMcp("global", [".claude"]);
      if (r.manual.length) { console.error(r.error || "MCP not configured"); process.exit(1); }
    '
  )
  local rc=$?; rm -rf "$dir"; return $rc
}

add_mcp() { # name url [header]
  claude mcp get "$1" >/dev/null 2>&1 && return 0
  if [ $# -ge 3 ]; then
    claude mcp add --transport http --scope user "$1" "$2" --header "$3"
  else
    claude mcp add --transport http --scope user "$1" "$2"
  fi
}

add_plugin() { # marketplace-repo plugin@marketplace
  claude plugin marketplace add "$1" >/dev/null 2>&1 || true
  claude plugin install "$2" --scope user
}

step "Higgsfield CLI"   npm install -g --silent --no-audit --no-fund "@higgsfield/cli@${HIGGSFIELD_CLI_VERSION}"
step "Impeccable"       npx -y "impeccable@${IMPECCABLE_VERSION}" install --global --providers=claude -y
step "Claude Design"    npx -y "skills@${SKILLS_CLI_VERSION}" add jiji262/claude-design-skill -g -a claude-code -y
step "21st skills"      npx -y "@21st-dev/cli@${CLI_21ST_VERSION}" skills install --global --agent claude
step "Motion AI Kit"    install_motion
step "frontend-design"  add_plugin anthropics/claude-plugins-official frontend-design@claude-plugins-official
step "Higgsfield skills" add_plugin higgsfield-ai/skills higgsfield@higgsfield
# The ${...:-proxy-injected} default is literal text for Claude Code to expand;
# locally, export API_KEY_21ST. In Claude Code cloud the proxy injects the key.
# shellcheck disable=SC2016
step "21st MCP"         add_mcp 21st https://21st.dev/api/mcp 'x-api-key: ${API_KEY_21ST:-proxy-injected}'
step "Higgsfield MCP"   add_mcp higgsfield https://mcp.higgsfield.ai/mcp

echo
echo "Design toolkit: $ok steps ok, ${#failed[@]} failed${failed:+: ${failed[*]}}"
# Never fail the caller (e.g. a cloud setup script) over one optional tool.
exit 0
