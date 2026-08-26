# CashTracker screen map

This is a lightweight index of application screens and their corresponding Stitch
references. Reference names identify screens in Stitch; they are not paths to local
exports.

| Screen                 | Route                   | Mobile | Desktop | Stitch reference                                                          | Implementation status                    |
| ---------------------- | ----------------------- | ------ | ------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Foundation landing     | `/`                     | Yes    | Yes     | Not recorded                                                              | Implemented                              |
| Sign in                | `/login`                | Yes    | Yes     | Login: default, immersive, invalid credentials, loading, expired session  | Implemented; visual verification pending |
| Registration           | `/register`             | Yes    | Yes     | Registration: default, validation error, conflict, submitting             | Implemented; visual verification pending |
| Dashboard              | `/dashboard`            | Yes    | Yes     | Dashboard: mobile and desktop                                             | Implemented; visual verification pending |
| Transactions           | `/transactions`         | Yes    | Yes     | Movimientos: populated, empty, no results, loading, error, mobile filters | Implemented; visual verification pending |
| Add transaction        | `/transactions/new`     | Yes    | Yes     | Añadir movimiento: expense, income, validation, saving, success, discard  | Implemented; visual verification pending |
| Recurring transactions | `/recurring`            | Yes    | Yes     | Recurrentes: populated and empty                                          | Implemented; visual verification pending |
| Add recurrence         | `/recurring/new`        | Yes    | Yes     | Nueva recurrencia: expense default and validation                         | Implemented; visual verification pending |
| Settings               | `/settings`             | Yes    | Yes     | Configuración: mobile menu                                                | Implemented; visual verification pending |
| Profile                | `/settings/profile`     | Yes    | Yes     | Configuración: profile, mobile and desktop                                | Implemented; visual verification pending |
| Preferences            | `/settings/preferences` | Yes    | Yes     | Configuración: preferences and success                                    | Implemented; visual verification pending |
| Categories             | `/settings/categories`  | Yes    | Yes     | Configuración: categories and deactivate dialog                           | Implemented; visual verification pending |
| Security               | `/settings/security`    | Yes    | Yes     | Configuración: mobile security and error                                  | Implemented; visual verification pending |

Update this file whenever a screen is added, removed, renamed, or its route changes.
