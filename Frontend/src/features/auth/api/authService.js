import { apiClient } from '../../../lib/apiClient';

export const loginApi = async (email, password) => {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};
