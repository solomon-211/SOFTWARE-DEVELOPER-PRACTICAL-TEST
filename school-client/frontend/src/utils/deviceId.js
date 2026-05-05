/**
 * Generate or retrieve a persistent device ID stored in localStorage.
 * This ID is sent with every auth request so the admin can verify it.
 */
export const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('deviceId', id);
  }
  return id;
};
