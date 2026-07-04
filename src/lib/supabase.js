/*
 * Supabase client — cloud mode activates only when env vars are present.
 * Without them the whole app runs in "local mode" (localStorage), unchanged.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const cloudEnabled = Boolean(url && key)
export const supabase = cloudEnabled ? createClient(url, key) : null
