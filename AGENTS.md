<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Specifications workflow

Use OpenSpec for new feature and behavior changes. Read `openspec/config.yaml`
and `openspec/README.md` before planning a change. Describe the proposal,
requirements/scenarios, design, and tasks under `openspec/changes/<name>/`;
implement the agreed change, verify it, then sync and archive it using OpenSpec.

`openspec/specs/` contains consolidated specifications produced by completed
changes. `.specs/` is preserved as legacy reference material, not the active
workflow. Check its claims against the code: some documents describe plans or
outdated behavior. Do not bulk-copy those claims into current specifications.
Write artifacts in pt-BR, keeping OpenSpec structural headings and SHALL/MUST
keywords in English.
