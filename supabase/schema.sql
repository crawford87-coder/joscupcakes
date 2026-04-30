-- ============================================================
-- Jo's Cupcakes — Supabase Schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

-- Orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique not null,
  created_at timestamptz default now(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_date date not null,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  delivery_address text,
  quantity int not null check (quantity in (6, 12, 18, 24, 36)),
  flavor text not null check (flavor in ('chocolate', 'vanilla')),
  icing_colors jsonb,
  topper boolean default false,
  topper_description text,
  sprinkles_or_glitter text check (sprinkles_or_glitter in ('sprinkles', 'glitter', null)),
  notes text,
  total_price numeric(10,2) not null,
  pickup_time text,
  status text default 'new' check (status in ('new', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'))
);

-- Row Level Security
alter table orders enable row level security;

-- Only authenticated admin (Jo) can read and update
create policy "Admin can read orders"
  on orders for select
  to authenticated
  using (true);

create policy "Admin can update orders"
  on orders for update
  to authenticated
  using (true);

-- Public API route inserts orders (anon role used by the route handler with anon key)
create policy "Service role can insert orders"
  on orders for insert
  to anon
  with check (true);

-- Index for admin dashboard (sort by pickup_date)
create index if not exists orders_pickup_date_idx on orders (pickup_date asc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);

-- ============================================================
-- Migration: run this if the orders table already exists
-- ============================================================
alter table orders add column if not exists pickup_time text;
alter table orders add column if not exists reference_image_url text;
alter table orders add column if not exists stripe_session_id text;

-- Update status check constraint to include awaiting_payment
-- Run these two lines if the orders table already exists:
-- alter table orders drop constraint orders_status_check;
-- alter table orders add constraint orders_status_check check (status in ('new', 'awaiting_payment', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'));

-- ============================================================
-- Customer notes / CRM table
-- Run this migration in the Supabase SQL editor
-- ============================================================
create table if not exists customer_notes (
  email text primary key,
  notes text,
  address text,
  child_name text,
  birthday_month int check (birthday_month between 1 and 12),
  reminder_sent_at timestamptz,
  updated_at timestamptz default now()
);

alter table customer_notes enable row level security;

create policy "Admin can read customer notes"
  on customer_notes for select
  to authenticated
  using (true);

create policy "Admin can insert customer notes"
  on customer_notes for insert
  to authenticated
  with check (true);

create policy "Admin can update customer notes"
  on customer_notes for update
  to authenticated
  using (true);

-- ============================================================
-- Storage: reference images bucket
-- Run this in the Supabase SQL editor (or create via dashboard)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true)
on conflict (id) do nothing;

-- Allow anonymous uploads (from the order form)
create policy "Public can upload reference images"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'reference-images');

-- Allow public read access (so Jo can view images in admin)
create policy "Public can read reference images"
  on storage.objects for select
  to public
  using (bucket_id = 'reference-images');
