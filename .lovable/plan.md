
# TradeFunds — Phase 1 Plan

Focus: revenue + retention foundation. Phase 2 (referrals, competitions, leaderboards, newsletter, ad slots, analytics dashboard) is scoped at the bottom and will be a separate plan.

## 1. Deploy health check
Preview is currently healthy; no active build error. As a safety pass I will:
- Re-run a published build verification after Phase 1 lands.
- Patch any TypeScript/route-tree issues surfaced during the build.
No speculative "fixes" before that — chasing a phantom error risks regressions.

## 2. Challenge catalog (FundingPips-style)
Seed the `challenges` table via a data insert (not a schema migration):

| Name | Size | Price | Profit target | Daily loss | Total loss | Split |
|---|---|---|---|---|---|---|
| Starter | $5,000 | $49 | 8% | 5% | 10% | 70% |
| Standard | $10,000 | $89 | 8% | 5% | 10% | 75% |
| Pro | $25,000 | $179 | 8% | 5% | 10% | 80% |
| Advanced | $50,000 | $299 | 8% | 5% | 10% | 80% |
| Expert | $100,000 | $499 | 8% | 5% | 10% | 80% |
| Elite | $200,000 | $899 | 8% | 5% | 10% | 90% |

`/challenges` and the landing preview already read from this table, so they update automatically.

## 3. Membership plans (Free / Pro / Elite) + Stripe
- Run Stripe eligibility check, then enable built-in Stripe payments.
- Create three subscription products: Free $0, Pro $19/mo, Elite $49/mo.
- Plan perks:
  - **Free**: 1 active challenge, basic dashboard, community access.
  - **Pro**: 3 concurrent challenges, 20% discount on challenge fees, advanced analytics on dashboard.
  - **Elite**: unlimited challenges, 40% discount, priority support badge, early access to new features.
- New `subscriptions` table (user_id, plan, status, stripe_customer_id, current_period_end) with RLS + GRANTs.
- `/pricing` route with three plan cards and a Stripe Checkout button.
- Server fn `createCheckoutSession` + webhook at `/api/public/webhooks/stripe` to sync subscription status.
- Gate challenge purchase discounts and concurrent-challenge limit by `subscriptions.plan`.

## 4. Landing page polish (conversion-focused)
Single goal: increase registrations.
- Sticky top CTA bar ("Start free — no card required").
- Hero refresh: clearer value prop, primary "Create free account" + secondary "View challenges".
- Add trust strip (disclaimer-safe: "Simulated platform · Educational use · No deposits required").
- Add "Plans" section linking to `/pricing`.
- Add "Latest from the blog" 3-card strip (auto-pulled from `posts`).
- Keep existing How-it-works, Challenges preview, Leaderboard (demo), FAQ, Disclaimer footer.
- Ad-slot placeholder components (`<AdSlot slot="landing-mid" />`) rendered as styled empty containers — wired to nothing yet, ready for Phase 2.

## 5. Blog (SEO)
- New `posts` table: slug, title, excerpt, body (markdown), cover_image, author_id, published_at, tag. RLS: public SELECT where `published_at IS NOT NULL`; authenticated insert/update gated to admin role via `user_roles` + `has_role()`.
- New `user_roles` table + `app_role` enum (`admin`, `user`) + `has_role()` security-definer function (per platform standard).
- Routes:
  - `/blog` — list of published posts, paginated.
  - `/blog/$slug` — article page with full SEO `head()` (title, description, og:title, og:description, og:image from cover, twitter card, JSON-LD Article).
  - `/_authenticated/admin/posts` — admin-only create/edit (markdown editor via `react-markdown` + textarea).
- Seed 3 example posts so SEO and landing strip aren't empty.

## 6. User profiles + achievement badges
- Extend `profiles` table: add `bio`, `country`, `avatar_url` (already exists), `total_pnl`, `challenges_passed`, `member_since`.
- New `achievements` table (catalog: code, name, description, icon) + `user_achievements` (user_id, achievement_code, earned_at). RLS + GRANTs.
- Seed achievements: First Trade, First Pass, 5% Gainer, 10% Gainer, Profit Streak, Elite Member.
- Award logic in the existing trade-close server fn / challenge-pass path (server-side, idempotent on unique constraint).
- New routes:
  - `/_authenticated/profile` — edit own bio/avatar/country, see earned badges and stats.
  - `/u/$userId` — public profile (display_name, badges, public stats only — no PII).

## 7. Mobile + performance
- Audit landing, pricing, dashboard, trade page on mobile breakpoints; fix any horizontal scroll / tap-target issues.
- Add `loading="lazy"` to non-LCP images, preload LCP hero image via route `head().links`.
- Defer TradingView script until the trade page mounts (already lazy via component, verify).
- Add per-route `head()` metadata to all new routes.

## 8. SEO basics
- Unique title + meta description on every new route.
- JSON-LD: `Organization` on root, `Article` on blog posts, `Product` on `/challenges` items.
- Sitemap route at `/api/public/sitemap.xml` listing public routes + published posts.
- `robots.txt` allowing all.

## Out of scope (Phase 2 plan, separate)
Referral/affiliate program + reward tracking, real leaderboards from `user_challenges` data, trading competitions, newsletter (Lovable Emails), real ad-network wiring, internal analytics dashboard for admin (users/signups/revenue charts).

## Technical details
- **Stripe**: built-in `enable_stripe_payments` integration. Default tax mode = full compliance handling (`managed_payments`) since this is a digital subscription. Two products created via `batch_create_product`: Pro ($19/mo, tax code `txcd_10103001` — SaaS), Elite ($49/mo, same code).
- **DB migrations**: one migration adds `subscriptions`, `posts`, `user_roles`, `achievements`, `user_achievements`, `app_role` enum, `has_role()` function, RLS policies, GRANT statements, and `updated_at` triggers. Profile column additions go in the same migration. Catalog data inserts (challenges seed, achievements seed, sample posts) go via the insert tool after the migration is approved.
- **Auth roles**: roles live in `user_roles` only — never on `profiles`. Admin gate on `/admin/*` uses `has_role(auth.uid(), 'admin')` checked inside a `createServerFn` with `requireSupabaseAuth`.
- **Webhooks**: Stripe webhook at `src/routes/api/public/webhooks/stripe.ts` verifies signature with `STRIPE_WEBHOOK_SECRET`, uses `supabaseAdmin` (imported inside the handler) to upsert `subscriptions`.
- **No `auth.users` FKs** on new tables; reference `profiles.id` or store `user_id uuid` per project convention.
- **Markdown rendering**: `bun add react-markdown remark-gfm` for blog post bodies.
- **Build verification**: after the migration runs and code lands, I'll trigger a published build and read worker logs to confirm green.

Ready to switch to build mode when you approve.
