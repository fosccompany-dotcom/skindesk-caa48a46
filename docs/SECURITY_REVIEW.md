# Bloomlog — Security Review & Remediation Plan

> **Date:** 2026-06-14
> **Scope:** Supabase migrations (20+), Edge Functions (4), `config.toml`, client auth/integration, secret exposure.
> **Method:** Direct source reading (not inference). Runtime-only facts (live DB state) are explicitly flagged as "verify".
> **Reviewer:** Claude Code (Opus) — findings reconstructed by reading the high-value security surface directly.

---

## Executive Summary

The admin RBAC layer (`20260523_admin_rbac.sql`) is **well-built**: `SECURITY DEFINER` functions with a pinned `search_path`, owner/admin/reviewer separation, an owner-lockout-prevention trigger, and an owner-gated `lookup_user_id_by_email` RPC. User-scoped tables that *are* defined in migrations (`reservations`, `package_options`, `diagnosis_snapshots`, `user_favorite_clinics`) correctly isolate rows by `auth.uid()`.

The risk concentrates in three places:

1. **The most sensitive tables (treatment history, payments, points, profiles) have no RLS definition in version control** — their protection cannot be verified from the repo and must be checked against the live DB immediately.
2. **Two Edge Functions are reachable without proper authorization** — one (`parse-clinic-event`) bypasses RLS with the service-role key and has no `is_admin()` check; the other (`parse-treatment`) has no auth at all.
3. **Supporting weaknesses** (SSRF, wildcard CORS, LLM-driven auto-publish, verbose errors) amplify the above.

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | 🔴 Critical | Core PII/financial tables' RLS not in repo — unverifiable | **Verify in live DB** |
| 2 | 🟠 High | `parse-clinic-event`: service-role write to catalog with no `is_admin()` check | Confirmed (code) |
| 3 | 🟠 High | `parse-treatment`: no authentication → LLM cost abuse | Confirmed (code) |
| 4 | 🟡 Medium | `parse-clinic-event` `image_url` SSRF | Confirmed (code) |
| 5 | 🟡 Medium | All Edge Functions use CORS `Access-Control-Allow-Origin: *` | Confirmed (code) |
| 6 | 🟡 Medium | LLM prompt injection → confidence≥80 auto-publish | Confirmed (code) |
| 7 | 🔵 Low/Info | `.env` tracked in git; anon key hardcoded (public by design) | Confirmed (code) |
| 8 | 🔵 Low | Edge Function error responses leak raw internals | Confirmed (code) |

---

## Context: why the client key being public matters

`src/integrations/supabase/client.ts` hardcodes the Supabase URL and the **anon publishable JWT**. This is by design — Supabase clients ship the anon key in the bundle. The consequence is that **data isolation is enforced *only* by Row Level Security (RLS)** on the database, and **any Edge Function reachable with that public key is reachable by anyone**. Every finding below follows from this property.

---

## 🔴 #1 — Core PII/financial tables: RLS unverifiable from the repository

**Tables:** `treatment_records`, `payment_records`, `point_transactions`, `treatment_cycles`, `clinic_balances`, `treatment_packages`, `user_profiles`

### Cause
These tables were created via the Lovable dashboard, not via migration files. Across all migrations they appear **only in `ALTER TABLE`** statements (adding columns/constraints) — there is **no `CREATE TABLE`, no `ENABLE ROW LEVEL SECURITY`, and no `CREATE POLICY`** for any of them. The only user-scoped RLS policies present in the repo are for `reservations`, `package_options`, `diagnosis_snapshots`, and `user_favorite_clinics`. (The project `CLAUDE.md` claims "20260316* migrations created 7 tables + RLS", but the referenced files contain no such DDL.)

### Impact
If RLS is disabled — or enabled but missing a per-user policy — on any of these tables, then because the client key is public, **any authenticated user (or anyone holding the public anon key) can read or modify every user's treatment history, payments, points, and profile**. This is medical-adjacent + financial PII, so the blast radius is severe (privacy-law exposure).

