export const getConnectorLabel = (connector, session = {}) => {
  if (connector === undefined || connector === null || connector === '' || connector === 'undefined') {
    const type = session.connectorType || 'Type2';
    const cId = session.connectorId || 1;
    return `${type} (${cId})`;
  }
  if (typeof connector === 'number') return `Type2 (${connector})`;
  if (typeof connector === 'object' && connector !== null) {
    const type = connector.type || connector.connectorType || session.connectorType || 'Type2';
    const cId = connector.connectorId ?? connector.id ?? session.connectorId ?? 1;
    return `${type} (${cId})`;
  }
  if (typeof connector === 'string') {
    let str = connector.trim();
    if (!str || str === '-' || str.startsWith('undefined')) {
      const type = session.connectorType || 'Type2';
      const cId = session.connectorId || 1;
      return `${type} (${cId})`;
    }
    if (str.includes('(')) return str;
    return `${str} (1)`;
  }
  return 'Type2 (1)';
};

export const getTxId = (id) => {
  if (!id) return '-';
  const raw = typeof id === 'object' ? String(id.chargeTxCode || id.id || '') : String(id);
  if (!raw) return '-';
  if (raw.startsWith('sess_')) {
    const parts = raw.split('_');
    if (parts.length >= 4 && parts[2] === 'tx') {
      return `#${parts[3]}`;
    }
    return `#${(parts[1] || 'TX').toUpperCase()}`;
  }
  return `#${raw}`;
};

export const getBillCode = (session) => {
  if (!session) return '-';
  if (typeof session === 'object') {
    if (session.billNumber) return session.billNumber;
    if (session.bill?.billNumber) return session.bill.billNumber;
    if (session.billCode) return session.billCode;
    if (session.chargeTxCode) return `BILL-${session.chargeTxCode}`;
    if (session.id && String(session.id).startsWith('sess_')) {
      const parts = String(session.id).split('_');
      if (parts.length >= 4 && parts[2] === 'tx') {
        return `BILL-${parts[3]}`;
      }
    }
  }
  const raw = String(session);
  if (raw.startsWith('BILL-') || raw.startsWith('BILL')) return raw;
  if (raw.startsWith('sess_')) {
    const parts = raw.split('_');
    if (parts.length >= 4 && parts[2] === 'tx') return `BILL-${parts[3]}`;
  }
  return `BILL-${raw}`;
};
