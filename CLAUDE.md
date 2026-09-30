@AGENTS.md

# Garasi Prima — showroom mobil bekas

UI text is **Bahasa Indonesia**; code identifiers and DB columns are English. See README.md for features & layout.

- `npm run seed` resets DB (drops tables, safe while dev server runs). `npx tsc --noEmit && npx eslint src` before finishing.
- DB: `node:sqlite` via `src/lib/db.ts` (schema in `src/lib/schema.sql`, applied on open). Money = integer Rupiah; format with `rupiah()` from `src/lib/format.ts`.
- Every admin page, route handler and Server Action must call `requireUser(permission)` from `src/lib/auth.ts` (no proxy/middleware auth). Permissions/roles live in `src/lib/roles.ts`; hide cost/margin UI unless `can(role, "cars.cost")`.
- Forms: `useActionState` + `FormState` (`src/app/actions.ts`). Return `values` on validation errors and bind them via `defaultValue`, because React resets forms after an action.
- Photos: stored in `data/uploads`, served by `/media/[file]`; use `mediaUrl()`. Uploads are validated by magic bytes (JPG/PNG/WEBP only).
- Showroom identity/WA number: `src/lib/site.ts`; credit assumptions: `src/lib/credit.ts`.
- New columns: add to `schema.sql` AND `ADDED_COLUMNS` in `src/lib/migrate.mjs` (existing DBs are ALTERed on start).
- `src/lib/car-utils.ts` is client-safe (types, priceDrop, monthlyFrom); `cars.ts` is server-only. Use `publicCar()` before sending Car data to the browser (strips purchase/margin fields).
- Favorites/compare live in localStorage (`src/lib/garage.ts`); CarCard renders in server and client.
- Leads pipeline statuses: new → contacted → negotiating → won | lost. Notifications fire via `after()` in `src/app/actions.ts`.
- Public forms must include `<NbConsent />`; the `consent` field is required by the zod `contact` schema in `src/app/actions.ts`.
