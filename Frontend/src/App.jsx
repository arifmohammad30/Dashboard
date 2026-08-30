import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './config/permissions';

const ChargePointsList = lazy(() => import('./features/chargePoints/pages/ChargePointsList'));
const AddNewChargePoint = lazy(() => import('./features/chargePoints/pages/AddChargePoint'));
const ViewChargePoint = lazy(() => import('./features/chargePoints/pages/ViewChargePoint'));
const UpdateConnector = lazy(() => import('./features/chargePoints/pages/UpdateConnector'));
const AddNewConnector = lazy(() => import('./features/chargePoints/pages/AddNewConnector'));
const ChargingStationsList = lazy(() => import('./features/chargingStations/pages/ChargingStationsList'));
const AddChargingStation = lazy(() => import('./features/chargingStations/pages/AddChargingStation'));
const ViewChargingStation = lazy(() => import('./features/chargingStations/pages/ViewChargingStation'));
const LiveSessionsList = lazy(() => import('./features/liveSessions/pages/LiveSessionsList'));
const SessionHistoryList = lazy(() => import('./features/liveSessions/pages/SessionHistoryList'));
const SessionLogsView = lazy(() => import('./features/liveSessions/pages/SessionLogsView'));
const TariffsList = lazy(() => import('./features/tariffs/pages/TariffsList'));
const AddNewTariff = lazy(() => import('./features/tariffs/pages/AddNewTariff'));
const FleetsList = lazy(() => import('./features/fleets/pages/FleetsList'));
const AddNewFleet = lazy(() => import('./features/fleets/pages/AddNewFleet'));
const PaymentProvidersView = lazy(() => import('./features/payments/pages/PaymentProvidersView'));
const PaymentLogsView = lazy(() => import('./features/payments/pages/PaymentLogsView'));
const BillsList = lazy(() => import('./features/bills/pages/BillsList'));
const ViewBill = lazy(() => import('./features/bills/pages/ViewBill'));
const DiscountsList = lazy(() => import('./features/discounts/pages/DiscountsList'));
const AddNewDiscount = lazy(() => import('./features/discounts/pages/AddNewDiscount'));

const TeamMembersList = lazy(() => import('./features/teams/pages/TeamMembersList'));
const AddTeamMember = lazy(() => import('./features/teams/pages/AddTeamMember'));
const GroupsList = lazy(() => import('./features/teams/pages/GroupsList'));
const PermissionRulesList = lazy(() => import('./features/teams/pages/PermissionRulesList'));

const Login = lazy(() => import('./features/auth/pages/Login'));

