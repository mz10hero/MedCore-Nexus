// src/lib/database.types.ts
// Auto-generate this file in production with:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type UserRole      = 'lab_tech' | 'supervisor' | 'admin'
export type OrderStatus   = 'pending' | 'in_progress' | 'complete' | 'cancelled'
export type OrderPriority = 'normal' | 'urgent' | 'critical'
export type ResultFlag    = 'N' | 'H' | 'L' | 'HH' | 'LL'
export type GenderType    = 'male' | 'female' | 'other'

// ── Row types ─────────────────────────────────────────────────

export interface Staff {
  id:          string
  full_name:   string
  role:        UserRole
  employee_id: string | null
  phone:       string | null
  is_active:   boolean
  created_at:  string
  updated_at:  string
}

export interface Patient {
  id:          string
  full_name:   string
  dob:         string | null
  gender:      GenderType | null
  blood_group: string | null
  phone:       string | null
  address:     string | null
  notes:       string | null
  created_by:  string | null
  created_at:  string
  updated_at:  string
}

export interface TestCatalog {
  id:           string
  test_name:    string
  abbreviation: string
  unit:         string
  normal_min:   number | null
  normal_max:   number | null
  category:     string
  description:  string | null
  is_active:    boolean
  sort_order:   number
  created_at:   string
}

export interface Order {
  id:             string
  order_number:   string
  patient_id:     string
  ordered_by:     string | null
  priority:       OrderPriority
  status:         OrderStatus
  clinical_notes: string | null
  created_by:     string | null
  completed_by:   string | null
  created_at:     string
  completed_at:   string | null
  updated_at:     string
  // joined
  patient?:       Patient
  created_by_staff?: Staff
}

export interface Result {
  id:          string
  order_id:    string
  test_id:     string
  value:       number | null
  value_text:  string | null
  flag:        ResultFlag | null
  is_abnormal: boolean
  entered_by:  string | null
  entered_at:  string
  updated_at:  string
  // joined
  test?:       TestCatalog
}

// ── Insert types ──────────────────────────────────────────────

export type PatientInsert = Omit<Patient, 'id' | 'created_at' | 'updated_at'>
export type OrderInsert   = Omit<Order,   'id' | 'order_number' | 'created_at' | 'updated_at' | 'completed_at' | 'patient' | 'created_by_staff'>
export type ResultInsert  = Omit<Result,  'id' | 'entered_at' | 'updated_at' | 'test'>

// ── Supabase Database generic type (used by createClient<Database>) ──
export interface Database {
  public: {
    Tables: {
      staff:          { Row: Staff;       Insert: Partial<Staff>;        Update: Partial<Staff>        }
      patients:       { Row: Patient;     Insert: PatientInsert;         Update: Partial<Patient>      }
      tests_catalog:  { Row: TestCatalog; Insert: Partial<TestCatalog>;  Update: Partial<TestCatalog>  }
      orders:         { Row: Order;       Insert: OrderInsert;           Update: Partial<Order>        }
      results:        { Row: Result;      Insert: ResultInsert;          Update: Partial<Result>       }
    }
  }
}
