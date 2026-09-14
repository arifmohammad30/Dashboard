import React from 'react';
import ChargePointsList from '../../chargePoints/pages/ChargePointsList';

// ----------------------------------------------------------------------
// Station Charge Points Sub-Tab Component
// ----------------------------------------------------------------------
// Displays a  list of all Charge Points belonging exclusively to the current Charging Station using the stationId 
export default function StationChargePointsTab({ stationId }) {
  return (
    <div className="w-full">

      <ChargePointsList
        chargingStationId={stationId}
        hideHeader={true}
      />
    </div>
  );
}

