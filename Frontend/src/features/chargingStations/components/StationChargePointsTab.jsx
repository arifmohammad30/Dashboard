import React from 'react';
import ChargePointsList from '../../chargePoints/pages/ChargePointsList';

// ----------------------------------------------------------------------
// Station Charge Points Sub-Tab Component
// ----------------------------------------------------------------------
// Displays a scoped list of all Charge Points belonging exclusively to
// the current Charging Station using the authoritative stationId prop.
export default function StationChargePointsTab({ stationId }) {
  return (
    <div className="w-full">
      {/* 
        Render the reusable ChargePointsList module in embedded mode:
        - chargingStationId: strictly filters charge points by this station ID
        - hideHeader: hides redundant page header / navigation controls
      */}
      <ChargePointsList
        chargingStationId={stationId}
        hideHeader={true}
      />
    </div>
  );
}

