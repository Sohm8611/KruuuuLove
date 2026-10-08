/**
 * Supabase Client Integration for KruuuuLove CMS
 * - Persistent PostgreSQL storage for memories metadata
 * - Cloud Object Storage for optimized memory photos
 * - Row Level Security (RLS) protected writes via Supabase Auth
 * - Public read access for visitors
 */

import { createClient } from '@supabase/supabase-js';
import { CMS_CONFIG, isSupabaseConfigured } from './config.js';

let supabase = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabase) {
    try {
      supabase = createClient(CMS_CONFIG.supabaseUrl, CMS_CONFIG.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      supabase = null;
    }
  }

  return supabase;
}

/**
 * Fetch all memories from Supabase table 'memories'
 * Ordered by order_index ASC
 * @returns {Promise<Array|null>}
 */
export async function fetchSupabaseMemories() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('memories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('Supabase fetch memories error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Insert a memory into Supabase
 * @param {object} memory
 * @returns {Promise<object>}
 */
export async function insertSupabaseMemory(memory) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');

  const { data, error } = await client
    .from('memories')
    .insert([memory])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save memory to Supabase: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing memory in Supabase
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateSupabaseMemory(id, updates) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');

  const { data, error } = await client
    .from('memories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update memory in Supabase: ${error.message}`);
  }

  return data;
}

/**
 * Delete a memory from Supabase
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteSupabaseMemory(id) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');

  const { error } = await client
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete memory from Supabase: ${error.message}`);
  }

  return true;
}

/**
 * Upload an image blob to Supabase Storage bucket 'memories'
 * @param {Blob} blob
 * @param {string} filename
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadSupabaseImage(blob, filename) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');

  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `photos/${Date.now()}_${cleanName}`;

  const { data, error } = await client.storage
    .from('memories')
    .upload(path, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = client.storage
    .from('memories')
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve public image URL from Supabase storage');
  }

  return publicUrlData.publicUrl;
}

/**
 * Delete an image from Supabase storage by its public URL
 * @param {string} imageUrl
 */
export async function deleteSupabaseImage(imageUrl) {
  const client = getSupabase();
  if (!client || !imageUrl) return;

  try {
    const marker = '/storage/v1/object/public/memories/';
    const index = imageUrl.indexOf(marker);
    if (index !== -1) {
      const filePath = imageUrl.substring(index + marker.length);
      await client.storage.from('memories').remove([filePath]);
    }
  } catch (err) {
    console.warn('Failed to delete old image from storage:', err);
  }
}

/**
 * Supabase Auth: Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function loginSupabaseAuth(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Supabase Auth: Sign out
 */
export async function logoutSupabaseAuth() {
  const client = getSupabase();
  if (!client) return;
  await client.auth.signOut();
}

/**
 * Check if a Supabase authenticated session exists
 * @returns {Promise<boolean>}
 */
export async function hasSupabaseSession() {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { data } = await client.auth.getSession();
    return Boolean(data && data.session && data.session.user);
  } catch {
    return false;
  }
}
