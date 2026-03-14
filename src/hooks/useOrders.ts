// src/hooks/useOrders.ts
// ─────────────────────────────────────────────────────────────
// Orders hook — CRUD + real-time subscription via Supabase
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, OrderInsert, OrderStatus } from '../lib/database.types'

interface UseOrdersOptions {
  status?:   OrderStatus
  limit?:    number
  realtime?: boolean          // subscribe to live changes
}

export function useOrders(opts: UseOrdersOptions = {}) {
  const { status, limit = 50, realtime = true } = opts

  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // ── Fetch ─────────────────────────────────────────────────
  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select(`
        *,
        patient:patients (id, full_name, dob, gender, blood_group, phone),
        created_by_staff:staff (id, full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) { setError(error.message) }
    else        { setOrders(data as Order[]) }
    setLoading(false)
  }, [status, limit])

  // ── Create ─────────────────────────────────────────────────
  const createOrder = async (
    payload: Omit<OrderInsert, 'created_by'>,
    testIds: string[]
  ): Promise<Order | null> => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({ ...payload, created_by: user?.id })
      .select()
      .single()

    if (oErr || !order) { setError(oErr?.message ?? 'Order creation failed'); return null }

    // Insert junction rows
    const junctionRows = testIds.map(tid => ({ order_id: order.id, test_id: tid }))
    const { error: jErr } = await supabase.from('order_tests').insert(junctionRows)
    if (jErr) { setError(jErr.message); return null }

    await fetch()
    return order as Order
  }

  // ── Update status ─────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const patch: Partial<Order> = { status: newStatus }
    if (newStatus === 'complete') {
      const { data: { user } } = await supabase.auth.getUser()
      patch.completed_by = user?.id
      patch.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
    if (error) setError(error.message)
    else       await fetch()
  }

  // ── Real-time subscription ────────────────────────────────
  useEffect(() => {
    fetch()
    if (!realtime) return

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch, realtime])

  // ── Stats helper ──────────────────────────────────────────
  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'pending').length,
    progress: orders.filter(o => o.status === 'in_progress').length,
    complete: orders.filter(o => o.status === 'complete').length,
    urgent:   orders.filter(o => o.priority === 'urgent' || o.priority === 'critical').length,
  }

  return { orders, loading, error, stats, fetch, createOrder, updateStatus }
}
