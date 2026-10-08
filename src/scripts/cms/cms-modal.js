/**
 * KruuuuLove CMS Modal & Controller
 * Manages UI interactions for Add, Edit, Delete, Login, and Toasts
 */

import { memoryStore } from './memory-store.js';
import { isSupabaseConfigured } from './config.js';
import { validateImageFile, fileToDataUrl } from './image-optimizer.js';

let currentEditingId = null;
let selectedImageFile = null;
let memoryPendingDelete = null;

/**
 * Initialize CMS Modal & bind event listeners
 */
export function initCMS() {
  injectCMSDOM();
  bindGlobalEvents();
  updateAdminUI();

  // Listen to memory store changes
  memoryStore.subscribe(() => {
    updateAdminUI();
    renderManageList();
  });

  // Check URL hash for direct admin access (#admin)
  if (window.location.hash === '#admin') {
    handleOpenCMS();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      handleOpenCMS();
    }
  });
}

function handleOpenCMS() {
  if (memoryStore.isAdmin()) {
    openEditorModal();
  } else {
    openLoginModal();
  }
}

/**
 * Inject the CMS DOM structure into the body
 */
function injectCMSDOM() {
  // Prevent duplicate injection
  if (document.getElementById('cms-root')) return;

  const cmsRoot = document.createElement('div');
  cmsRoot.id = 'cms-root';
  cmsRoot.innerHTML = `
    <!-- Floating Admin Indicator (Visible when logged in) -->
    <div id="cms-admin-indicator" class="cms-admin-indicator" style="display: none;">
      <span class="cms-admin-dot"></span>
      <span id="cms-admin-status-text">Admin Active</span>
      <button id="cms-btn-logout" class="cms-admin-btn-logout" type="button">Log Out</button>
    </div>

    <!-- 1. Protected Admin Login Modal -->
    <div id="cms-login-backdrop" class="cms-modal-backdrop" aria-hidden="true">
      <div class="cms-modal-container cms-auth-card">
        <div class="cms-modal-header">
          <div class="cms-modal-title-group">
            <span class="cms-modal-subtitle">Private Access</span>
            <h3 class="cms-modal-title">Admin Verification</h3>
          </div>
          <button type="button" class="cms-modal-close-btn" data-close-modal="login">&times;</button>
        </div>
        <div class="cms-modal-body">
          <p style="font-size: var(--fs-small); color: var(--text-dark-secondary); margin-bottom: 1.25rem; line-height: 1.6;">
            Only the owner can add, edit, or delete memories from KruuuuLove.
          </p>

          <form id="cms-login-form" class="cms-form">
            <div id="cms-login-error" class="cms-alert-error"></div>

            <div id="cms-supabase-login-fields" style="display: none;">
              <div class="cms-form-group">
                <label class="cms-label" for="cms-auth-email">Admin Email</label>
                <input type="email" id="cms-auth-email" class="cms-input" placeholder="admin@example.com" autocomplete="email" />
              </div>
              <div class="cms-form-group" style="margin-top: 0.85rem;">
                <label class="cms-label" for="cms-auth-password">Admin Password</label>
                <input type="password" id="cms-auth-password" class="cms-input" placeholder="••••••••••••" autocomplete="current-password" />
              </div>
            </div>

            <div id="cms-local-login-fields">
              <div class="cms-form-group">
                <label class="cms-label" for="cms-auth-passkey">Admin Password</label>
                <input type="password" id="cms-auth-passkey" class="cms-input" placeholder="Enter admin passkey..." autocomplete="current-password" />
              </div>
              <p style="font-size: var(--fs-micro); color: var(--text-dark-muted); margin-top: 0.5rem;">
                Running in local mode. Default passkey: <code>kruuuu2026</code>
              </p>
            </div>

            <div class="cms-form-actions" style="margin-top: 1rem;">
              <button type="button" class="cms-btn-secondary" data-close-modal="login">Cancel</button>
              <button type="submit" id="cms-btn-submit-login" class="cms-btn-primary">Unlock CMS &rarr;</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 2. Main CMS Editor Modal (Add & Manage Memories) -->
    <div id="cms-editor-backdrop" class="cms-modal-backdrop" aria-hidden="true">
      <div class="cms-modal-container">
        <div class="cms-modal-header">
          <div class="cms-modal-title-group">
            <span class="cms-modal-subtitle" id="cms-header-subtitle">Memory Archive</span>
            <h3 class="cms-modal-title" id="cms-header-title">Add New Memory</h3>
          </div>
          <button type="button" class="cms-modal-close-btn" data-close-modal="editor">&times;</button>
        </div>

        <div class="cms-nav-tabs">
          <button type="button" class="cms-tab-btn active" id="cms-tab-form-btn">✦ Memory Editor</button>
          <button type="button" class="cms-tab-btn" id="cms-tab-manage-btn">✦ Manage All Memories (<span id="cms-memory-count">0</span>)</button>
        </div>

        <div class="cms-modal-body">
          <!-- Tab View 1: Form View -->
          <div id="cms-tab-form-view">
            <form id="cms-memory-form" class="cms-form">
              <div id="cms-form-error" class="cms-alert-error"></div>

              <!-- 1. Image Upload Dropzone -->
              <div class="cms-form-group">
                <label class="cms-label">
                  <span>Photograph</span>
                  <span class="cms-label-hint">JPG, PNG, WEBP (Optimized automatically)</span>
                </label>

                <!-- Dropzone Area -->
                <div id="cms-upload-dropzone" class="cms-upload-dropzone">
                  <input type="file" id="cms-field-image" class="cms-upload-input" accept="image/jpeg,image/png,image/webp" />
                  <div class="cms-upload-icon">&#128247;</div>
                  <div class="cms-upload-title">Choose a photo or drag here</div>
                  <div class="cms-upload-subtext">Optimized to high quality before saving</div>
                </div>

                <!-- Preview Area -->
                <div id="cms-image-preview-container" class="cms-image-preview-container" style="display: none;">
                  <img id="cms-image-preview" class="cms-image-preview-img" src="" alt="Memory preview" />
                  <div class="cms-image-preview-overlay">
                    <span id="cms-image-info">Photo ready</span>
                    <button type="button" id="cms-btn-remove-image" class="cms-btn-remove-preview">Change Photo</button>
                  </div>
                </div>
              </div>

              <!-- 2. Memory Title -->
              <div class="cms-form-group">
                <label class="cms-label" for="cms-field-title">
                  <span>Memory Title *</span>
                  <span class="cms-label-hint">e.g. Kinda surprise visit</span>
                </label>
                <input type="text" id="cms-field-title" class="cms-input" placeholder="Give this moment a title..." required />
              </div>

              <!-- 3. Short Description / Caption -->
              <div class="cms-form-group">
                <label class="cms-label" for="cms-field-caption">
                  <span>Short Description *</span>
                  <span class="cms-label-hint">Summary caption displayed on polaroid</span>
                </label>
                <input type="text" id="cms-field-caption" class="cms-input" placeholder="The time I came to meet you just because I was missing you..." required />
              </div>

              <!-- 4. Full Memory Paragraph -->
              <div class="cms-form-group">
                <label class="cms-label" for="cms-field-details">
                  <span>Full Memory Paragraph *</span>
                  <span class="cms-label-hint">The complete heartfelt story</span>
                </label>
                <textarea id="cms-field-details" class="cms-textarea cms-textarea-large" placeholder="Write the complete memory here. Every glance, feeling, laugh, and detail you want to remember forever..." required></textarea>
              </div>

              <!-- 5. Optional Date & Location -->
              <div class="cms-form-row">
                <div class="cms-form-group">
                  <label class="cms-label" for="cms-field-date">Date <span class="cms-label-hint">(Optional)</span></label>
                  <input type="text" id="cms-field-date" class="cms-input" placeholder="e.g. October 2026" />
                </div>
                <div class="cms-form-group">
                  <label class="cms-label" for="cms-field-location">Location <span class="cms-label-hint">(Optional)</span></label>
                  <input type="text" id="cms-field-location" class="cms-input" placeholder="e.g. Pune, Maharashtra" />
                </div>
              </div>

              <!-- Form Actions -->
              <div class="cms-form-actions">
                <button type="button" class="cms-btn-secondary" data-close-modal="editor">Cancel</button>
                <button type="submit" id="cms-btn-save-memory" class="cms-btn-primary">
                  <span id="cms-save-btn-text">Save Memory</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Tab View 2: Manage Memories List View -->
          <div id="cms-tab-manage-view" style="display: none;">
            <div id="cms-manage-list" class="cms-memory-list">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Delete Confirmation Modal -->
    <div id="cms-delete-backdrop" class="cms-modal-backdrop" aria-hidden="true">
      <div class="cms-modal-container cms-confirm-card">
        <div class="cms-modal-body" style="padding: 2.25rem 2rem;">
          <div class="cms-confirm-icon">&#128465;</div>
          <h4 class="cms-confirm-title">Delete this memory?</h4>
          <p class="cms-confirm-desc">
            Are you sure you want to delete <strong id="cms-delete-title-preview" style="color: var(--pink-deep);"></strong>?
            This action cannot be undone.
          </p>
          <div class="cms-confirm-actions">
            <button type="button" class="cms-btn-secondary" data-close-modal="delete">Keep Memory</button>
            <button type="button" id="cms-btn-confirm-delete" class="cms-btn-danger">Delete Memory</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Success Toast Notification -->
    <div id="cms-toast" class="cms-toast" role="status" aria-live="polite">
      <span class="cms-toast-heart">&hearts;</span>
      <span id="cms-toast-msg" class="cms-toast-msg">Memory saved with love!</span>
    </div>
  `;

  document.body.appendChild(cmsRoot);
}

