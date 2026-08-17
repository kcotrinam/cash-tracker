# CashTracker Screen Map

This document identifies the approved design reference for each route, viewport,
and UI state.

## Status definitions

- `Approved`: authoritative implementation reference
- `Draft`: not ready for implementation
- `Missing`: reference still required
- `Implemented`: implemented and visually verified
- `Deprecated`: no longer active

## Authentication

### Login

Route: `/login`

Primary user task: Sign in using email and password.

| State               | Viewport        | Reference                                                               | Status   |
| ------------------- | --------------- | ----------------------------------------------------------------------- | -------- |
| Default             | Mobile, 390px   | `references/stitch/auth/login-default-mobile-390x844.png`               | Approved |
| Default             | Desktop, 1440px | `references/stitch/auth/login-default-desktop-1440x900.png`             | Approved |
| Invalid credentials | Mobile, 390px   | `references/stitch/auth/login-invalid-credentials-mobile-390x844.png`   | Approved |
| Invalid credentials | Desktop, 1440px | `references/stitch/auth/login-invalid-credentials-desktop-1440x900.png` | Approved |
| Submitting          | Mobile, 390px   | `references/stitch/auth/login-loading-mobile-390x844.png`               | Approved |
| Submitting          | Desktop, 1440px | `references/stitch/auth/login-loading-desktop-1440x900.png`             | Approved |
| Expired session     | Mobile, 390px   | `references/stitch/auth/login-session-expired-mobile-390x844.png`       | Approved |
| Expired session     | Desktop, 1440px | `references/stitch/auth/login-session-expired-desktop-1440x900.png`     | Approved |

#### Required behavior

- Preserve the email after invalid credentials.
- Clear or keep the password private after failure.
- Use one generic authentication error.
- Disable repeated submissions while loading.
- Announce errors to assistive technologies.
- Redirect authenticated users away from `/login`.
- Redirect to the intended protected route after successful login.
- Mobile removes the promotional desktop panel.
- The show-password control must have an accessible label.
- The create-account link navigates to `/register`.

#### Required copy

```text
Bienvenido de nuevo
Inicia sesión para continuar con tus finanzas.

Correo electrónico
Contraseña

Iniciar sesión

¿Aún no tienes una cuenta? Crear cuenta
Invalid credentials:
El correo o la contraseña son incorrectos.
Submitting:
Iniciando sesión...
Expired session:
Tu sesión expiró. Inicia sesión nuevamente.
```

#### Intentionally excluded

- Google Sign-In
- Passkeys
- Remember me
- Forgot password
- Request access
- Testimonials
- Star ratings

### Registration

Route: `/register`

Primary user task: Create a CashTracker account using name, email and password.

| State                 | Viewport        | Reference                                                     | Status   |
| --------------------- | --------------- | ------------------------------------------------------------- | -------- |
| Default               | Mobile, 706px   | `references/registration_mobile_default/screen.png`           | Approved |
| Default               | Desktop, 1600px | `references/registration_desktop_default/screen.png`          | Approved |
| Validation error      | Mobile, 654px   | `references/registration_mobile_validation_error/screen.png`  | Approved |
| Validation error      | Desktop, 1600px | `references/registration_desktop_validation_error/screen.png` | Approved |
| Registration conflict | Mobile, 611px   | `references/registration_mobile_conflict_state/screen.png`    | Approved |
| Registration conflict | Desktop         | Not available                                                 | Draft    |
| Submitting            | Mobile, 706px   | `references/registration_mobile_submitting_state/screen.png`  | Approved |
| Submitting            | Desktop         | Not available                                                 | Draft    |

#### Required fields

The registration form contains:

1. `displayName`
2. `email`
3. `password`
4. `confirmPassword`

`confirmPassword` is a client-side field and must not be sent to the API unless
the backend contract explicitly requires it.

Do not add optional fields without updating the product requirements.

#### Required behavior

- Trim leading and trailing whitespace from the display name.
- Normalize email according to the authentication API contract.
- Validate the email format.
- Password length must match the backend requirement: between 10 and 128 characters.
- Validate that password and confirmation password match.
- Do not disable password-manager behavior or password pasting.
- Use `autocomplete="name"` for the display name and `autocomplete="email"` for the email.
- Use `autocomplete="new-password"` for both password fields.
- Both password fields must support accessible show or hide controls.
- Preserve the display name and email after a recoverable error.
- Never log or persist password values.
- Disable repeated submissions while registration is in progress and keep button dimensions stable.
- Announce validation and server errors to assistive technologies.
- Focus the first invalid field after an unsuccessful client-side submission.
- Use one generic registration-conflict message without exposing backend details.
- Send authentication requests with cookie credentials; never store access or refresh tokens in browser storage.
- Successful registration creates an authenticated session and redirects to a safe internal route or `/dashboard`.
- Redirect authenticated users away from `/register`.
- The login link navigates to `/login`.
- Mobile removes the promotional desktop panel.
- Mobile and desktop reuse the same authentication design system, including form, button, error, and surface treatments.

#### Default copy

