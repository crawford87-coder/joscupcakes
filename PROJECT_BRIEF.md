# Jo's Cupcakes — Website Build Brief

## What this is
A storybook-feeling marketing site + custom order inquiry form + admin operations hub for a home-based custom cupcake business in Austin, TX. Service area: Austin ISD only.

The cupcakes are wildly imaginative custom designs for kids' birthdays — princess rainbow kittens, roaring dinosaurs, fairies on mushrooms riding unicorns. The site needs to feel like opening a fairytale book.

## Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Auth)
- **Email notifications:** Resend
- **Forms:** Native React forms posting to Next.js route handlers → Supabase
- **Hosting:** Already arranged (will deploy via Git)

Keep dependencies minimal. No CMS, no e-commerce platform, no Stripe.

## Visual direction — non-negotiable

### Vibe
Vintage fairytale book. Cream and pastel page surface. Soft pinks, lavenders, mints, gentle gradients. Decorative sparkles and butterflies as small accents in corners. Dashed dividers. White card surfaces with rounded corners and soft shadows for forms and content blocks.

### Fonts (load via Google Fonts)
- **Display headlines:** `Cormorant Garamond`, italic, weight 500 — for hero headlines, section headers, pull quotes
- **Small caps & nav:** `IM Fell English SC` — for nav, labels, buttons
- **Body:** `IM Fell English`, italic for storytelling copy, regular for forms and UI

### Color palette
- Page background gradient: `#FFF5F8` → `#FBF0FA` → `#F0F5FB` (top to bottom)
- Primary text (headlines): `#6B2547` (deep berry)
- Body text: `#4A3050`
- Accent / CTA buttons: `#B5588C` (rose), with `#8B3D6B` shadow underneath
- Secondary accent: `#D87BA8`
- Soft pink: `#F4C0D1`, lavender: `#C5B8E8`, mint: `#B5D9C7`, butter: `#FAC775`
- Dashed borders: `#E8C8DD`
- Card surfaces: white with soft pink shadow `rgba(180,120,170,0.15)`

### Decorative elements
- Inline SVG sparkles (4-point stars) scattered in corners of sections
- Inline SVG butterflies as accents
- Dashed horizontal dividers with a centered sparkle: `— ✦ —`
- Buttons are pill-shaped (border-radius 999px) with a 2-3px solid shadow underneath for a slightly raised storybook feel
- Use `✦` and `—` as decorative typographic elements throughout

### What to avoid
- No Disney/branded characters
- No bright neon
- No corporate sans-serif (Inter, Helvetica, etc.)
- No flat material design feel — this should feel hand-crafted

## Site structure
1. **Home (`/`)** — hero, photo gallery placeholder, how it works, CTA
2. **Order (`/order`)** — the inquiry form, this is the main conversion page
3. **About (`/about`)** — Jo's short story
4. **FAQ (`/faq`)** — pricing, lead times, allergens, delivery
5. **Admin (`/admin`)** — password-protected operations hub

## All website copy
See `WEBSITE_COPY.md` in this folder. Use that copy verbatim. Do not rewrite it.

## Order Inquiry Form fields
- Name (required)
- Email (required)
- Phone (required)
- Pickup date (required, date picker, must be 72+ hours out, 1 week if 24+ cupcakes — show inline validation)
- Pickup or Delivery (radio; if Delivery, show address field, validate zip is in Austin ISD)
- Quantity (radio cards: 6 / 12 / 18 / 24 / 36, each showing the price)
- Flavor (radio cards: Chocolate / Vanilla)
- Icing colors (multi-select swatch picker, up to 5, with a "+ add custom" option)
- Cake topper (toggle; if on, show textarea for description)
- Sprinkles or edible glitter (toggle + radio for which)
- Notes (textarea, optional)
- Honeypot field for spam

The form must show a **live total** that updates as fields change. Style the total summary as a soft pink/lavender gradient card with the number in Cormorant Garamond italic, large.

On submit:
1. Validate client-side
2. POST to `/api/orders` → insert into Supabase `orders` table
3. Send email notification to Jo via Resend
4. Show a magical success screen with reference number + "Jo will write back within a day"

## Pricing (display on Order page, also calculate live total)
| Qty | Price |
|---|---|
| 6 | $24 |
| 12 | $42 |
| 18 | $60 |
| 24 | $76 |
| 36 | $108 |

Add-ons:
- Custom cake topper: +$8
- Sprinkles or edible glitter: +$3
- Delivery (Austin ISD only): +$10
- Multi-color icing (up to 5 colors): included free

## Admin operations hub (`/admin`)
Password-protected via Supabase Auth (single user — Jo).

- Table of all orders, sorted by pickup date (default: nearest first)
- Status column with dropdown: New / Confirmed / In Progress / Ready / Delivered / Cancelled
- Filter by status, filter by date range
- Click row to expand full order details
- "Mark as confirmed" button triggers a confirmation email to customer (template editable later)
- This week's view: count of orders + total cupcakes to bake
- Mobile-friendly (Jo will check this on her phone)

The admin can be more utilitarian visually — clean and functional — but should still use the same font stack and color palette so it feels of-a-piece.

## Database schema (Supabase)

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique not null,
  created_at timestamptz default now(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_date date not null,
  fulfillment_type text not null,
  delivery_address text,
  quantity int not null,
  flavor text not null,
  icing_colors jsonb,
  topper boolean default false,
  topper_description text,
  sprinkles_or_glitter text,
  notes text,
  total_price numeric(10,2) not null,
  status text default 'new'
);
```

Enable Row Level Security. Only authenticated admin can read/update.

## Build order — please follow this and pause for my approval at each step
1. Scaffold Next.js + Tailwind + Supabase client. Set up Google Fonts (Cormorant Garamond + IM Fell English + IM Fell English SC).
2. Set up Supabase project, schema, RLS policies. Give me the SQL to run.
3. Build a shared layout component with the gradient background, nav, footer, decorative SVG sparkles. This is the storybook frame everything else lives in.
4. Build static pages (home, about, FAQ) with copy from `WEBSITE_COPY.md`.
5. Build the order form with validation and live price calculation.
6. Wire form to Supabase + Resend email notification.
7. Build admin auth + dashboard.
8. Polish, mobile QA, deploy instructions.

## What I'll provide when asked
- Supabase project URL + anon key
- Resend API key
- Domain (joscupcakes.com) — I'll handle DNS
- 4-6 cupcake photos for the gallery (placeholders OK to start)
- Logo if/when I have one (use text-only `Jo's Cupcakes` in IM Fell English SC for now)
