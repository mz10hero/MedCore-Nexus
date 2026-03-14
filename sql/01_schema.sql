-- ═══════════════════════════════════════════════════════════
-- LABCORE LIS — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── ENUM Types ────────────────────────────────────────────────
create type user_role      as enum ('lab_tech', 'supervisor', 'admin');
create type order_status   as enum ('pending', 'in_progress', 'complete', 'cancelled');
create type order_priority as enum ('normal', 'urgent', 'critical');
create type result_flag    as enum ('N', 'H', 'L', 'HH', 'LL');
create type gender_type    as enum ('male', 'female', 'other');

-- ── Table: staff ──────────────────────────────────────────────
-- mirrors auth.users — created automatically via trigger
create table public.staff (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  role        user_role   not null default 'lab_tech',
  employee_id text        unique,
  phone       text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.staff is 'Lab staff profiles linked to Supabase Auth users';

-- ── Table: patients ───────────────────────────────────────────
create table public.patients (
  id          uuid primary key default uuid_generate_v4(),
  full_name   text        not null,
  dob         date,
  gender      gender_type,
  blood_group text,
  phone       text,
  address     text,
  notes       text,
  created_by  uuid references public.staff(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.patients is 'Patient master records';

-- ── Table: tests_catalog ──────────────────────────────────────
create table public.tests_catalog (
  id          uuid primary key default uuid_generate_v4(),
  test_name   text    not null,
  abbreviation text   not null,
  unit        text    not null,
  normal_min  numeric,
  normal_max  numeric,
  category    text    not null,   -- e.g. 'CBC', 'Coagulation', 'LFT'
  description text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
comment on table public.tests_catalog is 'Master list of all available lab tests with reference ranges';

-- ── Table: orders ─────────────────────────────────────────────
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text unique not null,  -- e.g. ORD-0001
  patient_id      uuid not null references public.patients(id),
  ordered_by      text,                  -- referring physician name
  priority        order_priority not null default 'normal',
  status          order_status   not null default 'pending',
  clinical_notes  text,
  created_by      uuid references public.staff(id),
  completed_by    uuid references public.staff(id),
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  updated_at      timestamptz not null default now()
);
comment on table public.orders is 'Lab test orders';

-- ── Table: order_tests ────────────────────────────────────────
-- junction: which tests belong to which order
create table public.order_tests (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid not null references public.orders(id)         on delete cascade,
  test_id    uuid not null references public.tests_catalog(id),
  created_at timestamptz not null default now(),
  unique(order_id, test_id)
);

-- ── Table: results ────────────────────────────────────────────
create table public.results (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  test_id     uuid        not null references public.tests_catalog(id),
  value       numeric,
  value_text  text,        -- for non-numeric results (e.g. culture)
  flag        result_flag,
  is_abnormal boolean     not null default false,
  entered_by  uuid        references public.staff(id),
  entered_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(order_id, test_id)
);
comment on table public.results is 'Individual test result values per order';

-- ── Auto-increment order number ───────────────────────────────
create sequence order_number_seq start 1;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'ORD-' || lpad(nextval('order_number_seq')::text, 4, '0');
  return new;
end;
$$;

create trigger set_order_number
  before insert on public.orders
  for each row
  when (new.order_number is null)
  execute function generate_order_number();

-- ── Auto-set result flag ──────────────────────────────────────
create or replace function set_result_flag()
returns trigger language plpgsql as $$
declare
  tc public.tests_catalog%rowtype;
begin
  select * into tc from public.tests_catalog where id = new.test_id;
  if new.value is not null and tc.normal_min is not null and tc.normal_max is not null then
    if    new.value > tc.normal_max * 1.5 then new.flag := 'HH';
    elsif new.value > tc.normal_max       then new.flag := 'H';
    elsif new.value < tc.normal_min * 0.5 then new.flag := 'LL';
    elsif new.value < tc.normal_min       then new.flag := 'L';
    else                                       new.flag := 'N';
    end if;
    new.is_abnormal := new.flag <> 'N';
  end if;
  return new;
end;
$$;

create trigger auto_flag_result
  before insert or update on public.results
  for each row execute function set_result_flag();

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger touch_patients  before update on public.patients  for each row execute function touch_updated_at();
create trigger touch_orders    before update on public.orders    for each row execute function touch_updated_at();
create trigger touch_results   before update on public.results   for each row execute function touch_updated_at();
create trigger touch_staff     before update on public.staff     for each row execute function touch_updated_at();

-- ── Auto-create staff profile on signup ───────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.staff (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'lab_tech')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Indexes ───────────────────────────────────────────────────
create index idx_orders_patient    on public.orders(patient_id);
create index idx_orders_status     on public.orders(status);
create index idx_orders_created    on public.orders(created_at desc);
create index idx_results_order     on public.results(order_id);
create index idx_results_flag      on public.results(flag) where flag <> 'N';
create index idx_patients_name     on public.patients using gin(to_tsvector('simple', full_name));
