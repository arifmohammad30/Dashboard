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

const API_BASE_URL = 'http://localhost:5000/api/tariffs';

export const getTariffs = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch tariffs from backend');
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Backend unavailable, using initial tariffs store:", error);
    return [...INITIAL_TARIFFS];
  }
};

export const getTariffById = async (id) => {
  try {
    const tariffs = await getTariffs();
    const item = tariffs.find(t => String(t.id) === String(id));
    if (item) return { ...item };
    throw new Error("Tariff not found");
  } catch (error) {
    const item = INITIAL_TARIFFS.find(t => String(t.id) === String(id));
    if (item) return { ...item };
    throw new Error("Tariff not found");
  }
};

export const addTariff = async (tariffData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tariffData)
    });
    if (!response.ok) throw new Error('Failed to add tariff');
    const newTariff = await response.json();
    return newTariff;
  } catch (error) {
    const fallbackTariff = {
      id: Date.now().toString(),
      type: 'Default',
      costingType: 'Charging Only',
      applicableTo: 'All Fleets',
      parkingFee: 'NA',
      idleFee: '₹0 / min',
      soc: 'NA',
      startsAt: 'NA',
      endsAt: 'NA',
      weight: 1,
      createdOn: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      gstPercentage: '18 %',
      ...tariffData
    };
    INITIAL_TARIFFS.unshift(fallbackTariff);
    return fallbackTariff;
  }
};

export const deleteTariff = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete tariff');
    return true;
  } catch (error) {
    console.warn("Failed to delete tariff on backend:", error);
    return true;
  }
};
