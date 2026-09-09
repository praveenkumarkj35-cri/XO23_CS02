import React, { useState, useEffect, useCallback } from 'react';
import { NavigationHeader, NavigationSidebar, NavigationTab } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { NhiProfilesPage } from './pages/NhiProfilesPage';
import { NhiDetailPage } from './pages/NhiDetailPage';
import { BehavioralAnalyticsPage } from './pages/BehavioralAnalyticsPage';
import { DriftDetectionPage } from './pages/DriftDetectionPage';
import { AdaptiveBaselinePage } from './pages/AdaptiveBaselinePage';
import { PoisoningDefensePage } from './pages/PoisoningDefensePage';
import { MLPredictionPage } from './pages/MLPredictionPage';
import { JudgeDemoPage } from './pages/JudgeDemoPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { BehavioralTimelinePage } from './pages/BehavioralTimelinePage';
import { AttackSimulatorPage } from './pages/AttackSimulatorPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { SlowBurnPage } from './pages/SlowBurnPage';

import {
  fetchIdentities,
  fetchEvents,
  fetchAlerts,
  fetchBaselineChanges,
  fetchPoisoningDefense
} from './services/api';
import { useTrustNexusSocket } from './hooks/useTrustNexusSocket';
import { Identity, SecurityEvent, SecurityAlert, BaselineChange, PoisoningState, WebSocketPayload } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('payment-service');
  const [latestPayload, setLatestPayload] = useState<WebSocketPayload | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  
  // App data state
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [baselineChanges, setBaselineChanges] = useState<BaselineChange[]>([]);
  const [poisoningStates, setPoisoningStates] = useState<PoisoningState[]>([]);

  // WebSocket event handler
  const handleLivePayload = useCallback((payload: WebSocketPayload) => {
    setLatestPayload(payload);

    if (payload.event) {
      setEvents((prev) => [payload.event, ...prev.slice(0, 99)]);
    }

    if (payload.identity && payload.identity.id) {
      setIdentities((prev) =>
        prev.map((idn) =>
          idn.id === payload.identity.id ? { ...idn, ...payload.identity } as Identity : idn
        )
      );
    }

    if (payload.alert) {
      setAlerts((prev) => [payload.alert!, ...prev.slice(0, 49)]);
    }

    if (payload.baseline_change) {
      setBaselineChanges((prev) => [payload.baseline_change!, ...prev.slice(0, 49)]);
    }

    if (payload.poisoning_state) {
      setPoisoningStates((prev) => {
        const idx = prev.findIndex((p) => p.identity_id === payload.poisoning_state!.identity_id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = payload.poisoning_state!;
          return updated;
        }
        return [payload.poisoning_state!, ...prev];
      });
    }
  }, []);

  const { isConnected, currentScenario, stepIndex } = useTrustNexusSocket(handleLivePayload);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [idns, evts, alts, bChanges, pStates] = await Promise.all([
          fetchIdentities(),
          fetchEvents(60),
          fetchAlerts(25),
          fetchBaselineChanges(30),
          fetchPoisoningDefense()
        ]);
        setIdentities(idns);
        setEvents(evts);
        setAlerts(alts);
        setBaselineChanges(bChanges);
        setPoisoningStates(pStates);
      } catch (err) {
        console.error('Error fetching initial app data:', err);
      }
    };

    loadInitialData();
  }, []);

  const handleSelectIdentity = (id: string) => {
    setSelectedIdentityId(id);
    setActiveTab('profiles');
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDecisionMade = (changeId: string, decision: 'APPROVED' | 'REJECTED') => {
    setBaselineChanges((prev) =>
      prev.map((c) => (c.id === changeId ? { ...c, decision } : c))
    );
  };

  return (
    <div className="min-h-screen bg-[#04060A] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Universal Top Header */}
      <NavigationHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isWsConnected={isConnected}
        currentScenario={currentScenario}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl">
            <NavigationSidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isWsConnected={isConnected}
              currentScenario={currentScenario}
              onCloseMobile={() => setIsMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* If Landing page is active */}
      {activeTab === 'landing' ? (
        <main className="flex-1 overflow-y-auto">
          <LandingPage onNavigate={setActiveTab} />
        </main>
      ) : (
        /* Main SOC Console View with Persistent Sidebar */
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-53px)]">
          {/* Desktop Fixed Sidebar */}
          <div className="hidden md:flex shrink-0">
            <NavigationSidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isWsConnected={isConnected}
              currentScenario={currentScenario}
            />
          </div>

          {/* Main SOC Display Surface */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
            {activeTab === 'command-center' && (
              <CommandCenterPage
                identities={identities}
                events={events}
                alerts={alerts}
                currentScenario={currentScenario}
                stepIndex={stepIndex}
                onSelectIdentity={handleSelectIdentity}
                onDismissAlert={handleDismissAlert}
              />
            )}

            {activeTab === 'profiles' && (
              selectedIdentityId ? (
                <NhiDetailPage
                  identityId={selectedIdentityId}
                  identities={identities}
                  events={events}
                  alerts={alerts}
                  baselineChanges={baselineChanges}
                  onBack={() => setSelectedIdentityId('')}
                />
              ) : (
                <NhiProfilesPage
                  identities={identities}
                  onSelectIdentity={handleSelectIdentity}
                />
              )
            )}

            {activeTab === 'analytics' && (
              <BehavioralAnalyticsPage
                identities={identities}
                events={events}
              />
            )}

            {activeTab === 'drift-detection' && (
              <DriftDetectionPage
                identities={identities}
                events={events}
              />
            )}

            {activeTab === 'adaptive-baseline' && (
              <AdaptiveBaselinePage
                baselineChanges={baselineChanges}
                identities={identities}
                onDecisionMade={handleDecisionMade}
              />
            )}

            {activeTab === 'poisoning-defense' && (
              <PoisoningDefensePage
                poisoningStates={poisoningStates}
                identities={identities}
                baselineChanges={baselineChanges}
                onTriggerPoisoningDemo={() => setActiveTab('judge-demo')}
              />
            )}

            {activeTab === 'ml-predictions' && (
              <MLPredictionPage
                livePrediction={latestPayload?.prediction}
              />
            )}

            {activeTab === 'slow-burn' && (
              <SlowBurnPage wsPayload={latestPayload} />
            )}

            {activeTab === 'judge-demo' && (
              <JudgeDemoPage
                wsPayload={latestPayload}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'risk-analysis' && (
              <RiskAnalysisPage events={events} />
            )}

            {activeTab === 'timeline' && (
              <BehavioralTimelinePage events={events} />
            )}

            {activeTab === 'simulator' && (
              <AttackSimulatorPage
                events={events}
                identities={identities}
                currentScenario={currentScenario}
                stepIndex={stepIndex}
              />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationPage />
            )}

            {activeTab === 'settings' && (
              <SettingsPage />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
