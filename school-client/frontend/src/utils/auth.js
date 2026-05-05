// Helpers for reading auth state from session storage.
// Keep components here instead of touching storage directly.
export const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!sessionStorage.getItem('token');
