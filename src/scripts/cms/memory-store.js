/**
 * Unified Memory Store for KruuuuLove
 * - Manages memory data across Supabase (Production) and IndexedDB (Local Fallback)
 * - Guarantees default memories are preserved and migrated seamlessly
 * - Dispatches updates to UI listeners instantly
 */

import { MEMORIES as DEFAULT_MEMORIES } from '../../data/memories.js';
import { CMS_CONFIG, isSupabaseConfigured } from './config.js';
import { optimizeImage, validateImageFile } from './image-optimizer.js';
import {
  getLocalMemories,
  saveLocalMemory,
  deleteLocalMemory,
  saveLocalImage
} from './storage-local.js';
import {
  fetchSupabaseMemories,
  insertSupabaseMemory,
  updateSupabaseMemory,
  deleteSupabaseMemory,
  uploadSupabaseImage,
  deleteSupabaseImage,
  loginSupabaseAuth,
  logoutSupabaseAuth,
  hasSupabaseSession
} from './supabase-client.js';

class MemoryStore {
  constructor() {
    this.memories = [];
    this.listeners = new Set();
    this.isInitialized = false;
    this.adminActive = false;
    this.backendType = 'local'; // 'supabase' | 'local'
  }

  /**
   * Subscribe to state changes (memories updated, admin state changed)
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      memories: this.getMemories(),
      isAdmin: this.isAdmin(),
      backendType: this.backendType
    };
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('MemoryStore subscriber error:', err);
      }
    });
  }

  getMemories() {
    return [...this.memories];
  }

  isAdmin() {
    return this.adminActive;
  }

  /**
   * Format default memories to consistent schema
   */
  getDefaultMemoriesFormatted() {
    return DEFAULT_MEMORIES.map((m, index) => ({
      id: m.id || `mem-${index + 1}`,
      title: m.title || '',
      caption: m.caption || '',
      details: m.details || m.caption || '',
      image: m.image || '',
      date: m.date || '',
      location: m.location || '',
      category: m.category || '',
      order_index: index,
      created_at: new Date('2026-08-15T00:00:00Z').toISOString()
    }));
  }

  /**
   * Initialize Store: Fetch from Supabase or IndexedDB
   */
  async init() {
    if (this.isInitialized) return this.memories;

    // Check stored admin session
    await this.restoreAdminSession();

    if (isSupabaseConfigured()) {
      try {
        const supabaseData = await fetchSupabaseMemories();
        if (supabaseData && supabaseData.length > 0) {
          this.backendType = 'supabase';
          this.memories = supabaseData;
          this.isInitialized = true;
          this.notify();
          return this.memories;
        } else if (supabaseData && supabaseData.length === 0) {
          // Table exists but empty -> Seed initial memories to Supabase
          this.backendType = 'supabase';
          const defaultList = this.getDefaultMemoriesFormatted();
          console.log('Seeding default memories to Supabase...');
          for (const item of defaultList) {
            try {
              await insertSupabaseMemory(item);
            } catch (seedErr) {
              console.warn('Seed insert note:', seedErr.message);
            }
          }
          const recheck = await fetchSupabaseMemories();
          this.memories = (recheck && recheck.length > 0) ? recheck : defaultList;
          this.isInitialized = true;
          this.notify();
          return this.memories;
        }
      } catch (err) {
        console.warn('Failed to load from Supabase, falling back to local store:', err);
      }
    }

    // Local Fallback (IndexedDB)
    this.backendType = 'local';
    try {
      const localList = await getLocalMemories();
      if (localList && localList.length > 0) {
        // Sort by order_index
        this.memories = localList.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      } else {
        // Seed default memories to IndexedDB
        const defaultList = this.getDefaultMemoriesFormatted();
        for (const item of defaultList) {
          await saveLocalMemory(item);
        }
        this.memories = defaultList;
      }
    } catch (err) {
      console.warn('Local store init fallback:', err);
      this.memories = this.getDefaultMemoriesFormatted();
    }

    this.isInitialized = true;
    this.notify();
    return this.memories;
  }

  /**
   * Check and restore admin session
   */
  async restoreAdminSession() {
    try {
      if (isSupabaseConfigured()) {
        const hasSession = await hasSupabaseSession();
        if (hasSession) {
          this.adminActive = true;
          return true;
        }
      }

      const storedLocalSession = sessionStorage.getItem('kruuuu_admin_session');
      if (storedLocalSession === 'true') {
        this.adminActive = true;
        return true;
      }
    } catch {
      // Ignore session restore errors
    }
    this.adminActive = false;
    return false;
  }

  /**
   * Admin Login
   * @param {object} credentials { email, password, passkey }
   */
  async loginAdmin({ email, password, passkey }) {
    if (isSupabaseConfigured()) {
      if (!email || !password) {
        throw new Error('Please enter both admin email and password.');
      }
      try {
        await loginSupabaseAuth(email, password);
        this.adminActive = true;
        sessionStorage.setItem('kruuuu_admin_session', 'true');
        this.notify();
        return { success: true, mode: 'supabase' };
      } catch (err) {
        throw new Error(`Authentication failed: ${err.message}`);
      }
    } else {
      // Local Mode: check passkey or password
      const entered = (passkey || password || '').trim();
      if (!entered) {
        throw new Error('Please enter the admin password / passkey.');
      }
      if (entered === CMS_CONFIG.adminPassword) {
        this.adminActive = true;
        sessionStorage.setItem('kruuuu_admin_session', 'true');
        this.notify();
        return { success: true, mode: 'local' };
      } else {
        throw new Error('Incorrect admin password. Please try again.');
      }
    }
  }

