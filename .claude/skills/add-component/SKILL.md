---
name: add-component
description: Guide for adding a new React component to the ReBabel frontend. Covers tier selection, directory structure, naming, and reuse of existing patterns.
---

# Adding a New Component

## Before You Start

Search the existing codebase for components that already solve your problem:

- `src/components/ui/` -- shared primitives (Button, BaseModal, layouts, errors)
- `src/components/Set/Features/Field-Card-Session/shared/views/` -- study session views (TypedResponseView, MultipleChoiceView, SummaryView)
- `src/lib/study/` -- shared study utilities (answerValidation, mcOptionGeneration, itemEditing)

Do NOT create a new component if an existing one can be reused or extended with props.

## Tier Selection

**Tier 1 -- Flat** (1-4 files, no subdirs)
Use when: single-purpose component, no variants, no internal data models.
Examples: `blog/`, `Popups/`, `SetImport/`, `Sidebars/`

```
components/MyFeature/
  MyComponent.jsx
  HelperComponent.jsx
```

**Tier 2 -- Feature Directory** (5+ files, one level of subdirs)
Use when: self-contained feature with enough files to need organization. May have controllers/views/models.
Examples: `SetCreator/`, `SetViewer/`, `SRS/`, `Translate/`

```
components/MyFeature/
  Configuration/
    views/ConfigPanel.jsx
  Session/
    controllers/MasterSession.jsx
    views/ResultView.jsx
  utils/helpers.js
```

**Tier 3 -- Feature Hierarchy** (complex, multiple modes/variants sharing components)
Use when: feature has Public + Premium variants, or multiple modes (Quiz + SRS) sharing a base.
Examples: `Conjugation/` (Public/Premium/shared), `Set/Features/Field-Card-Session/` (Quiz/SRS/shared)

```
components/MyFeature/
  shared/
    models/config.js
    views/SharedView.jsx
    controllers/utils/validation.js
  VariantA/
    VariantAPanel.jsx
  VariantB/
    VariantBPanel.jsx
```

## Naming Conventions

- Directory: `PascalCase` (e.g., `SetViewer/`, not `set-viewer/`)
- Component files: `PascalCase.jsx` (e.g., `MasterSetHeader.jsx`)
- Utility/logic files: `camelCase.js` (e.g., `csvUtils.js`)
- Category subdirs: `lowercase` (`shared/`, `models/`, `views/`, `controllers/`, `utils/`)
- Extension: `.jsx` if file contains JSX, `.js` for pure logic

## Shared Utilities

Before writing utility logic inline, check these shared locations:

- `src/lib/study/answerValidation.js` -- Levenshtein distance, fuzzy matching, answer normalization
- `src/lib/study/mcOptionGeneration.js` -- multiple choice distractor generation, `shuffleArray`
- `src/lib/study/translationGeneration.js` -- quiz question generation
- `src/lib/study/itemTransform.js` -- item normalization
- `src/lib/study/itemEditing.js` -- buildEditableItem, toUpdateRequest, mergeIntoBaseItem
- `src/lib/setActions.js` -- markSetStudied and other shared set actions
- `src/components/ui/` -- Button, BaseModal, PageHeader, error components

## UI Patterns

- Loading: `TbLoader3` spinner (`animate-spin`) for full-page, `animate-pulse` skeleton for inline
- Modals: always use `BaseModal` from `@/components/ui/BaseModal`
- Buttons: use `Button` from `@/components/ui/Button` for styled buttons
- Errors: use `PageError`, `InlineError`, `ActionError`, `EmptyState` from `@/components/ui/errors`
- Layouts: `AuthenticatedLayout` for logged-in pages, `PublicLayout` for public pages
