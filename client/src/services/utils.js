// Utility functions

export function copyToClipboard(text) {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }
  
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

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

export function showToast(message, type = 'success') {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}


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

// Add to existing utils.js

export function generateShareableURL(blueprint) {
  if (!blueprint) return '';
  
  try {
    // Compress the data (simple compression for demo)
    const json = JSON.stringify(blueprint);
    const encoded = btoa(encodeURIComponent(json));
    const url = `${window.location.origin}?blueprint=${encoded}`;
    return url;
  } catch (error) {
    console.error('Failed to generate shareable URL:', error);
    return '';
  }
}

export function decodeBlueprintFromURL() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('blueprint');
  
  if (!encoded) return null;
  
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode blueprint:', error);
    return null;
  }
}

export function copyShareableLink(blueprint) {
  const url = generateShareableURL(blueprint);
  if (!url) {
    showToast('❌ Failed to generate shareable link', 'error');
    return;
  }
  
  copyToClipboard(url).then((success) => {
    if (success) {
      showToast('🔗 Shareable link copied to clipboard!', 'success');
    } else {
      showToast('❌ Failed to copy link', 'error');
    }
  });
}