  /**
   * Admin Logout
   */
  async logoutAdmin() {
    this.adminActive = false;
    sessionStorage.removeItem('kruuuu_admin_session');
    if (isSupabaseConfigured()) {
      try {
        await logoutSupabaseAuth();
      } catch {
        // Ignore logout errors
      }
    }
    this.notify();
  }

  /**
   * Add a new memory
   * @param {object} param0
   */
  async addMemory({ title, caption, details, date, location, category, imageFile }) {
    if (!this.adminActive) {
      throw new Error('Admin authorization required to add memories.');
    }

    // Validation
    const cleanTitle = (title || '').trim();
    const cleanCaption = (caption || '').trim();
    const cleanDetails = (details || '').trim();

    if (!cleanTitle) throw new Error('Please provide a memory title.');
    if (!cleanCaption) throw new Error('Please provide a short description.');
    if (!cleanDetails) throw new Error('Please write the full memory paragraph.');
    if (!imageFile) throw new Error('Please select a photo for this memory.');

    const validation = validateImageFile(imageFile);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Optimize image
    const optimized = await optimizeImage(imageFile);

    const nextOrder = this.memories.reduce((max, m) => Math.max(max, m.order_index ?? 0), -1) + 1;
    const newId = `mem-${Date.now()}`;
    const cleanDate = (date || '').trim() || new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

    let imageUrl = '';

    if (isSupabaseConfigured() && this.backendType === 'supabase') {
      try {
        imageUrl = await uploadSupabaseImage(optimized.blob, optimized.filename);
      } catch (err) {
        throw new Error(`Image upload failed: ${err.message}`);
      }
    } else {
      // Local mode: store image in IndexedDB
      imageUrl = await saveLocalImage(newId, optimized.dataUrl);
    }

    const memoryRecord = {
      id: newId,
      title: cleanTitle,
      caption: cleanCaption,
      details: cleanDetails,
      image: imageUrl,
      date: cleanDate,
      location: (location || '').trim(),
      category: (category || '').trim() || 'New Memory',
      order_index: nextOrder,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && this.backendType === 'supabase') {
      try {
        await insertSupabaseMemory(memoryRecord);
      } catch (err) {
        throw new Error(`Database save failed: ${err.message}`);
      }
    } else {
      await saveLocalMemory(memoryRecord);
    }

    this.memories.push(memoryRecord);
    this.notify();
    return memoryRecord;
  }

  /**
   * Update an existing memory
   * @param {string} id
   * @param {object} param1
   */
  async updateMemory(id, { title, caption, details, date, location, category, imageFile }) {
    if (!this.adminActive) {
      throw new Error('Admin authorization required to edit memories.');
    }

    const index = this.memories.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Memory not found.');
    }

    const current = this.memories[index];
    const cleanTitle = (title || '').trim();
    const cleanCaption = (caption || '').trim();
    const cleanDetails = (details || '').trim();

    if (!cleanTitle) throw new Error('Please provide a memory title.');
    if (!cleanCaption) throw new Error('Please provide a short description.');
    if (!cleanDetails) throw new Error('Please write the full memory paragraph.');

    let imageUrl = current.image;

    if (imageFile) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const optimized = await optimizeImage(imageFile);

      if (isSupabaseConfigured() && this.backendType === 'supabase') {
        imageUrl = await uploadSupabaseImage(optimized.blob, optimized.filename);
        if (current.image && current.image.includes('/storage/v1/object/public/memories/')) {
          deleteSupabaseImage(current.image).catch(() => {});
        }
      } else {
        imageUrl = await saveLocalImage(id, optimized.dataUrl);
      }
    }

    const updatedRecord = {
      ...current,
      title: cleanTitle,
      caption: cleanCaption,
      details: cleanDetails,
      date: date !== undefined ? date.trim() : current.date,
      location: location !== undefined ? location.trim() : current.location,
      category: category !== undefined ? category.trim() : current.category,
      image: imageUrl
    };

    if (isSupabaseConfigured() && this.backendType === 'supabase') {
      try {
        await updateSupabaseMemory(id, updatedRecord);
      } catch (err) {
        throw new Error(`Database update failed: ${err.message}`);
      }
    } else {
      await saveLocalMemory(updatedRecord);
    }

    this.memories[index] = updatedRecord;
    this.notify();
    return updatedRecord;
  }

  /**
   * Delete a memory
   * @param {string} id
   */
  async deleteMemory(id) {
    if (!this.adminActive) {
      throw new Error('Admin authorization required to delete memories.');
    }

    const memory = this.memories.find((m) => m.id === id);
    if (!memory) return false;

    if (isSupabaseConfigured() && this.backendType === 'supabase') {
      try {
        await deleteSupabaseMemory(id);
        if (memory.image && memory.image.includes('/storage/v1/object/public/memories/')) {
          deleteSupabaseImage(memory.image).catch(() => {});
        }
      } catch (err) {
        throw new Error(`Database deletion failed: ${err.message}`);
      }
    } else {
      await deleteLocalMemory(id);
    }

    this.memories = this.memories.filter((m) => m.id !== id);
    this.notify();
    return true;
  }
}

export const memoryStore = new MemoryStore();
