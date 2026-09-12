// ========================================
// CLIPBOARD
// ========================================
export function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve(true);
    } catch (err) {
      document.body.removeChild(textarea);
      return Promise.resolve(false);
    }
  }

  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

// ========================================
// BLUEPRINT FORMATTING (for copy / markdown export)
// ========================================
export function formatBlueprintForCopy(blueprint) {
  if (!blueprint) return '';

  let text = `# ${blueprint.title || 'MVP Blueprint'}\n\n`;
  text += `${blueprint.summary || ''}\n\n`;

  text += '## Core Features\n';
  if (Array.isArray(blueprint.features)) {
    blueprint.features.forEach((f, i) => {
      text += `${i + 1}. ${typeof f === 'string' ? f : f.name || f.description}\n`;
    });
  }
  text += '\n';

  text += '## Pages\n';
  if (Array.isArray(blueprint.pages)) {
    blueprint.pages.forEach((p, i) => {
      text += `${i + 1}. ${p.name || 'Page'}: ${p.description || p.purpose || ''}\n`;
    });
  }
  text += '\n';

  text += '## Tech Stack\n';
  if (blueprint.techStack) {
    text += `- Frontend: ${blueprint.techStack.frontend || 'Not specified'}\n`;
    text += `- Backend: ${blueprint.techStack.backend || 'Not specified'}\n`;
    text += `- Database: ${blueprint.techStack.database || 'Not specified'}\n`;
    if (blueprint.techStack.ai) {
      text += `- AI: ${blueprint.techStack.ai}\n`;
    }
  }
  text += '\n';

  text += '## Database\n';
  if (Array.isArray(blueprint.database)) {
    blueprint.database.forEach((d, i) => {
      text += `${i + 1}. ${d.name || 'Table'}: ${d.description || d.purpose || ''}\n`;
    });
  }
  text += '\n';

  text += '## Development Tasks\n';
  if (Array.isArray(blueprint.tasks)) {
    blueprint.tasks.forEach((task, i) => {
      text += `${i + 1}. ${task}\n`;
    });
  }
  text += '\n';

  text += '## Recommended Build Order\n';
  if (Array.isArray(blueprint.buildOrder)) {
    blueprint.buildOrder.forEach((step, i) => {
      text += `${i + 1}. ${step}\n`;
    });
  }

  return text;
}

// ========================================
// TOASTS
// ========================================
export function showToast(message, type = 'success', duration = 2500) {
  // Route through the shared ToastContext so all toasts look identical
  if (typeof window !== 'undefined' && typeof window.__nexus_toast === 'function') {
    window.__nexus_toast(message, type, duration);
    return;
  }

  // Fallback only if the provider hasn't mounted yet (very rare)
  console.warn('[toast] provider not mounted:', message, type);
}

// ========================================
// JSON EXPORT
// ========================================
export function exportAsJSON(blueprint) {
  if (!blueprint) return;

  const json = JSON.stringify(blueprint, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${blueprint.title || 'blueprint'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('📊 Blueprint exported as JSON!', 'success');
}

// ========================================
// SHAREABLE URL (SAFE BASE64)
// ========================================

/**
 * Encode a JS object into a URL-safe base64 string.
 * Uses TextEncoder to handle Unicode properly.
 */
function encodePayload(obj) {
  try {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    // Convert bytes to binary string
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    // Convert to base64, then make URL-safe
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error('Encode error:', error);
    return '';
  }
}

/**
 * Decode a URL-safe base64 string back into a JS object.
 */
function decodePayload(encoded) {
  try {
    // Restore URL-safe base64 to standard base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (error) {
    console.error('Decode error:', error);
    return null;
  }
}

export function generateShareableURL(payload) {
  if (!payload) return '';

  const encoded = encodePayload(payload);
  if (!encoded) return '';

  return `${window.location.origin}/ai-builder?share=${encoded}`;
}

export function decodeSharedDataFromURL() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');

  if (!encoded) return null;
  return decodePayload(encoded);
}

export function copyShareableLink(payload) {
  const url = generateShareableURL(payload);

  if (!url) {
    showToast('Failed to generate shareable link', 'error');
    return;
  }

  // Browsers can handle up to ~8k URLs in most cases.
  if (url.length > 8000) {
    showToast('Blueprint too large for URL sharing. Try MD export instead.', 'warning');
    return;
  }

  copyToClipboard(url).then((success) => {
    if (success) {
      showToast('Shareable link copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy link', 'error');
    }
  });
}

// ========================================
// LEGACY (kept for backward compat)
// ========================================
export function decodeBlueprintFromURL() {
  return decodeSharedDataFromURL();
}

export function copyBlueprintShareLink(blueprint) {
  return copyShareableLink({ blueprint });
}