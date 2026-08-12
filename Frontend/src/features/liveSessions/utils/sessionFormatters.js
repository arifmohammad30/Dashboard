export const getConnectorLabel = (connector) => {
  if (typeof connector === 'number') return `Type2 (${connector})`;
  return connector || 'Type2 (1)';
};

export const getTxId = (id) => {
  const raw = String(id || '');
  if (raw.startsWith('34') || raw.startsWith('35')) return `#${raw}`;
  return `#340${raw}`;
};

export const getBillCode = (id) => {
  const raw = String(id || '');
  if (raw.startsWith('OLSB') || raw.startsWith('BILL')) return raw;
  return `OLSB14I${(10 + Number(id || 1) * 3).toString(36).toUpperCase()}YY`;
};
