---
globs: src/components/**
---

Before creating a new component, search the existing codebase for components that already solve the problem. Reuse and extend existing components with props rather than creating new ones with different styling or patterns.

Existing shared components to check first:

- `ui/Button.jsx` -- 23 visual variants, covers most button needs
- `ui/BaseModal.jsx` -- standard modal with isOpen, onClose, title, size, footer
- `ui/AuthenticatedLayout.jsx` / `ui/PublicLayout.jsx` -- page layouts with sidebar selection
- `ui/errors/` -- PageError, InlineError, ActionError, EmptyState for error states
- `ui/PageHeader.jsx`, `ui/CustomSelect.jsx`, `ui/AnimatedCount.jsx` -- common UI primitives

For study session components:

- `Set/Features/Field-Card-Session/shared/views/` -- TypedResponseView, MultipleChoiceView, SummaryView, SessionStatHeaderView, ItemEditModal, ReviewView, KeyboardShortcutHint

Keep UI and UX consistent by using established patterns. When a design need isn't covered by existing components, extend an existing one before building from scratch. New visual patterns should be intentional, not accidental.