/**
 * Bind DOM events
 */
function bindGlobalEvents() {
  // Add Memory trigger button in Memories section
  const addMemoryBtn = document.getElementById('btn-add-memory');
  if (addMemoryBtn) {
    addMemoryBtn.addEventListener('click', () => {
      handleOpenCMS();
    });
  }

  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalType = btn.getAttribute('data-close-modal');
      closeModal(modalType);
    });
  });

  // Close modals on backdrop click
  ['cms-login-backdrop', 'cms-editor-backdrop', 'cms-delete-backdrop'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          el.classList.remove('is-open');
        }
      });
    }
  });

  // Tabs toggle
  const tabFormBtn = document.getElementById('cms-tab-form-btn');
  const tabManageBtn = document.getElementById('cms-tab-manage-btn');
  const formView = document.getElementById('cms-tab-form-view');
  const manageView = document.getElementById('cms-tab-manage-view');

  tabFormBtn?.addEventListener('click', () => {
    tabFormBtn.classList.add('active');
    tabManageBtn?.classList.remove('active');
    if (formView) formView.style.display = 'block';
    if (manageView) manageView.style.display = 'none';
  });

  tabManageBtn?.addEventListener('click', () => {
    tabManageBtn.classList.add('active');
    tabFormBtn?.classList.remove('active');
    if (formView) formView.style.display = 'none';
    if (manageView) manageView.style.display = 'block';
    renderManageList();
  });

  // Admin Logout button
  document.getElementById('cms-btn-logout')?.addEventListener('click', async () => {
    await memoryStore.logoutAdmin();
    showToast('Logged out of admin mode');
  });

  // Login form submit
  document.getElementById('cms-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('cms-login-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }

    const submitBtn = document.getElementById('cms-btn-submit-login');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const email = document.getElementById('cms-auth-email')?.value;
      const password = document.getElementById('cms-auth-password')?.value;
      const passkey = document.getElementById('cms-auth-passkey')?.value;

      await memoryStore.loginAdmin({ email, password, passkey });
      closeModal('login');
      showToast('Admin verification successful ♥');
      openEditorModal();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Verification failed';
        errorEl.classList.add('is-visible');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Image input change
  const imageInput = document.getElementById('cms-field-image');
  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleImageSelected(file);
  });

  // Drag and drop events for dropzone
  const dropzone = document.getElementById('cms-upload-dropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) handleImageSelected(file);
    });
  }

  // Change image button
  document.getElementById('cms-btn-remove-image')?.addEventListener('click', () => {
    selectedImageFile = null;
    const previewContainer = document.getElementById('cms-image-preview-container');
    const dropzoneEl = document.getElementById('cms-upload-dropzone');
    const inputEl = document.getElementById('cms-field-image');

    if (previewContainer) previewContainer.style.display = 'none';
    if (dropzoneEl) dropzoneEl.style.display = 'block';
    if (inputEl) inputEl.value = '';
  });

  // Memory Editor Form Submit
  document.getElementById('cms-memory-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit();
  });

  // Confirm delete button
  document.getElementById('cms-btn-confirm-delete')?.addEventListener('click', async () => {
    if (!memoryPendingDelete) return;
    try {
      await memoryStore.deleteMemory(memoryPendingDelete.id);
      closeModal('delete');
      showToast(`Deleted "${memoryPendingDelete.title}"`);
      memoryPendingDelete = null;
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  });
}