```text
CashTracker

Empieza a entender mejor tus finanzas.

Registra tus ingresos, gastos y compromisos mensuales en un solo lugar.

Crea tu cuenta

Comienza a organizar tus finanzas personales.

Nombre
Tu nombre

Correo electrónico
nombre@ejemplo.com

Contraseña
Crea una contraseña segura

Confirmar contraseña
Repite tu contraseña

Mínimo 10 caracteres.

Crear cuenta

¿Ya tienes una cuenta? Iniciar sesión

Required field:
Este campo es obligatorio.
Invalid email:
Ingresa un correo electrónico válido.
Password too short:
La contraseña debe tener al menos 10 caracteres.
Password mismatch:
Las contraseñas no coinciden.
Submitting:
Creando cuenta...
Registration conflict:
No pudimos crear la cuenta con estos datos. Intenta iniciar sesión o utiliza otro correo.
Network error:
No pudimos conectarnos. Inténtalo nuevamente.
Generic server error:
Ocurrió un problema al crear tu cuenta. Inténtalo nuevamente.
```

Network and generic server errors use the same form-level alert position and visual treatment as the registration-conflict state.

#### Responsive behavior

Desktop uses the same two-column authentication shell as `/login`, with brand context and one product preview in the left region. Keep the registration form between approximately 360px and 410px wide, with all required fields and the primary action visible on common laptop heights when practical. Do not add testimonials, ratings, or promotional sections.

Mobile removes the promotional panel and product preview, keeps CashTracker identity visible, and prioritizes form completion. Inputs use at least 16px text; touch targets are at least 44px and preferably about 48px high. Respect safe areas, avoid horizontal overflow, and keep the form usable while the virtual keyboard is open.

#### Accessibility requirements

- All inputs have persistent visible labels and every error is associated with its field.
- Form-level errors use an accessible live region.
- Keyboard focus is visible and follows visual order.
- Password visibility controls have accessible names.
- Errors use text or icons in addition to color.
- Text and controls meet WCAG AA contrast.
- The page has a descriptive title and the document language is Spanish.

#### Intentionally excluded

- Google registration, passkeys, remember me, forgot password, invitation codes, and request access.
- Phone number, company name, profession, currency selection, and newsletter opt-in.
- Testimonials and star ratings.
- Privacy Policy and Terms of Service links until real routes and documents exist.

## Dashboard

Route: `/dashboard`

| State     | Viewport        | Reference                                 | Status                                    |
| --------- | --------------- | ----------------------------------------- | ----------------------------------------- |
| Populated | Mobile, 390px   | `references/dashboard_mobile/screen.png`  | Approved — implementation capture pending |
| Populated | Desktop, 1440px | `references/dashboard_desktop/screen.png` | Approved — implementation capture pending |
| Empty     | Mobile          | Not available                             | Missing                                   |
| Empty     | Desktop         | Not available                             | Missing                                   |
| Loading   | Mobile          | Not available                             | Missing                                   |
| Loading   | Desktop         | Not available                             | Missing                                   |
| Error     | Mobile          | Not available                             | Missing                                   |
| Error     | Desktop         | Not available                             | Missing                                   |

#### Implementation notes

- `/dashboard` reads authenticated, user-scoped data from `GET /dashboard`. Totals and category distribution are filtered by the selected month and currency; currencies are never combined.
- If the selected period has no recorded transactions, the empty state says `Información no proporcionada aún`.
- The implementation deliberately removes the Stitch placeholder actions, fabricated comparisons, broken navigation destinations, and floating action button. It uses accessible local month/currency controls, semantic tables/lists, readable mobile rows, and a text equivalent for the spending distribution.
- Loading, empty, and error states are available in development through `?state=loading`, `?state=empty`, and `?state=error`. Visual capture and browser-based responsive/accessibility review remain pending.

## Remaining product screens

| Route               | Screen                 | Status                                    |
| ------------------- | ---------------------- | ----------------------------------------- |
| `/categories`       | Legacy category route  | Replaced by `/settings/categories`        |

## Implementation progress

| Route               | UI implemented            | Responsive verified     | Accessibility verified                      |
| ------------------- | ------------------------- | ----------------------- | ------------------------------------------- |
| `/login`            | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/register`         | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/dashboard`        | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/transactions`     | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/transactions/new` | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/recurring`        | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/recurring/new`    | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/categories`       | No                        | No                      | No                                          |
| `/settings`         | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/settings/profile` | Yes — persisted API       | Pending browser capture | Code review complete; browser audit pending |
| `/settings/preferences` | Yes — persisted API   | Pending browser capture | Code review complete; browser audit pending |
| `/settings/categories` | Yes — persisted API    | Pending browser capture | Code review complete; browser audit pending |
| `/settings/security` | Yes — persisted API      | Pending browser capture | Code review complete; browser audit pending |

### Category selector on `/transactions/new`

- Categories are scoped to the signed-in user and filtered by the selected transaction type.
- The inline selector supports accent-insensitive search and an explicit `Crear “…”` action.
- Selecting `Otros gastos` or `Otros ingresos` has no special flow; both behave as regular categories.