// Dummy component for unused pages
const DummyPage = ({ title }) => (
  <div className="flex flex-col gap-6 max-w-[1200px]">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold flex-1 text-stone-800 tracking-tight">{title}</h1>
    </div>
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6">
      <p className="text-stone-600">This is the {title} page. Content goes here.</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full w-full min-h-screen">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/analytics" />} />

                {/* Dashboard & Analytics */}
                <Route
                  path="/analytics"
                  element={
                    <PermissionRoute permission={PERMISSIONS.ANALYTICS_VIEW}>
                      <DummyPage title="Analytics" />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
                      <DummyPage title="Reports" />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <PermissionRoute permission={PERMISSIONS.ALERTS_VIEW}>
                      <DummyPage title="Alerts" />
                    </PermissionRoute>
                  }
                />

                {/* Operations & Sessions */}
                <Route
                  path="/live-sessions"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SESSION_VIEW}>
                      <LiveSessionsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/session-history"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SESSION_VIEW}>
                      <SessionHistoryList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/live-sessions/:id/logs"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SESSION_LOGS_VIEW}>
                      <SessionLogsView />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/session-logs/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SESSION_LOGS_VIEW}>
                      <SessionLogsView />
                    </PermissionRoute>
                  }
                />

                {/* Charging Stations */}
                <Route
                  path="/charging-stations"
                  element={
                    <PermissionRoute permission={PERMISSIONS.STATION_VIEW}>
                      <ChargingStationsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charging-stations/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.STATION_CREATE}>
                      <AddChargingStation />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charging-stations/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.STATION_UPDATE}>
                      <AddChargingStation isEditMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charging-stations/view/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.STATION_VIEW}>
                      <AddChargingStation isViewMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charging-stations/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.STATION_VIEW}>
                      <ViewChargingStation />
                    </PermissionRoute>
                  }
                />

                {/* Charge Points */}
                <Route
                  path="/charge-points"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_VIEW}>
                      <ChargePointsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_CREATE}>
                      <AddNewChargePoint />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_UPDATE}>
                      <AddNewChargePoint isEditMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/view/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_VIEW}>
                      <AddNewChargePoint isViewMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/:id/connectors/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_CONNECTORS_MANAGE}>
                      <AddNewConnector />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/:id/connectors/:connectorId/edit"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_CONNECTORS_MANAGE}>
                      <UpdateConnector />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/:id/logs"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SESSION_LOGS_VIEW}>
                      <ViewChargePoint defaultTab="logs" />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/charge-points/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CHARGE_POINT_VIEW}>
                      <ViewChargePoint />
                    </PermissionRoute>
                  }
                />

                {/* Tariffs */}
                <Route
                  path="/tariffs"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TARIFF_VIEW}>
                      <TariffsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/tariffs/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TARIFF_CREATE}>
                      <AddNewTariff />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/tariffs/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TARIFF_UPDATE}>
                      <AddNewTariff isEditMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/tariffs/view/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TARIFF_VIEW}>
                      <AddNewTariff isViewMode={true} />
                    </PermissionRoute>
                  }
                />

                {/* Fleets */}
                <Route
                  path="/fleets"
                  element={
                    <PermissionRoute permission={PERMISSIONS.FLEET_VIEW}>
                      <FleetsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/fleets/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.FLEET_CREATE}>
                      <AddNewFleet />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/fleets/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.FLEET_UPDATE}>
                      <AddNewFleet isEditMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/fleets/view/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.FLEET_VIEW}>
                      <AddNewFleet isViewMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/fleets/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.FLEET_VIEW}>
                      <AddNewFleet isViewMode={true} />
                    </PermissionRoute>
                  }
                />

                {/* Payments */}
                <Route
                  path="/payment-providers"
                  element={
                    <PermissionRoute permission={PERMISSIONS.PAYMENT_VIEW}>
                      <PaymentProvidersView />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/payment-logs"
                  element={
                    <PermissionRoute permission={PERMISSIONS.PAYMENT_LOGS_VIEW}>
                      <PaymentLogsView />
                    </PermissionRoute>
                  }
                />

                {/* Bills */}
                <Route
                  path="/bills"
                  element={
                    <PermissionRoute permission={PERMISSIONS.BILL_VIEW}>
                      <BillsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/bills/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.BILL_VIEW}>
                      <ViewBill />
                    </PermissionRoute>
                  }
                />

                {/* Discounts */}
                <Route
                  path="/discounts"
                  element={
                    <PermissionRoute permission={PERMISSIONS.DISCOUNT_VIEW}>
                      <DiscountsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/discounts/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.DISCOUNT_CREATE}>
                      <AddNewDiscount />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/discounts/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.DISCOUNT_UPDATE}>
                      <AddNewDiscount isEditMode={true} />
                    </PermissionRoute>
                  }
                />

                {/* Teams & Access Management */}
                <Route
                  path="/team-members"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TEAM_VIEW}>
                      <TeamMembersList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/team-members/new"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TEAM_CREATE}>
                      <AddTeamMember />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/team-members/edit/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TEAM_UPDATE}>
                      <AddTeamMember isEditMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/team-members/view/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.TEAM_VIEW}>
                      <AddTeamMember isViewMode={true} />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <PermissionRoute permission={PERMISSIONS.GROUP_VIEW}>
                      <GroupsList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/permission-rules"
                  element={
                    <PermissionRoute permission={PERMISSIONS.PERMISSION_RULE_VIEW}>
                      <PermissionRulesList />
                    </PermissionRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
