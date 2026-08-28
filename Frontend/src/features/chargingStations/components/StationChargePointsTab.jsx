import React from 'react';
import ChargePointsList from '../../chargePoints/pages/ChargePointsList';

export default function StationChargePointsTab({ stationName, stationId }) {
  return (
    <div className="w-full">
      <ChargePointsList stationFilter={stationName} chargingStationId={stationId} hideHeader={true} />
    </div>
  );
}
