import React from 'react';
import LogsTab from '../../liveSessions/components/LogsTab';

// Wrapper rendering telemetry logs tab for a specific charge point
export default function ChargePointLogsTab({ cp }) {
  return <LogsTab sessionId={cp?.id || cp?.code} />;
}
