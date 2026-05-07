export const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!sessionStorage.getItem('token');
