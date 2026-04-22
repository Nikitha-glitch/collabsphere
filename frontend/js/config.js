// Detect if running from a file:// protocol or http://
const isLocalFile = window.location.protocol === 'file:';

const normalizeApiUrl = (url) => {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getBackendUrl = () => {
  const savedUrl = localStorage.getItem('collabsphere_api_url');
  if (savedUrl) {
    return normalizeApiUrl(savedUrl);
  }

  if (isLocalFile) {
    return 'http://localhost:5002/api';
  } else {
    return `${window.location.protocol}//${window.location.hostname}:5002/api`;
  }
};

export const CONFIG = {
  API_URL: getBackendUrl(), // Dynamically determine backend URL
};

// Keep for legacy non-module scripts if any
window.CONFIG = CONFIG;

