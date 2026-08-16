# CashTracker Design Handoff

This directory contains the approved visual references and UX requirements for
the CashTracker web application.

## Product direction

CashTracker is a personal finance application for independent professionals.

The interface should feel:

- Minimal
- Precise
- Quiet
- Personal
- Trustworthy

It must not resemble a corporate banking platform or a traditional accounting
dashboard.

The product is mobile-first and Spanish-first.

## Visual direction

The visual system is called Quiet Capital.

Core characteristics:

- Dark, restrained surfaces
- Clear information hierarchy
- Geist typography
- Subtle borders instead of decorative shadows
- Limited use of semantic color
- Comfortable spacing
- Accessible contrast
- Consistent behavior across mobile and desktop

Avoid:

- Gradients
- Glassmorphism
- Neon effects
- Excessive cards
- Excessive rounded containers
- Decorative financial imagery
- Generic fintech patterns
- Color as the only indicator of meaning
- Dense desktop tables scaled down to mobile

## Source-of-truth priority

When references conflict, use this order:

1. Confirmed product and UX rules in this directory
2. Approved screenshots listed in `screen-map.md`
3. Design tokens implemented in `apps/web/src/styles/tokens.css`
4. Exported Stitch HTML and CSS
5. Existing implementation

Stitch HTML and CSS are structural references. They must not be copied directly
into production components.

If two approved screenshots conflict, stop and document the conflict before
choosing a behavior.

## Reference status

Only references marked `Approved` in `screen-map.md` are implementation
requirements.

References marked `Draft` may be inspected but must not override approved
screens.

Deprecated references should be removed or moved to an archive outside the
active reference directory.

## Responsive targets

Primary reference viewports:

- Mobile: 390px wide
- Desktop: 1440px wide

Implementation rules:

- Build mobile first.
- Mobile and desktop must share one design system.
- Responsive behavior should adapt composition, not simply scale the desktop UI.
- Avoid horizontal overflow.
- Respect mobile safe areas.
- Do not truncate essential navigation labels.
- Touch targets must be at least 44px by 44px.

## Authentication UX

The initial authentication experience supports:

- Email and password login
- Registration
- Session restoration
- Logout
- Invalid credential errors
- Loading state
- Expired session state

The initial version does not support:

- Google Sign-In
- Passkeys
- Password recovery
- Invitation-only access
- A functional “Remember me” preference

Do not show unavailable authentication options.

Authentication errors must:

- Preserve the submitted email
- Never reveal whether an email exists
- Keep passwords private
- Appear close to the relevant form or action
- Use text or icons in addition to color

## Login responsive behavior

Desktop:

- Use a two-column composition.
- The left region contains brand context and one product preview.
- The right region contains the login form.
- Keep the form between approximately 340px and 400px wide.

Mobile:

- Remove the promotional panel.
- Preserve the CashTracker identity.
- Prioritize the login form.
- Keep the primary action visible on common phone heights.
- Do not shrink the desktop composition into a narrow viewport.

## Accessibility requirements

- Meet WCAG AA contrast.
- Use visible labels above form fields.
- Use visible keyboard focus states.
- Use semantic HTML controls.
- Support full keyboard navigation.
- Keep mobile input text at least 16px.
- Keep controls at least 44px high, preferably 48px.
- Give icon buttons accessible names.
- Respect reduced-motion preferences.

## Implementation workflow

Before implementing a screen:

1. Read this document.
2. Find the route and state in `screen-map.md`.
3. Open all approved references for that screen.
4. Inspect the existing design tokens.
5. Identify responsive and interaction requirements.

After implementation:

1. Render the screen at its reference dimensions.
2. Capture desktop and mobile screenshots.
3. Compare them with the approved references.
4. Check hierarchy, spacing, typography, surfaces and responsive behavior.
5. Verify loading, error and keyboard states.
6. Document intentional deviations.

## File naming

Use:

`<screen>-<state>-<viewport>-<width>x<height>.png`

Examples:

- `login-default-mobile-390x844.png`
- `login-default-desktop-1440x900.png`
- `login-invalid-credentials-mobile-390x844.png`

Use lowercase names and hyphens.

## Related files

- Screen inventory: `screen-map.md`
- Design tokens: `apps/web/src/styles/tokens.css`
- Product context: `PRODUCT.md`
- Agent instructions: `AGENTS.md`