/**
 * Handle image file selection
 */
async function handleImageSelected(file) {
  const errorEl = document.getElementById('cms-form-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    if (errorEl) {
      errorEl.textContent = validation.error;
      errorEl.classList.add('is-visible');
    }
    return;
  }

  selectedImageFile = file;

  try {
    const previewUrl = await fileToDataUrl(file);
    const previewImg = document.getElementById('cms-image-preview');
    const previewContainer = document.getElementById('cms-image-preview-container');
    const dropzone = document.getElementById('cms-upload-dropzone');
    const infoSpan = document.getElementById('cms-image-info');

    if (previewImg) previewImg.src = previewUrl;
    if (infoSpan) infoSpan.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
    if (previewContainer) previewContainer.style.display = 'block';
    if (dropzone) dropzone.style.display = 'none';
  } catch (err) {
    console.error('Preview error:', err);
  }
}

/**
 * Submit form: Add or Update Memory
 */
async function handleFormSubmit() {
  const errorEl = document.getElementById('cms-form-error');
  const saveBtn = document.getElementById('cms-btn-save-memory');
  const saveBtnText = document.getElementById('cms-save-btn-text');

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  }

  const title = document.getElementById('cms-field-title')?.value;
  const caption = document.getElementById('cms-field-caption')?.value;
  const details = document.getElementById('cms-field-details')?.value;
  const date = document.getElementById('cms-field-date')?.value;
  const location = document.getElementById('cms-field-location')?.value;

  if (saveBtn) saveBtn.disabled = true;
  if (saveBtnText) saveBtnText.textContent = currentEditingId ? 'Updating...' : 'Saving...';

  try {
    if (currentEditingId) {
      // Edit existing
      await memoryStore.updateMemory(currentEditingId, {
        title,
        caption,
        details,
        date,
        location,
        imageFile: selectedImageFile
      });
      closeModal('editor');
      showToast('Memory updated successfully ♥');
    } else {
      // Add new
      if (!selectedImageFile) {
        throw new Error('Please select a photo for this new memory.');
      }
      await memoryStore.addMemory({
        title,
        caption,
        details,
        date,
        location,
        imageFile: selectedImageFile
      });
      closeModal('editor');
      showToast('New memory added with love ♥');
    }

    resetForm();
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || 'Failed to save memory';
      errorEl.classList.add('is-visible');
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveBtnText) saveBtnText.textContent = currentEditingId ? 'Update Memory' : 'Save Memory';
  }
}

