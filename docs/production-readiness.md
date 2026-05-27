# Velozty - Production Readiness

## Current validation

- `npm run build`: passing.
- `npm run test`: passing.
- `npm run lint`: passing with warnings.
- Supabase public client can read main public tables without runtime errors.
- Public `SECURITY DEFINER` helper functions were moved out of the exposed API path.

## Required production environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## Deployment notes

- Vercel SPA fallback is configured in `vercel.json`.
- Netlify/static fallback is configured in `public/_redirects`.
- Do not commit `.env`; use `.env.example` as the template.

## Known remaining warnings

- Some React hook dependency warnings remain and should be cleaned in a focused pass.
- Several `any` types remain in route error handlers and Supabase realtime helpers.
- The production bundle is above Vite's default 500 kB warning threshold; route-level lazy loading is the next optimization.
- `export_my_data` and `delete_my_account` intentionally remain callable by authenticated users as LGPD account actions.
