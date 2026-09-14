// Temporary Predefined Backend User Definitions

export const TEMPORARY_USERS = [
  {
    id: 'usr_admin_001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    permissions: [
      // Analytics & Dashboard
      'analytics:view',
      'reports:view',
      'alerts:view',

      // Charging Stations
      'station:view',
      'station:create',
      'station:update',
      'station:delete',
      'station:export',

      // Charge Points
      'charge_point:view',
      'charge_point:create',
      'charge_point:update',
      'charge_point:delete',
      'charge_point:control',
      'charge_point:connectors_manage',
      'charge_point:export',

      // Tariffs
      'tariff:view',
      'tariff:create',
      'tariff:update',
      'tariff:delete',
      'tariff:export',

      // Fleets
      'fleet:view',
      'fleet:create',
      'fleet:update',
      'fleet:delete',

      // Operations & Sessions
      'session:view',
      'session:stop',
      'session_logs:view',
      'session:export',

      // Bills & Invoices
      'bill:view',
      'bill:export',

      // Discounts
      'discount:view',
      'discount:create',
      'discount:update',
      'discount:delete',
      'discount:export',

      // Payments
      'payment:view',
      'payment_logs:view',

      // Teams & Permissions
      'team:view',
      'team:create',
      'team:update',
      'team:delete',
      'group:view',
      'permission_rule:view',
    ]
  },
  {
    id: 'usr_operator_002',
    name: 'Operator User',
    email: 'operator@example.com',
    role: 'OPERATOR',
    permissions: [
      'analytics:view',
      'reports:view',
      'station:view',
      'charge_point:view',
      'charge_point:control',
      'tariff:view',
      'fleet:view',
      'session:view',
      'session:stop',
      'session_logs:view',
      'bill:view',
      'discount:view',
      'payment:view'
    ]
  },
  {
    id: 'usr_user_003',
    name: 'Standard User',
    email: 'user@example.com',
    role: 'USER',
    permissions: [


      'charge_point:view',
      'session:view',


      'charge_point:control',
      'payment:view'



    ]
  }
];
