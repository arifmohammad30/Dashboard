export const authService = {
  login: async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hardcoded check for demo purposes
    if (email === 'admin@example.com' && password === 'Password123!') {
      return {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        token: 'mock-jwt-token-xyz-123'
      };
    }
    
    throw new Error('Invalid email or password');
  },
  
  logout: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};