/**
 * Reset the memory editor form
 */
function resetForm() {
  currentEditingId = null;
  selectedImageFile = null;

  const form = document.getElementById('cms-memory-form');
  if (form) form.reset();

  const previewContainer = document.getElementById('cms-image-preview-container');
  const dropzone = document.getElementById('cms-upload-dropzone');
  const previewImg = document.getElementById('cms-image-preview');
  const errorEl = document.getElementById('cms-form-error');

  if (previewContainer) previewContainer.style.display = 'none';
  if (dropzone) dropzone.style.display = 'block';
  if (previewImg) previewImg.src = '';
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  }

  const headerTitle = document.getElementById('cms-header-title');
  const headerSubtitle = document.getElementById('cms-header-subtitle');
  const saveBtnText = document.getElementById('cms-save-btn-text');

  if (headerTitle) headerTitle.textContent = 'Add New Memory';
  if (headerSubtitle) headerSubtitle.textContent = 'Memory Archive';
  if (saveBtnText) saveBtnText.textContent = 'Save Memory';
}

/**
 * Populate form for editing
 */
export function startEditMemory(id) {
  const memories = memoryStore.getMemories();
  const memory = memories.find((m) => m.id === id);
  if (!memory) return;

  resetForm();
  currentEditingId = id;

  const headerTitle = document.getElementById('cms-header-title');
  const headerSubtitle = document.getElementById('cms-header-subtitle');
  const saveBtnText = document.getElementById('cms-save-btn-text');

  if (headerTitle) headerTitle.textContent = 'Edit Memory';
  if (headerSubtitle) headerSubtitle.textContent = 'Editing Existing Moment';
  if (saveBtnText) saveBtnText.textContent = 'Update Memory';

  // Fill inputs
  const titleInput = document.getElementById('cms-field-title');
  const captionInput = document.getElementById('cms-field-caption');
  const detailsInput = document.getElementById('cms-field-details');
  const dateInput = document.getElementById('cms-field-date');
  const locationInput = document.getElementById('cms-field-location');

  if (titleInput) titleInput.value = memory.title || '';
  if (captionInput) captionInput.value = memory.caption || '';
  if (detailsInput) detailsInput.value = memory.details || memory.caption || '';
  if (dateInput) dateInput.value = memory.date || '';
  if (locationInput) locationInput.value = memory.location || '';

  // Show existing image in preview
  if (memory.image) {
    const previewContainer = document.getElementById('cms-image-preview-container');
    const dropzone = document.getElementById('cms-upload-dropzone');
    const previewImg = document.getElementById('cms-image-preview');
    const infoSpan = document.getElementById('cms-image-info');

    if (previewImg) previewImg.src = memory.image;
    if (infoSpan) infoSpan.textContent = 'Current Photo (Click Change to replace)';
    if (previewContainer) previewContainer.style.display = 'block';
    if (dropzone) dropzone.style.display = 'none';
  }

  // Switch to form tab
  document.getElementById('cms-tab-form-btn')?.click();
  openEditorModal();
}

