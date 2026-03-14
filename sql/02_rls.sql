-- ═══════════════════════════════════════════════════════════
-- LABCORE LIS — Row Level Security (RLS) Policies
-- Run AFTER 01_schema.sql
-- ═══════════════════════════════════════════════════════════

-- ── Helper: current user role ─────────────────────────────────
create or replace function auth.user_role()
returns user_role language sql stable security definer as $$
  select role from public.staff where id = auth.uid()
$$;

-- ── Enable RLS on all tables ──────────────────────────────────
alter table public.staff         enable row level security;
alter table public.patients      enable row level security;
alter table public.tests_catalog enable row level security;
alter table public.orders        enable row level security;
alter table public.order_tests   enable row level security;
alter table public.results       enable row level security;

-- ════════════════════════════════════════════════════════════
-- STAFF TABLE
-- ════════════════════════════════════════════════════════════
-- Any authenticated user can see all staff (for dropdowns)
create policy "staff: all authenticated can view"
  on public.staff for select
  using (auth.uid() is not null);

-- Staff can update only their own profile
create policy "staff: own profile update"
  on public.staff for update
  using (id = auth.uid());

-- Only admins/supervisors can insert staff (edge case — normally via trigger)
create policy "staff: admins can insert"
  on public.staff for insert
  with check (auth.user_role() in ('admin', 'supervisor'));

-- ════════════════════════════════════════════════════════════
-- PATIENTS TABLE
-- ════════════════════════════════════════════════════════════
-- All authenticated staff can read patients
create policy "patients: authenticated read"
  on public.patients for select
  using (auth.uid() is not null);

-- All authenticated staff can create patients
create policy "patients: authenticated insert"
  on public.patients for insert
  with check (auth.uid() is not null);

-- Lab tech can update, supervisor/admin can update all
create policy "patients: staff update"
  on public.patients for update
  using (auth.uid() is not null);

-- Only admins can delete patient records
create policy "patients: admin delete only"
  on public.patients for delete
  using (auth.user_role() = 'admin');

-- ════════════════════════════════════════════════════════════
-- TESTS CATALOG TABLE
-- ════════════════════════════════════════════════════════════
-- Everyone can read the catalog
create policy "catalog: public read"
  on public.tests_catalog for select
  using (auth.uid() is not null);

-- Only supervisors/admins can modify catalog
create policy "catalog: supervisor manage"
  on public.tests_catalog for all
  using (auth.user_role() in ('supervisor', 'admin'));

-- ════════════════════════════════════════════════════════════
-- ORDERS TABLE
-- ════════════════════════════════════════════════════════════
-- All staff can view all orders
create policy "orders: all staff read"
  on public.orders for select
  using (auth.uid() is not null);

-- All staff can create orders
create policy "orders: all staff insert"
  on public.orders for insert
  with check (auth.uid() is not null);

-- Lab tech can update orders they created; supervisor can update any
create policy "orders: creator or supervisor update"
  on public.orders for update
  using (
    created_by = auth.uid()
    or auth.user_role() in ('supervisor', 'admin')
  );

-- Only admins can cancel/delete orders
create policy "orders: admin delete"
  on public.orders for delete
  using (auth.user_role() = 'admin');

-- ════════════════════════════════════════════════════════════
-- ORDER_TESTS (junction)
-- ════════════════════════════════════════════════════════════
create policy "order_tests: all staff read"
  on public.order_tests for select
  using (auth.uid() is not null);

create policy "order_tests: all staff insert"
  on public.order_tests for insert
  with check (auth.uid() is not null);

create policy "order_tests: creator or supervisor delete"
  on public.order_tests for delete
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.created_by = auth.uid() or auth.user_role() in ('supervisor','admin'))
    )
  );

-- ════════════════════════════════════════════════════════════
-- RESULTS TABLE
-- ════════════════════════════════════════════════════════════
-- All staff can view results
create policy "results: all staff read"
  on public.results for select
  using (auth.uid() is not null);

-- All active staff can enter results
create policy "results: active staff insert"
  on public.results for insert
  with check (
    auth.uid() is not null
    and exists (select 1 from public.staff where id = auth.uid() and is_active = true)
  );

-- Staff can update results they entered; supervisor can update any
create policy "results: entered_by or supervisor update"
  on public.results for update
  using (
    entered_by = auth.uid()
    or auth.user_role() in ('supervisor', 'admin')
  );

-- Only supervisors/admins can delete results
create policy "results: supervisor delete"
  on public.results for delete
  using (auth.user_role() in ('supervisor', 'admin'));
