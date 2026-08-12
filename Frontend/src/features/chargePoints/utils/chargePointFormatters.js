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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year} ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return 'Jul 8, 2026 11:27 am';
  }
};