### Exploit scenario
```js
// With only the public anon key + any logged-in session:
const { data } = await supabase.from('treatment_records').select('*'); // → everyone's records, if RLS is off
```

### Fix

**Step 1 — Diagnose live state (Supabase SQL Editor):**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('treatment_records','payment_records','point_transactions',
                    'treatment_cycles','clinic_balances','treatment_packages','user_profiles')
ORDER BY rowsecurity, tablename;          -- any rowsecurity = false ⇒ immediate risk

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;                        -- confirm a per-user USING/WITH CHECK exists per table
```

**Step 2 — Enforce RLS as a versioned migration** (`supabase/migrations/20260614_enforce_core_rls.sql`).
Key columns were verified against `types.ts`: the first six tables key on `user_id`; `user_profiles` keys on its PK `id`.
```sql
BEGIN;

-- Six tables keyed by user_id: owner-only CRUD
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'treatment_records','payment_records','point_transactions',
    'treatment_cycles','clinic_balances','treatment_packages'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_own" ON public.%1$s;', t);
    EXECUTE format($f$
      CREATE POLICY "%1$s_own" ON public.%1$s
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;

-- user_profiles: PK id == auth.uid()
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_own" ON public.user_profiles;
CREATE POLICY "user_profiles_own" ON public.user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
```

**Notes**
- `delete-account` uses the service-role key and therefore bypasses RLS — these policies will **not** break account deletion.
- Re-run the Step 1 diagnostic after applying; every target table must report `rowsecurity = true` with a policy.
- Confirm column names per table in `src/integrations/supabase/types.ts` before applying (only `user_profiles` keys on `id`).

---

## 🟠 #2 — `parse-clinic-event`: service-role catalog write with no admin check

**Files:** `supabase/functions/parse-clinic-event/index.ts`, `supabase/config.toml`

### Cause
- `config.toml` sets `verify_jwt = true`, but the **anon publishable key is itself a valid JWT**, so anyone holding the public key (it is in `client.ts`) passes that gate. `verify_jwt = true` means "has a valid JWT," **not** "is a logged-in user."
- The function performs **no `is_admin()` / user check** internally (its own comment flags this as a TODO).
- It builds a client with `SUPABASE_SERVICE_ROLE_KEY` (`index.ts:628-629`) and `INSERT`s into `clinic_events` / `clinic_treatments`. The service-role key **bypasses RLS entirely**, nullifying the `WITH CHECK (is_admin())` policies from `admin_rbac.sql`.

### Impact
Anyone with the public anon key can insert arbitrary clinic events/treatments into the public catalog. Combined with #6, `confidence_score >= 80` triggers **auto-approval and publication** (`20260522_workstream_b_events.sql:98-102`), so fake prices / bogus events reach real users via `ClinicEvents.tsx` without human review.

### Fix — authenticate + authorize at the top of the handler
Insert immediately after the `OPTIONS` handler:
```ts
// ── Admin auth gate ──────────────────────────────────────────
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return jsonResponse({ error: "Unauthorized" }, 401);
}
const authClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authHeader } } },
);
const { data: { user }, error: authErr } =
  await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
