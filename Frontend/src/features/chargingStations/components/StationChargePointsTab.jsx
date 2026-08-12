import React from 'react';
import ChargePointsList from '../../chargePoints/pages/ChargePointsList';

export default function StationChargePointsTab({ stationName }) {
  return (
    <div className="w-full">
      <ChargePointsList stationFilter={stationName} hideHeader={true} />
    </div>
  );
}
