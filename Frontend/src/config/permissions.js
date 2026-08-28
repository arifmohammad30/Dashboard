

const _PERMISSIONS = {
  // Analytics & Dashboard
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',
  ALERTS_VIEW: 'alerts:view',

  // Charging Stations
  STATION_VIEW: 'station:view',
  STATION_CREATE: 'station:create',
  STATION_UPDATE: 'station:update',
  STATION_DELETE: 'station:delete',
  STATION_EXPORT: 'station:export',

  // Charge Points
  CHARGE_POINT_VIEW: 'charge_point:view',
  CHARGE_POINT_CREATE: 'charge_point:create',
  CHARGE_POINT_UPDATE: 'charge_point:update',
  CHARGE_POINT_DELETE: 'charge_point:delete',
  CHARGE_POINT_CONTROL: 'charge_point:control',
  CHARGE_POINT_CONNECTORS_MANAGE: 'charge_point:connectors_manage',
  CHARGE_POINT_EXPORT: 'charge_point:export',

  // Tariffs
  TARIFF_VIEW: 'tariff:view',
  TARIFF_CREATE: 'tariff:create',
  TARIFF_UPDATE: 'tariff:update',
  TARIFF_DELETE: 'tariff:delete',
  TARIFF_EXPORT: 'tariff:export',

  // Fleets
  FLEET_VIEW: 'fleet:view',
  FLEET_CREATE: 'fleet:create',
  FLEET_UPDATE: 'fleet:update',
  FLEET_DELETE: 'fleet:delete',

  // Operations & Sessions
  SESSION_VIEW: 'session:view',
  SESSION_STOP: 'session:stop',
  SESSION_LOGS_VIEW: 'session_logs:view',
  SESSION_EXPORT: 'session:export',

  // Bills & Invoices
  BILL_VIEW: 'bill:view',
  BILL_EXPORT: 'bill:export',

  // Discounts
  DISCOUNT_VIEW: 'discount:view',
  DISCOUNT_CREATE: 'discount:create',
  DISCOUNT_UPDATE: 'discount:update',
  DISCOUNT_DELETE: 'discount:delete',
  DISCOUNT_EXPORT: 'discount:export',

  // Payments
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_LOGS_VIEW: 'payment_logs:view',
};

export const PERMISSIONS = Object.freeze(_PERMISSIONS);


export const ALL_PERMISSIONS_LIST = Object.freeze(Object.values(PERMISSIONS));
