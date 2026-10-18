# Cafe Aroma — Admin Dashboard Starter

This upgrade preserves the existing customer-facing page and adds an admin menu editor backed by Supabase. It is a starter integration, not a live configured backend yet: you must create a Supabase project and add its project URL and publishable/anon key.

## Files added
- `admin/index.html`, `admin/admin.css`, `admin/admin.js`: owner login and menu management.
- `js/supabase-config.js`: Supabase project configuration placeholders.
- `js/public-menu.js`: loads the published menu from Supabase when configured; otherwise the existing static menu remains.
- `supabase/schema.sql`: database tables, RLS policies and image bucket setup.

## Setup

1. **Back up your repository.** Create a branch before replacing files.
2. Create a project at https://supabase.com/.
3. In Supabase, open **SQL Editor**, paste and run `supabase/schema.sql`.
4. Open **Project Settings → API** and copy the Project URL and publishable key (or legacy anon key).
5. Edit `js/supabase-config.js`:
   - Replace `YOUR_SUPABASE_PROJECT_URL`.
   - Replace `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`.
   - Never paste a service-role/secret key into frontend code.
6. In Supabase **Authentication → Users**, create an owner user with an email and password. Disable public sign-ups if you do not want arbitrary users creating accounts.
7. Copy that user's UUID. In SQL Editor run the membership query at the bottom of `supabase/schema.sql`, replacing `OWNER_AUTH_USER_UUID` with the real UUID.
8. Optional: uncomment and run the sample menu insert block at the bottom of `supabase/schema.sql` to seed the six demo items. Do not run it repeatedly if you do not want duplicate menu items.
9. Deploy the whole repository to your test site. Open `/admin/` and sign in.
10. Add a test menu item, change its price, mark it unavailable, and verify the public page reflects the changes.

## Notes and limitations

- The existing WhatsApp ordering and table booking still open WhatsApp. This phase does not yet store orders or reservations in the database.
- The public menu fetch uses the demo café slug `cafe-aroma`. For a commercial multi-café product, add per-café routing and onboarding before selling.
- Current photo upload policy permits public viewing of menu images but restricts upload/edit/delete to café members.
- RLS is enabled for the database tables. Review and test policies before production.
- GitHub Pages is fine for a development preview, but GitHub says Pages is not intended or permitted as free hosting for an online business, e-commerce or SaaS. Move the production frontend to a suitable hosting service before commercial launch.
- Supabase JS is loaded from jsDelivr. A production build can pin dependencies and use a controlled build pipeline.
- This is not a complete point-of-sale system: no payment processing, server-validated order submission, tax invoice, stock tracking or order dashboard has been implemented yet.
