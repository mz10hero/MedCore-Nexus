// src/hooks/useResults.ts
// ─────────────────────────────────────────────────────────────
// Results hook — fetch, upsert, and auto-flag lab results
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Result, ResultInsert } from '../lib/database.types'

export function useResults(orderId: string | null) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── Fetch results for an order ────────────────────────────
  const fetch = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('results')
      .select('*, test:tests_catalog(*)')
      .eq('order_id', orderId)

    if (error) setError(error.message)
    else       setResults(data as Result[])
    setLoading(false)
  }, [orderId])

  // ── Upsert a single result ────────────────────────────────
  // DB trigger auto-sets flag and is_abnormal
  const saveResult = async (testId: string, value: number | null, valueText?: string) => {
    if (!orderId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload: ResultInsert = {
      order_id:   orderId,
      test_id:    testId,
      value,
      value_text: valueText ?? null,
      flag:       null,        // set by DB trigger
      is_abnormal: false,      // set by DB trigger
      entered_by: user?.id ?? null,
    }

    const { error } = await supabase
      .from('results')
      .upsert(payload, { onConflict: 'order_id,test_id' })

    if (error) setError(error.message)
    else       await fetch()
    setSaving(false)
  }

  // ── Bulk upsert (save all at once) ────────────────────────
  const saveAllResults = async (
    entries: Array<{ testId: string; value: number | null; valueText?: string }>
  ) => {
    if (!orderId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const rows: ResultInsert[] = entries.map(e => ({
      order_id:    orderId,
      test_id:     e.testId,
      value:       e.value,
      value_text:  e.valueText ?? null,
      flag:        null,
      is_abnormal: false,
      entered_by:  user?.id ?? null,
    }))

    const { error } = await supabase
      .from('results')
      .upsert(rows, { onConflict: 'order_id,test_id' })

    if (error) setError(error.message)
    else       await fetch()
    setSaving(false)
  }

  useEffect(() => { fetch() }, [fetch])

  // ── Derived summaries ─────────────────────────────────────
  const summary = {
    total:   results.length,
    high:    results.filter(r => r.flag === 'H' || r.flag === 'HH').length,
    low:     results.filter(r => r.flag === 'L' || r.flag === 'LL').length,
    normal:  results.filter(r => r.flag === 'N').length,
    critical:results.filter(r => r.flag === 'HH' || r.flag === 'LL').length,
  }

  return { results, loading, saving, error, summary, saveResult, saveAllResults, refetch: fetch }
}
