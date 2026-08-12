export const getConnectorLabel = (connector) => {
  if (typeof connector === 'number') return `Type2 (${connector})`;
  if (typeof connector === 'object' && connector !== null) {
    const type = connector.type || connector.name || 'Type2';
    const cId = connector.connectorId || 1;
    return `${type} (${cId})`;
  }
  if (typeof connector === 'string') return connector;
  return 'Type2 (1)';
};

export const getTxId = (id) => {
  if (!id) return '#3401';
  const raw = typeof id === 'object' ? String(id.sessionId || id.id || '') : String(id);
  if (raw.startsWith('sess_')) {
    const parts = raw.split('_');
    return `#${(parts[1] || 'TX').toUpperCase()}`;
  }
  if (raw.startsWith('34') || raw.startsWith('35')) return `#${raw}`;
  return `#340${raw}`;
};

export const getBillCode = (id) => {
  if (!id) return 'OLSB14IYY';
  const raw = typeof id === 'object' ? String(id.sessionId || id.id || '') : String(id);
  if (raw.startsWith('OLSB') || raw.startsWith('BILL')) return raw;
  if (raw.startsWith('sess_')) return `OLSB14I${raw.slice(-6).toUpperCase()}YY`;
  return `OLSB14I${(10 + Number(id || 1) * 3).toString(36).toUpperCase()}YY`;
};