if (authErr || !user) {
  return jsonResponse({ error: "Unauthorized" }, 401);
}
const { data: isAdmin, error: adminErr } = await authClient.rpc("is_admin");
if (adminErr || isAdmin !== true) {
  return jsonResponse({ error: "Forbidden: admin only" }, 403);
}
// ─────────────────────────────────────────────────────────────
```
The anon key passes `verify_jwt` but yields no real user from `getUser()` and `is_admin() = false`, so it is rejected. Keep `verify_jwt = true` as defense-in-depth.

---

## 🟠 #3 — `parse-treatment`: no authentication (LLM cost abuse)

**Files:** `supabase/functions/parse-treatment/index.ts`, `config.toml` (`verify_jwt = false`)

### Cause
`verify_jwt = false` **and** no internal auth check. The handler reads `req.json()` and calls the Lovable AI Gateway with `LOVABLE_API_KEY` directly (`index.ts:294`). The sibling functions `search-clinic` and `delete-account` (also `verify_jwt = false`) do verify the user with `getUser()`; this one does not.

### Impact
Anyone who knows the URL can invoke the LLM without authentication → **AI-credit exhaustion (financial DoS)** and abuse of the gateway as a free LLM proxy with arbitrary text/images.

### Fix — same pattern as `search-clinic`
Add `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";` and, after the `OPTIONS` handler:
```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const supa = createClient(
  Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authHeader } } },
);
const { data: { user }, error: authError } =
  await supa.auth.getUser(authHeader.replace("Bearer ", ""));
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```
**Recommended:** add a per-user rate limit (e.g. N calls/min keyed on `user.id`) to prevent authenticated abuse.

---

## 🟡 #4 — `parse-clinic-event` `image_url` SSRF

### Cause
`index.ts:665-672` fetches a user-supplied `image_url` server-side (auto-generating a `Referer`). Because #2 leaves the function effectively public, an attacker controls the URL.

### Impact
Server-Side Request Forgery: probe internal/cloud-metadata endpoints, or abuse the function as an anonymous proxy.

### Fix
1. The admin gate from #2 is the primary mitigation (limits callers to admins).
2. Add a host allowlist + private-range block before fetching:
```ts
function assertSafeImageUrl(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error("https only");
  const ALLOW = ["dapi.kakao.com", "k.kakaocdn.net", "img1.kakaocdn.net", "bloomlog.kr"];
  if (!ALLOW.some(d => u.hostname === d || u.hostname.endsWith("." + d))) {
    throw new Error("host not allowed: " + u.hostname);
  }
}
// before fetch:
if (image_url && !image_base64) { assertSafeImageUrl(image_url); /* ... */ }
```
Populate `ALLOW` with the CDN domains actually used. For stricter defense, also reject DNS results in private ranges (10./172.16./192.168./169.254.).

---

## 🟡 #5 — Wildcard CORS on all Edge Functions

### Cause
All four functions set `"Access-Control-Allow-Origin": "*"`.

### Impact
Any web page can call the functions from a browser, widening the abuse surface for #2/#3. (Note: CORS does not stop direct `curl`; it is a secondary control.)

### Fix — origin allowlist
```ts
const ALLOWED_ORIGINS = ["https://bloomlog.kr", "https://skindesk.lovable.app"];
function corsFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
```
Capacitor (Android) may send `https://localhost` / `capacitor://localhost` — confirm the mobile build's Origin and add it to the allowlist.

---

## 🟡 #6 — Prompt injection → auto-published catalog poisoning

### Cause
User-supplied text/images flow into the LLM prompt. The model's self-reported `confidence_score` alone drives publication: `confidence_score >= 80 AND review_status = 'pending'` is auto-set to `approved` by trigger (`20260522_workstream_b_events.sql:98-102`).

