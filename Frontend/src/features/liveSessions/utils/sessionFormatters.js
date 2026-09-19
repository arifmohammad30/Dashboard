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
  let val = tx;
  if (typeof tx === 'object' && tx !== null) {
    val = tx.chargeTxCode || tx.transactionId || tx.sessionId || tx.id || '-';
  }
  if (!val || val === '-') return '-';
  const str = String(val).trim();
  if (str === '[object Object]' || str === '') return '-';
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
