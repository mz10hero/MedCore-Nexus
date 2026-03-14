# LabCore LIS — Laboratory Information System
> Medical lab dashboard — Phase 4: Database & Auth

---

## Stack
| Layer    | Choice               |
|----------|----------------------|
| Frontend | React + TypeScript + TailwindCSS |
| Backend  | Supabase (Auth + DB + Realtime)  |
| Database | PostgreSQL via Supabase          |
| Hosting  | Vercel                           |

---

## Quick Start

### 1. Create Supabase Project
1. Go to https://supabase.com/dashboard
2. New Project → choose a region close to Iraq/Middle East (e.g. EU West)
3. Copy **Project URL** and **anon public key**

### 2. Run SQL Files (in order)
In Supabase Dashboard → SQL Editor:
```
sql/01_schema.sql   ← tables, triggers, indexes
sql/02_rls.sql      ← Row Level Security policies
sql/03_seed.sql     ← test catalog (CBC, LFT, etc.)
```

### 3. Configure Environment
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 4. Install & Run
```bash
npm install
npm run dev
```

---

## File Structure
```
labcore/
├── sql/
│   ├── 01_schema.sql       ← DB schema + triggers
│   ├── 02_rls.sql          ← RLS policies per role
│   └── 03_seed.sql         ← tests catalog data
│
└── src/
    ├── lib/
    │   ├── supabase.ts         ← Supabase client singleton
    │   └── database.types.ts   ← TypeScript types
    │
    ├── hooks/
    │   ├── useAuth.ts          ← Auth + staff profile
    │   ├── useOrders.ts        ← Orders CRUD + realtime
    │   └── useResults.ts       ← Results upsert + flags
    │
    ├── components/             ← Shared UI components
    ├── pages/                  ← Route-level pages
    └── App.tsx                 ← Router + auth context
```

---

## Role Permissions Matrix

| Action                   | lab_tech | supervisor | admin |
|--------------------------|----------|------------|-------|
| View patients/orders     | ✓        | ✓          | ✓     |
| Create patient           | ✓        | ✓          | ✓     |
| Create order             | ✓        | ✓          | ✓     |
| Enter results            | ✓        | ✓          | ✓     |
| Update any order         | ✗        | ✓          | ✓     |
| Update any result        | ✗        | ✓          | ✓     |
| Modify tests catalog     | ✗        | ✓          | ✓     |
| Delete records           | ✗        | ✗          | ✓     |

---

## Key Design Decisions

**Auto-flagging via DB trigger** — `set_result_flag()` runs on every
`INSERT/UPDATE` on `results`, comparing the value against `tests_catalog`
reference ranges and setting `flag` (N/H/L/HH/LL) automatically.
No client-side flag logic needed.

**Auto order numbers** — `generate_order_number()` trigger generates
`ORD-0001` style numbers via a PostgreSQL sequence. No race conditions.

**Real-time updates** — `useOrders` subscribes to Postgres changes via
Supabase Realtime. Multiple technicians see live order status updates.

**RLS as the security layer** — All business logic for data access
lives in Postgres, not in the React app. Even direct API calls
respect role-based permissions.

---

## Creating the First Admin User

After running the SQL files, create a user via Supabase Auth dashboard,
then update their role:

```sql
update public.staff
set role = 'admin'
where id = 'USER_UUID_HERE';
```

---

## Production Checklist
- [ ] Enable Supabase Email confirmation
- [ ] Set up custom SMTP for auth emails
- [ ] Add Supabase backups (daily)
- [ ] Configure Vercel environment variables
- [ ] Set `SITE_URL` in Supabase Auth settings
- [ ] Review RLS policies with `supabase inspect db lint`
