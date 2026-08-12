
export function createSessionTemplate() {
  return {
    id: '',
    sessionId: '',
    status: 'Ongoing',

    chargePoint: {
      id: '',
      code: '',
      name: ''
    },

    chargingStation: {
      id: '',
      name: ''
    },

    connector: {
      id: '',
      connectorId: 1,
      type: 'Type2'
    },

    driver: {
      id: '',
      name: 'Simulated Driver',
      initials: 'SD',
      color: 'bg-emerald-100 text-emerald-700'
    },

    soc: {
      initial: 20,
      current: 20
    },

    energyDeliveredKwh: 0,
    kwhDelivered: 0,
    powerKw: 0,
    voltage: 400,
    current: 0,
    cost: 0,

    startedAt: '',
    updatedAt: '',

    userName: 'Simulated Driver',
    userInitials: 'SD',
    userColor: 'bg-emerald-100 text-emerald-700',
    station: '',
    chargingStationId: '',
    chargePointId: '',
    initialSoc: 20,
    currentSoc: 20
  };
}