### Impact
Crafted input can inflate confidence and **publish fake treatments/prices without human review** (severe when chained with #2).

### Fix
1. Admin gate from #2 (prerequisite).
2. Do not treat the LLM-produced `confidence_score` as a sole publish gate — a model can be steered to emit a high score. Gate publication on **server-side rules** (price-parse completeness, source trust) and/or keep new sources in `pending` for human review.
3. Consider raising the auto-approve threshold or disabling auto-publish for untrusted source types.

---

## 🔵 #7 — `.env` tracked in git; anon key hardcoded

### Cause
`.env` is tracked and absent from `.gitignore`. Current contents are three public values only (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, anon `PUBLISHABLE_KEY`) — all shipped in the client bundle anyway, so **no real secret is leaked today**.

### Impact
Low now; the risk is a future accidental commit of a real secret (e.g. service-role key) into the tracked `.env`.

### Fix
```bash
echo ".env" >> .gitignore
git rm --cached .env        # stop tracking, keep the local file
```
**Caveat:** the project `CLAUDE.md` notes the Lovable build may depend on the committed `.env`. **Verify the build works without the tracked `.env` before untracking.** If it cannot, keep tracking but enforce the rule "never commit service-role/secret keys" (those belong only in Supabase Function env vars). Hardcoding the anon key in `client.ts` is normal for Supabase.

---

## 🔵 #8 — Verbose error responses

### Cause
`parse-clinic-event` returns raw internals: `details: errText` (`index.ts:733`), `raw: result` (`739`), `error: err.message` (`858`).

### Impact
Leaks internal structure / upstream gateway responses to clients.

### Fix
```ts
} catch (err) {
  console.error("Unhandled error:", err);                 // detail to logs only
  return jsonResponse({ error: "Internal server error" }, 500);  // generic to client
}
```
Apply the same generalization to the LLM-gateway error branches (drop `details`/`raw`).

---

## Remediation Order

| Order | Action | Target | Severity |
|-------|--------|--------|----------|
| 1 | Run RLS diagnostic SQL, review results | Supabase SQL Editor | 🔴 |
| 2 | Add core-table RLS migration | `supabase/migrations/20260614_enforce_core_rls.sql` | 🔴 |
| 3 | Admin auth gate | `functions/parse-clinic-event/index.ts` | 🟠 |
| 4 | Auth gate (+ rate limit) | `functions/parse-treatment/index.ts` | 🟠 |
| 5 | SSRF allowlist | `functions/parse-clinic-event/index.ts` | 🟡 |
| 6 | CORS origin allowlist (4 functions) | `functions/*/index.ts` | 🟡 |
| 7 | Re-examine auto-approve policy | events trigger / review flow | 🟡 |
| 8 | `.gitignore` `.env` (after build check) | `.gitignore` | 🔵 |
| 9 | Generalize error responses | `functions/parse-clinic-event/index.ts` | 🔵 |

> #1 is the top priority and is an **operational DB action** (run SQL against the live database), not a code change. Confirm the diagnostic results before finalizing the migration.

---

## Verification Status

| Claim | How verified | Result |
|-------|--------------|--------|
| Core 7 tables lack RLS DDL in repo | grep all migrations for CREATE TABLE / ENABLE RLS / CREATE POLICY | Confirmed absent |
| Live RLS state of those tables | — | **Not verified** (needs DB access) |
| `parse-clinic-event` uses service role, no admin check | read `index.ts` + `config.toml` | Confirmed |
| `parse-treatment` has no auth | read `index.ts` + `config.toml` | Confirmed |
| Auto-approve at confidence ≥ 80 | read `20260522_workstream_b_events.sql:98-102` | Confirmed |
| RLS migration key columns (`user_id` vs `id`) | parsed `src/integrations/supabase/types.ts` | Confirmed (6× `user_id`, `user_profiles`=`id`) |
| Client front-end (XSS, token storage) | surface scan only | Partial — deeper review recommended |

---

## Evidence Index (file:line)

- `supabase/config.toml` — `verify_jwt`: search-clinic=false, delete-account=false, parse-treatment=false, parse-clinic-event=true
- `src/integrations/supabase/client.ts` — hardcoded URL + anon JWT
- `supabase/functions/parse-clinic-event/index.ts:628-629` — service-role client; `:665-672` — `image_url` fetch (SSRF); `:733,739,858` — verbose errors
- `supabase/functions/parse-treatment/index.ts:294` — LLM gateway call with no preceding auth
- `supabase/functions/delete-account/index.ts:32-40` — correct internal `getUser()` gate (good pattern)
- `supabase/functions/search-clinic/index.ts:392-413` — correct internal `getUser()` gate (good pattern)
- `supabase/migrations/20260523_admin_rbac.sql` — RBAC functions/policies (well-built)
- `supabase/migrations/20260522_workstream_b_events.sql:98-102` — confidence≥80 auto-approve trigger
- `supabase/migrations/20260316105345_*.sql:18-27` — `reservations` RLS (template for #1)
