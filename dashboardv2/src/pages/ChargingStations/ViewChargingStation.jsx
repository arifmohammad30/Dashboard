import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { filterTableData } from '../../utils/searchUtils';
import {
  ArrowLeft,
  Search,
  Download,
  Zap,
  BatteryCharging,
  Battery,
  Activity,
  Loader2,
  MapPin,
  Edit,
  Info,
  Eye,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  Hash,
  Plug,
  CheckCircle2,
  IndianRupee,
  FileText,
  Clock,
  AlertCircle,
  Gauge,
  User,
  Tag,
  Layers,
  Shield
} from 'lucide-react';

import ChargePointsList from '../ChargePoints/ChargePointsList';
import { getChargingStationById } from '../../services/chargingStationService';
import { getChargePoints } from '../../services/chargePointService';
import { useToast } from '../../context/ToastContext';

// Compact Popover Component for SoC Breakdown (standalone drop icon button)
const SocPopoverCell = ({ initialSoc, currentSoc }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view State of Charge details"
      >
        <span>View SoC</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-stone-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[160px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">State of Charge</div>
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between"><span className="text-stone-500">Initial SoC:</span> <strong className="font-mono text-stone-800">{initialSoc || '-'}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Current SoC:</span> <strong className="font-mono text-stone-800">{currentSoc || '-'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact Popover Component for Meter Values (serious enterprise trigger label)
const MeterValuesPopoverCell = ({ meterValues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view Telemetry details"
      >
        <span>View Meter</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-stone-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[170px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">Meter Telemetry</div>
          <div className="flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Energy:</span> <strong className="text-stone-800">{meterValues?.energy || '-'}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Power:</span> <strong className="text-stone-800">{meterValues?.power || '-'}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Voltage:</span> <strong className="text-stone-800">{meterValues?.voltage || '-'}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Current:</span> <strong className="text-stone-800">{meterValues?.current || '-'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ViewChargingStation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStation = location.state?.station;

  const validTabs = ['charge-points', 'transactions'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'charge-points';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [station, setStation] = useState(initialStation);
  const [loading, setLoading] = useState(!initialStation && Boolean(id));
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Transactions & Station Charge Points state
  const [transactions, setTransactions] = useState([]);
  const [stationChargePoints, setStationChargePoints] = useState([]);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];

  // Fetch Station Details
  useEffect(() => {
    if (id) {
      setLoading(true);
      const decodedId = decodeURIComponent(id);
      getChargingStationById(id)
        .then((data) => {
          if (data && (data.name || data.code)) {
            setStation(data);
          } else {
            setStation((prev) => prev || { name: decodedId, code: 'HUB-001' });
          }
        })
        .catch((err) => {
          console.warn("Could not fetch station by numeric ID, using fallback station name:", err);
          setStation((prev) => prev || { name: decodedId, code: 'HUB-001' });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Fetch Existing Charge Points for this Station to guarantee valid navigation
  useEffect(() => {
    const sName = station?.name || 'Charging Station';
    getChargePoints(1, 20, station?.name || '')
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setStationChargePoints(res.data);
        } else {
          setStationChargePoints([
            { id: 'cp-101', name: `${sName}-CP-01`, code: 'CP-01', type: 'DC', capacity: 60, status: 'Available', connectors: ['CCS2', 'Type 2'] },
            { id: 'cp-102', name: `${sName}-CP-02`, code: 'CP-02', type: 'DC', capacity: 50, status: 'Charging', connectors: ['CCS2'] },
            { id: 'cp-103', name: `${sName}-CP-03`, code: 'CP-03', type: 'AC', capacity: 22, status: 'Available', connectors: ['Type 2'] },
            { id: 'cp-104', name: `${sName}-CP-04`, code: 'CP-04', type: 'AC', capacity: 11, status: 'Offline', connectors: ['Type 2'] },
          ]);
        }
      })
      .catch(() => {
        setStationChargePoints([
          { id: 'cp-101', name: `${sName}-CP-01`, code: 'CP-01', type: 'DC', capacity: 60, status: 'Available', connectors: ['CCS2', 'Type 2'] },
          { id: 'cp-102', name: `${sName}-CP-02`, code: 'CP-02', type: 'DC', capacity: 50, status: 'Charging', connectors: ['CCS2'] },
          { id: 'cp-103', name: `${sName}-CP-03`, code: 'CP-03', type: 'AC', capacity: 22, status: 'Available', connectors: ['Type 2'] },
          { id: 'cp-104', name: `${sName}-CP-04`, code: 'CP-04', type: 'AC', capacity: 11, status: 'Offline', connectors: ['Type 2'] },
        ]);
      });
  }, [station]);

  // Mock transactions dataset linked directly to actual charge points
  useEffect(() => {
    const cps = stationChargePoints.length > 0 ? stationChargePoints : [
      { id: 'cp-101', name: 'Charge Point 1' },
      { id: 'cp-102', name: 'Charge Point 2' },
      { id: 'cp-103', name: 'Charge Point 3' },
      { id: 'cp-104', name: 'Charge Point 4' },
    ];
    const mockTxns = [
      {
        txnId: '10463634',
        connector: 'Type2 (1)',
        status: 'Stopped',
        energyDelivered: '1.41 kWh',
        initialSoc: '-',
        currentSoc: '85%',
        meterValues: { energy: '1.408 kWh', power: '0.15 kW', voltage: '241.48 V', current: '0.61 A' },
        billedAmount: '₹0.00',
        associatedBill: 'CI03AON3W6',
        duration: '00:13:12',
        stopReason: 'Remote',
        meterStart: '97',
        startedAt: 'Jul 25, 2026 11:52 am',
        startedBy: '8142446969',
        meterStop: '1,505',
        stoppedAt: 'Jul 25, 2026 12:05 pm',
        stoppedBy: '8142446969',
        tariffs: 'Standard Rate',
        chargePointObj: cps[0] || cps[0],
        createdOn: 'Jul 25, 2026 11:52 am',
        ubc: 'No'
      },
      {
        txnId: '10463581',
        connector: '15A (1)',
        status: 'Stopped',
        energyDelivered: '0.75 kWh',
        initialSoc: '-',
        currentSoc: '60%',
        meterValues: { energy: '0.746 kWh', power: '-', voltage: '243.78 V', current: '-' },
        billedAmount: '₹0.00',
        associatedBill: 'SSAVNISDJY',
        duration: '01:01:37',
        stopReason: 'EVDisconnected',
        meterStart: '305',
        startedAt: 'Jul 25, 2026 11:48 am',
        startedBy: '8142446969',
        meterStop: '1,051',
        stoppedAt: 'Jul 25, 2026 12:50 pm',
        stoppedBy: '8142446969',
        tariffs: 'Standard Rate',
        chargePointObj: cps[1] || cps[0],
        createdOn: 'Jul 25, 2026 11:48 am',
        ubc: 'No'
      },
      {
        txnId: '10463526',
        connector: 'Type2 (1)',
        status: 'Stopped',
        energyDelivered: '0.00 kWh',
        initialSoc: '-',
        currentSoc: '-',
        meterValues: { energy: '0.003 kWh', power: '0.11 kW', voltage: '246.04 V', current: '0.44 A' },
        billedAmount: '₹0.00',
        associatedBill: 'ZJNLJGH5Z4',
        duration: '00:06:47',
        stopReason: 'EVDisconnected',
        meterStart: '94',
        startedAt: 'Jul 25, 2026 11:44 am',
        startedBy: '8142446969',
        meterStop: '97',
        stoppedAt: 'Jul 25, 2026 11:50 am',
        stoppedBy: '8142446969',
        tariffs: 'Standard Rate',
        chargePointObj: cps[0],
        createdOn: 'Jul 25, 2026 11:43 am',
        ubc: 'No'
      },
      {
        txnId: '10463496',
        connector: 'Type2 (1)',
        status: 'Stopped',
        energyDelivered: '15.92 kWh',
        initialSoc: '18%',
        currentSoc: '82%',
        meterValues: { energy: '15.916 kWh', power: '2.76 kW', voltage: '245.55 V', current: '11.25 A' },
        billedAmount: '₹222.88',
        associatedBill: 'JG23B80B7T',
        duration: '02:28:33',
        stopReason: 'EVDisconnected',
        meterStart: '211',
        startedAt: 'Jul 25, 2026 11:41 am',
        startedBy: '9731799966',
        meterStop: '16,127',
        stoppedAt: 'Jul 25, 2026 02:10 pm',
        stoppedBy: '9731799966',
        tariffs: 'Peak Rate',
        chargePointObj: cps[2] || cps[0],
        createdOn: 'Jul 25, 2026 11:41 am',
        ubc: 'No'
      },
      {
        txnId: '10463437',
        connector: 'Type2 (1)',
        status: 'Stopped',
        energyDelivered: '0.18 kWh',
        initialSoc: '-',
        currentSoc: '-',
        meterValues: { energy: '0.177 kWh', power: '7.04 kW', voltage: '240.25 V', current: '29.29 A' },
        billedAmount: '₹0.00',
        associatedBill: 'OAMBUP9TYO',
        duration: '00:01:38',
        stopReason: 'Remote',
        meterStart: '34',
        startedAt: 'Jul 25, 2026 11:38 am',
        startedBy: '9731799966',
        meterStop: '211',
        stoppedAt: 'Jul 25, 2026 11:39 am',
        stoppedBy: '9731799966',
        tariffs: 'Standard Rate',
        chargePointObj: cps[3] || cps[0],
        createdOn: 'Jul 25, 2026 11:38 am',
        ubc: 'No'
      },
      {
        txnId: '10463390',
        connector: '15A (2)',
        status: 'Stopped',
        energyDelivered: '3.42 kWh',
        initialSoc: '45%',
        currentSoc: '90%',
        meterValues: { energy: '3.420 kWh', power: '3.30 kW', voltage: '238.10 V', current: '13.85 A' },
        billedAmount: '₹47.88',
        associatedBill: 'K9P2X71M0Q',
        duration: '01:04:12',
        stopReason: 'EVDisconnected',
        meterStart: '210',
        startedAt: 'Jul 25, 2026 11:30 am',
        startedBy: '8142446969',
        meterStop: '305',
        stoppedAt: 'Jul 25, 2026 12:34 pm',
        stoppedBy: '8142446969',
        tariffs: 'Standard Rate',
        chargePointObj: cps[1] || cps[0],
        createdOn: 'Jul 25, 2026 11:30 am',
        ubc: 'No'
      }
    ];
    setTransactions(mockTxns);
  }, [station, stationChargePoints]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-orange-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charging station details...</p>
      </div>
    );
  }

  const stationName = station?.name || 'Charging Station';
  const stationCode = station?.code || 'HUB-001';

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="shrink-0 space-y-2">
        <div>
          <BackButton to="/charging-stations" label="Back to Charging Stations" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{stationName}</h1>
            <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200/80 font-mono font-bold text-xs">
              {stationCode}
            </span>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-sky-500 stroke-[2]" />
              <span>Show Details</span>
            </button>

            <button
              onClick={() => navigate(`/charging-stations/edit/${station?.id || id}`, { state: { station } })}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Glass Container matching ViewChargePoint */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-6 pt-3 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto md:overflow-x-visible flex items-center gap-2.5 z-10 scrollbar-none">
          <button
            onClick={() => setActiveTab('charge-points')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight transition-all duration-200 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative ${activeTab === 'charge-points'
              ? 'border-b-2 border-b-orange-500 text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-xs font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/60 font-medium'
              }`}
          >
            <BatteryCharging strokeWidth={2.25} className={`w-4 h-4 transition-transform ${activeTab === 'charge-points' ? 'text-orange-500 scale-105' : 'text-stone-400'
              }`} />
            <span className="font-bold text-xs tracking-tight">Charge Points</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight transition-all duration-200 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative ${activeTab === 'transactions'
              ? 'border-b-2 border-b-orange-500 text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-xs font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/60 font-medium'
              }`}
          >
            <Activity strokeWidth={2.25} className={`w-4 h-4 transition-transform ${activeTab === 'transactions' ? 'text-orange-500 scale-105' : 'text-stone-400'
              }`} />
            <span className="font-bold text-xs tracking-tight">Charge Transactions</span>
            <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors ${activeTab === 'transactions' ? 'bg-orange-100/80 text-orange-700 border border-orange-200/60' : 'bg-stone-100 text-stone-600 border border-stone-200/60'
              }`}>
              {transactions.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'charge-points' && (
            <div className="w-full">
              <ChargePointsList stationFilter={stationName} hideHeader={true} />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
              {/* Toolbar without search bar */}
              <div className="px-5 py-3 flex items-center justify-end gap-3 bg-white border-b border-stone-200/80">
                <div className="flex items-center gap-3">
                  {/* Date Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                      className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-200 text-xs cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>{dateRange}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDateDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsDateDropdownOpen(false)}></div>
                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-stone-200 shadow-xl rounded-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                          {dateOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setDateRange(opt);
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${dateRange === opt ? 'bg-orange-50 text-orange-600 font-bold' : 'text-stone-700 hover:bg-stone-50'
                                }`}
                            >
                              <span>{opt}</span>
                              {dateRange === opt && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Table with 20 Columns matching main application theme */}
              <div className="overflow-x-auto flex-1 p-2 custom-scrollbar transform-gpu translate-z-0">
                <table className="w-full text-left text-xs border-separate border-spacing-y-1.5 min-w-[2200px]">
                  <thead>
                    <tr className="bg-[#F8FAFC]/90 border-b border-stone-200/80">
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-l-xl whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Txn Id</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector (Connector Id)</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Energy Delivered</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Values</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Billed amount</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Associated Bill</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Duration</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stop reason by charger</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Start</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Started at</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Started by</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Stop</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stopped at</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stopped by</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tariffs</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-r-xl whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> UBC</div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="20" className="px-5 py-16 text-center text-stone-500 font-bold text-xs">
                          No charging transactions recorded for this station.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => (
                        <tr
                          key={tx.txnId + idx}
                          className="bg-white hover:bg-[#F9FBFF] border border-stone-200/80 shadow-2xs transition-colors duration-150 rounded-xl text-xs"
                        >
                          <td className="px-4 py-3 rounded-l-xl font-mono font-bold text-sky-600 whitespace-nowrap">
                            {tx.txnId}
                          </td>
                          <td
                            onClick={() => {
                              const cp = tx.chargePointObj || { id: 'cp-101', name: 'Charge Point 1' };
                              navigate(`/charge-points/${cp.id}`, { state: { chargePoint: cp } });
                            }}
                            className="px-4 py-3 font-bold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer whitespace-nowrap"
                            title="Click to view Charge Point"
                          >
                            {tx.chargePointObj?.name || tx.chargePointObj?.code || 'Charge Point'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-stone-100 border border-stone-200/70 text-stone-700">
                              {typeof tx.connector === 'object' ? (tx.connector?.type || tx.connector?.name || tx.connector?.id || 'Connector') : (tx.connector || '-')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              const cpStatus = tx.chargePointObj?.status || tx.status || 'Available';
                              if (cpStatus === 'Available' || cpStatus === 'Completed') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-emerald-50/90 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    {cpStatus}
                                  </span>
                                );
                              }
                              if (cpStatus === 'Charging' || cpStatus === 'Active') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-blue-50/90 text-blue-700 border border-blue-200/60 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                                    {cpStatus}
                                  </span>
                                );
                              }
                              if (cpStatus === 'Faulted' || cpStatus === 'Failed') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-red-50/90 text-red-700 border border-red-200/60 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                    Faulted
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/80 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0"></span>
                                  {cpStatus}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800 font-mono whitespace-nowrap">
                            {tx.energyDelivered}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <SocPopoverCell initialSoc={tx.initialSoc} currentSoc={tx.currentSoc} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <MeterValuesPopoverCell meterValues={tx.meterValues} />
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 whitespace-nowrap">
                            {tx.billedAmount}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer whitespace-nowrap">
                            {tx.associatedBill}
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700 font-medium whitespace-nowrap">
                            {tx.duration}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-stone-100/90 border border-stone-200/80 text-stone-600">
                              {tx.stopReason}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700 whitespace-nowrap">
                            {tx.meterStart}
                          </td>
                          <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                            {tx.startedAt}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">8</span>
                              <span>{tx.startedBy}</span>
                              <span className="text-sky-600 font-bold text-[10px] ml-1">SEE ID TAG</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700 whitespace-nowrap">
                            {tx.meterStop}
                          </td>
                          <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                            {tx.stoppedAt}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">8</span>
                              <span>{tx.stoppedBy}</span>
                              <span className="text-sky-600 font-bold text-[10px] ml-1">SEE ID TAG</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-700 font-medium whitespace-nowrap">
                            {tx.tariffs}
                          </td>
                          <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                            {tx.createdOn}
                          </td>
                          <td className="px-4 py-3 rounded-r-xl whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/70">
                              {tx.ubc}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-900">{stationName}</h2>
                  <span className="text-xs font-bold text-orange-500 font-mono">{stationCode}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 text-xs">
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Brand</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.brand || 'Pulse Energy'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Mobility Type</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.mobilityType || 'Stationary'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Category</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.category || 'Public Hub'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100 col-span-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Address</span>
                <span className="font-bold text-stone-800 mt-0.5 block truncate">{station?.address || 'Tamil Nadu, Chennai'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">State / Country</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.state || 'Tamil Nadu'}, {station?.country || 'India'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Geolocation</span>
                <span className="font-mono font-bold text-stone-800 mt-0.5 block">{station?.latitude || '18.09'}, {station?.longitude || '72.91'}</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Grid Power</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.gridPowerCapacity || '100'} kW</span>
              </div>

              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Availability</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.open247 ? 'Open 24×7' : `${station?.opensAt || '08:00 am'} - ${station?.closesAt || '09:00 pm'}`}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 mt-3 border-t border-stone-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Close Station Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
