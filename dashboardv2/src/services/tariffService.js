export const INITIAL_TARIFFS = [
  {
    id: 1,
    name: 'DLF Park Place DC',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹14.03 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jul 10, 2026 05:59 pm',
    gstPercentage: '18 %'
  },
  {
    id: 2,
    name: 'DLF Park Place AC',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹11.03 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jul 10, 2026 05:58 pm',
    gstPercentage: '18 %'
  },
  {
    id: 3,
    name: 'Rajapushpa Imperia Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹11.80 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jul 7, 2026 03:54 pm',
    gstPercentage: '0 %'
  },
  {
    id: 4,
    name: 'Sumadhura Olympus Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹12.00 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jul 7, 2026 12:02 pm',
    gstPercentage: '0 %'
  },
  {
    id: 5,
    name: 'Sobha DC',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹15.25 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jul 4, 2026 04:11 pm',
    gstPercentage: '18 %'
  },
  {
    id: 6,
    name: 'Pulse Fleet Commercial Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹9.50 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'Jun 29, 2026 04:27 pm',
    gstPercentage: '18 %'
  },
  {
    id: 7,
    name: 'M3M AC Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹10.50 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: 'May 25, 2026 01:54 pm',
    gstPercentage: '18 %'
  },
  {
    id: 8,
    name: 'Peak Hours Standard Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '₹13.50 / kWh',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: '05:00 pm',
    endsAt: '11:00 pm',
    weight: 1,
    createdOn: 'May 7, 2026 05:03 pm',
    gstPercentage: '18 %'
  }
];

let tariffsStore = [...INITIAL_TARIFFS];

export const getTariffs = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...tariffsStore]);
    }, 150);
  });
};

export const getTariffById = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const item = tariffsStore.find(t => String(t.id) === String(id));
      if (item) resolve({ ...item });
      else reject(new Error("Tariff not found"));
    }, 150);
  });
};

export const addTariff = async (tariffData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTariff = {
        id: Date.now(),
        type: 'Default',
        costingType: 'Charging Only',
        applicableTo: 'All Fleets',
        parkingFee: 'NA',
        idleFee: '₹0 / min',
        soc: 'NA',
        startsAt: 'NA',
        endsAt: 'NA',
        weight: 1,
        createdOn: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        gstPercentage: '18 %',
        ...tariffData
      };
      tariffsStore.unshift(newTariff);
      resolve(newTariff);
    }, 200);
  });
};

export const deleteTariff = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      tariffsStore = tariffsStore.filter(t => String(t.id) !== String(id));
      resolve(true);
    }, 200);
  });
};
