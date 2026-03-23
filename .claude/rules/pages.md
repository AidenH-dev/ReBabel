---
globs: src/pages/**
---

Pages are orchestrators, not renderers. A page file should read like a table of contents: data fetching at the top, named component imports, and JSX that is mostly layout and composition.

When a section of a page grows beyond simple layout wiring -- conditional rendering trees, inline event handlers, form logic, computed display values -- extract it into a component. The page stays thin and scannable.

Good pattern (from this codebase): `pages/learn/academy/sets/study/[id].js` imports MasterSetHeader, MasterItemsManagement, MasterPracticeOptions and wires them with data.

Before adding UI logic to a page file, ask: should this be a component instead?
