import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from './supabase'

// Comprime (calidad 0.7, ancho máx. 1280px) y sube a Supabase Storage. Devuelve la ruta dentro del bucket.
export async function compressImage(uri: string) {
  const r = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1280 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG })
  return r.uri
}
export async function uploadImage(bucket: string, userId: string, uri: string, compress = true) {
  const finalUri = compress ? await compressImage(uri) : uri
  const buf = await (await fetch(finalUri)).arrayBuffer()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, buf, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}
export async function signedUrls(bucket: string, paths: (string | null | undefined)[]) {
  const clean = paths.filter(Boolean) as string[]
  if (!clean.length) return {} as Record<string, string>
  const { data } = await supabase.storage.from(bucket).createSignedUrls(clean, 3600)
  const m: Record<string, string> = {}
  data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl })
  return m
}
