// Detect if running from a file:// protocol or http://
const isLocalFile = window.location.protocol === 'file:';
const getBackendUrl = () => {
  if (isLocalFile) {
    // For file:// protocol, use the machine's IP address
    const hostname = window.location.hostname || '192.168.0.10'; // fallback IP
    return `http://192.168.0.10:5002/api`;
  } else {
    // For http:// protocol, use the current host
    return `${window.location.protocol}//${window.location.hostname}:5002/api`;
  }
};

export const CONFIG = {
  API_URL: getBackendUrl(), // Dynamically determine backend URL
};

// Keep for legacy non-module scripts if any
window.CONFIG = CONFIG;

