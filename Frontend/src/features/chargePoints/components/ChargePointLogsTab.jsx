import React from 'react';
import LogsTab from '../../../components/LogsTab';

export default function ChargePointLogsTab({ cp }) {
  return <LogsTab cp={cp} chargePointCode={cp?.code || cp?.id} />;
}
