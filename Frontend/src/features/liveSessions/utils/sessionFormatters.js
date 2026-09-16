/**
 * Session Formatting Utilities
 */

export const getConnectorLabel = (connector) => {
  if (!connector || typeof connector !== 'string' || connector.startsWith('undefined')) {
    return 'Type2 (1)';
  }
  return connector;
};

export const getTxId = (tx) => {
  if (!tx) return '-';
  const str = String(tx).trim();
  if (str.startsWith('#')) return str;
  if (str.startsWith('sess_')) {
    const parts = str.split('_');
    if (parts.length >= 4 && parts[2] === 'tx') {
      return `#${parts[3]}`;
    }
    return `#${parts[1] || 'TX'}`;
  }
  return `#${str}`;
};

export const getBillCode = (session) => {
  if (!session) return '-';
  if (typeof session === 'object') {
    return session.billNumber || session.billCode || '-';
  }
  return String(session);
};
