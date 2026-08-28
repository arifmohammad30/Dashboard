import { apiClient } from '../../../lib/apiClient';

export const getDiscounts = async (page = 1, limit = 10, search = '') => {
  // If called with single string argument for backwards compatibility
  let p = page;
  let l = limit;
  let s = search;
  if (typeof page === 'string') {
    s = page;
    p = 1;
    l = 10;
  }

  const params = new URLSearchParams({
    page: String(p),
    limit: String(l),
    search: s || ''
  });
  return apiClient(`/discounts?${params.toString()}`);
};

export const getDiscountById = async (id) => {
  return apiClient(`/discounts/${id}`);
};

export const createDiscount = async (data) => {
  return apiClient('/discounts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateDiscount = async (id, data) => {
  return apiClient(`/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteDiscount = async (id) => {
  return apiClient(`/discounts/${id}`, {
    method: 'DELETE'
  });
};

export const searchAccessEntities = async (category, query = '') => {
  const q = query ? `?query=${encodeURIComponent(query)}` : '';
  return apiClient(`/discounts/search-access/${category}${q}`);
};
