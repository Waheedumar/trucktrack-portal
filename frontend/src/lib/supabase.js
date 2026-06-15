import { createClient } from '@supabase/supabase-js'

let client = null

function getClient() {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (url && key) client = createClient(url, key)
  }
  return client
}

export function isStorageConfigured() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export async function uploadDocument(file, loadId) {
  const sb = getClient()
  if (!sb) throw new Error('Supabase storage not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `loads/${loadId}/${Date.now()}_${safeName}`

  const { error } = await sb.storage.from('documents').upload(path, file, { upsert: false })
  if (error) throw new Error(error.message)

  const { data } = sb.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}
