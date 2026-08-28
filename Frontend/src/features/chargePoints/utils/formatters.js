export const getConnectorText = (conn) => {
  if (!conn) return '-';
  if (typeof conn === 'string') return conn;
  if (typeof conn === 'object') {
    return conn.type || conn.name || conn.connectorType || conn.id || 'Connector';
  }
  return String(conn);
};

export const formatCreatedOn = (dateStr) => {
  if (!dateStr) return 'Jul 8, 2026 11:27 am';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Jul 8, 2026 11:27 am';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  } catch (e) {
    return 'Jul 8, 2026 11:27 am';
  }
};