/**
 * Prompt to delete a memory
 */
export function promptDeleteMemory(id) {
  const memories = memoryStore.getMemories();
  const memory = memories.find((m) => m.id === id);
  if (!memory) return;

  memoryPendingDelete = memory;
  const titlePreview = document.getElementById('cms-delete-title-preview');
  if (titlePreview) titlePreview.textContent = `"${memory.title}"`;

  const deleteBackdrop = document.getElementById('cms-delete-backdrop');
  if (deleteBackdrop) deleteBackdrop.classList.add('is-open');
}

/**
 * Open Editor Modal
 */
function openEditorModal() {
  const backdrop = document.getElementById('cms-editor-backdrop');
  if (backdrop) backdrop.classList.add('is-open');
  updateMemoryCount();
}

/**
 * Open Login Modal
 */
function openLoginModal() {
  const backdrop = document.getElementById('cms-login-backdrop');
  const supabaseFields = document.getElementById('cms-supabase-login-fields');
  const localFields = document.getElementById('cms-local-login-fields');

  if (isSupabaseConfigured()) {
    if (supabaseFields) supabaseFields.style.display = 'block';
    if (localFields) localFields.style.display = 'none';
  } else {
    if (supabaseFields) supabaseFields.style.display = 'none';
    if (localFields) localFields.style.display = 'block';
  }

  if (backdrop) backdrop.classList.add('is-open');
}

/**
 * Close any modal
 */
function closeModal(type) {
  const map = {
    login: 'cms-login-backdrop',
    editor: 'cms-editor-backdrop',
    delete: 'cms-delete-backdrop'
  };

  const backdrop = document.getElementById(map[type]);
  if (backdrop) backdrop.classList.remove('is-open');

  if (type === 'editor') {
    resetForm();
  }
}

/**
 * Update Admin status pill & In-card actions
 */
function updateAdminUI() {
  const isAdmin = memoryStore.isAdmin();
  const indicator = document.getElementById('cms-admin-indicator');
  const statusText = document.getElementById('cms-admin-status-text');

  if (indicator) {
    indicator.style.display = isAdmin ? 'flex' : 'none';
    if (statusText) {
      statusText.textContent = isSupabaseConfigured()
        ? 'Admin · Supabase Cloud'
        : 'Admin · Local Mode';
    }
  }

  updateMemoryCount();
}

function updateMemoryCount() {
  const countEl = document.getElementById('cms-memory-count');
  if (countEl) {
    countEl.textContent = memoryStore.getMemories().length.toString();
  }
}

/**
 * Render list of memories in the Manage tab
 */
function renderManageList() {
  const container = document.getElementById('cms-manage-list');
  if (!container) return;

  const memories = memoryStore.getMemories();
  if (memories.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-dark-muted); padding: 2rem;">No memories stored yet.</p>';
    return;
  }

  container.innerHTML = memories.map((m) => `
    <div class="cms-memory-item" data-id="${m.id}">
      <img src="${m.image}" alt="${m.title}" class="cms-memory-thumb" />
      <div class="cms-memory-info">
        <h5 class="cms-memory-item-title">${m.title}</h5>
        <p class="cms-memory-item-desc">${m.caption || ''}</p>
      </div>
      <div class="cms-memory-item-actions">
        <button type="button" class="cms-action-btn btn-edit" data-edit-id="${m.id}">✎ Edit</button>
        <button type="button" class="cms-action-btn btn-delete" data-delete-id="${m.id}">🗑 Delete</button>
      </div>
    </div>
  `).join('');

  // Attach handlers
  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      startEditMemory(id);
    });
  });

  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-id');
      promptDeleteMemory(id);
    });
  });
}

/**
 * Display toast notification
 */
let toastTimeout = null;
export function showToast(msg) {
  const toast = document.getElementById('cms-toast');
  const msgEl = document.getElementById('cms-toast-msg');

  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.add('is-active');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-active');
  }, 3500);
}
