import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

const ChargePointsList = lazy(() => import('./pages/ChargePoints/ChargePointsList'));
const AddNewChargePoint = lazy(() => import('./pages/ChargePoints/AddChargePoint'));
const ViewChargePoint = lazy(() => import('./pages/ChargePoints/ViewChargePoint'));
const ChargingStationsList = lazy(() => import('./pages/ChargingStations/ChargingStationsList'));
const LiveSessionsList = lazy(() => import('./pages/LiveSessions/LiveSessionsList'));
const TariffsList = lazy(() => import('./pages/Tariffs/TariffsList'));
const AddNewTariff = lazy(() => import('./pages/Tariffs/AddNewTariff'));
const Login = lazy(() => import('./pages/Login/Login'));

// Dummy component for unused pages for now
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-full w-full min-h-screen">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/charge-points" replace />} />
                
                <Route path="/analytics" element={<DummyPage title="Analytics" />} />
                <Route path="/reports" element={<DummyPage title="Reports" />} />
                <Route path="/live-sessions" element={<LiveSessionsList />} />
                <Route path="/alerts" element={<DummyPage title="Alerts" />} />
                <Route path="/abnormal-transactions" element={<DummyPage title="Abnormal Transactions" />} />
                <Route path="/charging-stations" element={<ChargingStationsList />} />
                
                <Route path="/charge-points" element={<ChargePointsList />} />
                <Route path="/charge-points/new" element={<AddNewChargePoint />} />
                <Route path="/charge-points/edit/:id" element={<AddNewChargePoint isEditMode={true} />} />
                <Route path="/charge-points/view/:id" element={<AddNewChargePoint isViewMode={true} />} />
                <Route path="/charge-points/:id" element={<ViewChargePoint />} />
                
                <Route path="/tariffs" element={<TariffsList />} />
                <Route path="/tariffs/new" element={<AddNewTariff />} />
                <Route path="/tariffs/edit/:id" element={<AddNewTariff isEditMode={true} />} />
                <Route path="/tariffs/view/:id" element={<AddNewTariff isViewMode={true} />} />
                <Route path="/bills" element={<DummyPage title="Bills" />} />
                <Route path="/telematics-devices" element={<DummyPage title="Telematics Devices" />} />
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
