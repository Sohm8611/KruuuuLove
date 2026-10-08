/**
 * Local IndexedDB Provider for KruuuuLove CMS
 * - Stores memories metadata and image blobs locally when Supabase is not configured or offline
 * - Guarantees full offline persistence and seamless local development
 * - No 5MB quota restrictions like localStorage
 */

const DB_NAME = 'kruuuu_love_cms_db';
const DB_VERSION = 1;
const STORE_MEMORIES = 'memories';
const STORE_IMAGES = 'images';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

/**
 * Get all local memories
 * @returns {Promise<Array>}
 */
export async function getLocalMemories() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAll failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem('kruuuu_local_memories');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Save or update a memory in local DB
 * @param {object} memory
 * @returns {Promise<object>}
 */
export async function saveLocalMemory(memory) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readwrite');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.put(memory);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB put failed, syncing to localStorage:', err);
  }

  // Also sync metadata list to localStorage as backup
  try {
    const list = await getLocalMemories();
    const filtered = list.filter(m => m.id !== memory.id);
    filtered.push(memory);
    // Don't store massive data URLs in localStorage to avoid quota issues
    const safeList = filtered.map(m => ({
      ...m,
      image: m.image && m.image.startsWith('data:') ? m.image.substring(0, 100) + '...' : m.image
    }));
    localStorage.setItem('kruuuu_local_memories', JSON.stringify(safeList));
  } catch {
    // Ignore localStorage quota errors
  }

  return memory;
}

/**
 * Delete a memory from local DB
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteLocalMemory(id) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEMORIES, STORE_IMAGES], 'readwrite');
      tx.objectStore(STORE_MEMORIES).delete(id);
      tx.objectStore(STORE_IMAGES).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
    return false;
  }
}

/**
 * Store an image blob locally
 * @param {string} id
 * @param {Blob|string} blobOrDataUrl
 * @returns {Promise<string>} Blob URL or data URL
 */
export async function saveLocalImage(id, blobOrDataUrl) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.put({ id, data: blobOrDataUrl });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save image in IndexedDB:', err);
  }

  if (typeof blobOrDataUrl === 'string') {
    return blobOrDataUrl;
  }
  return URL.createObjectURL(blobOrDataUrl);
}

/**
 * Clear all local memory records (for resets)
 */
export async function clearLocalMemories() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEMORIES, STORE_IMAGES], 'readwrite');
      tx.objectStore(STORE_MEMORIES).clear();
      tx.objectStore(STORE_IMAGES).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.removeItem('kruuuu_local_memories');
  } catch (err) {
    console.warn('clearLocalMemories failed:', err);
  }
}
