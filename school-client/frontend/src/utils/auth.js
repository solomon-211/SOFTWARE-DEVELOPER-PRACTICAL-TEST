// Helpers for reading auth state from localStorage.
// Kept simple — components should call these instead of touching localStorage directly.
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!localStorage.getItem('token');
