import React, { useState } from 'react';
import {
  LayoutDashboard,
  Shield,
  BarChart3,
  GitCompare,
  GitPullRequest,
  Skull,
  AlertTriangle,
  History,
  Terminal,
  Award,
  Settings,
  Globe,
  Radio,
  Lock,
  Cpu,
  Zap,
  Flame,
  Menu,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export type NavigationTab =
  | 'landing'
  | 'command-center'
  | 'profiles'
  | 'analytics'
  | 'drift-detection'
  | 'adaptive-baseline'
  | 'poisoning-defense'
  | 'ml-predictions'
  | 'slow-burn'
  | 'judge-demo'
  | 'risk-analysis'
  | 'timeline'
  | 'simulator'
  | 'evaluation'
  | 'settings';

interface NavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isWsConnected: boolean;
  currentScenario: string;
}

interface NavSection {
  title: string;
  items: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    description?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'SOC Core Operations',
    items: [
      { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
      { id: 'profiles', label: 'NHI Profiles & Credentials', icon: Shield },
      { id: 'analytics', label: 'Behavioral Analytics', icon: BarChart3 },
      { id: 'drift-detection', label: 'Drift Detection', icon: GitCompare },
      { id: 'adaptive-baseline', label: 'Adaptive Baseline Gate', icon: GitPullRequest },
    ]
  },
  {
    title: 'Advanced Threat Defenses',
    items: [
      {
        id: 'slow-burn',
        label: 'Slow-Burn Detection',
        icon: Flame,
        badge: 'SC2',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40 glow-orange'
      },
      {
        id: 'poisoning-defense',
        label: 'Poisoning Defense',
        icon: Skull,
        badge: 'PS02',
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
      },
      {
        id: 'ml-predictions',
        label: 'ML Risk Engine',
        icon: Cpu,
        badge: 'AI',
        badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
      },
    ]
  },
  {
    title: 'Verification & Showcase',
    items: [
      {
        id: 'judge-demo',
        label: 'Judge Demo Suite',
        icon: Zap,
        badge: 'LIVE DEMO',
        badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40 glow-violet'
      },
      { id: 'risk-analysis', label: 'Risk Factor Analysis', icon: AlertTriangle },
      { id: 'timeline', label: 'Behavioral Timeline', icon: History },
      { id: 'simulator', label: 'Attack Simulator Console', icon: Terminal },
      { id: 'evaluation', label: 'Compliance & Evaluation', icon: Award },
      { id: 'settings', label: 'SOC Policies & Settings', icon: Settings },
    ]
  }
];

export const NavigationHeader: React.FC<NavigationProps & { onToggleMobileNav?: () => void; isMobileNavOpen?: boolean }> = ({
  activeTab,
  onSelectTab,
  isWsConnected,
  currentScenario,
  onToggleMobileNav,
  isMobileNavOpen
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#060A13]/90 backdrop-blur-xl border-b border-cyan-500/15 px-4 lg:px-6 py-2.5 shadow-2xl hud-border">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Motto */}
        <div className="flex items-center gap-3 md:gap-4">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div
            onClick={() => onSelectTab('command-center')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.6)] border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black font-mono tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                  TRUSTNEXUS<span className="text-cyan-400">.AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  NHI TRUST GATE
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-mono tracking-tight">
                Adaptive Non-Human Identity Behavioral Security
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center text-xs font-mono text-slate-400 border-l border-slate-800/80 pl-4">
            <span className="text-cyan-400/90 italic font-medium">"Trust Behavior. Not Just Identity."</span>
          </div>
        </div>

        {/* Center/Right: Quick Nav Highlights & System Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick jump to SC2 Slow Burn */}
          <button
            onClick={() => onSelectTab('slow-burn')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              activeTab === 'slow-burn'
                ? 'bg-orange-500/25 border-orange-500/60 text-orange-300 glow-orange'
                : 'bg-orange-950/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>SC2: Slow-Burn</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-orange-500/30 text-orange-200">ACTIVE</span>
          </button>

          {/* Quick jump to Judge Demo */}
          <button
            onClick={() => onSelectTab('judge-demo')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              activeTab === 'judge-demo'
                ? 'bg-violet-500/25 border-violet-500/60 text-violet-200 glow-violet'
                : 'bg-violet-950/20 border-violet-500/30 text-violet-300 hover:bg-violet-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>Judge Demo</span>
          </button>

          {/* Landing / Console Toggle */}
          <button
            onClick={() => onSelectTab(activeTab === 'landing' ? 'command-center' : 'landing')}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeTab === 'landing' ? 'SOC Console' : 'Landing'}</span>
          </button>

          {/* Mode Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500">MODE:</span>
            <span className="font-bold text-cyan-400 uppercase tracking-wide">{currentScenario || 'STEADY'}</span>
          </div>

          {/* WebSocket Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all ${
              isWsConnected
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400 glow-green'
                : 'border-rose-500/40 bg-rose-950/30 text-rose-400 glow-red'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isWsConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isWsConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="hidden sm:inline">{isWsConnected ? 'LIVE FEED' : 'RECONNECTING'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export const NavigationSidebar: React.FC<NavigationProps & { onCloseMobile?: () => void }> = ({
  activeTab,
  onSelectTab,
  onCloseMobile
}) => {
  return (
    <aside className="w-64 bg-[#060911]/95 border-r border-slate-800/80 flex flex-col shrink-0 h-full select-none">
      {/* Security Principle Banner */}
      <div className="p-3.5 border-b border-slate-800/70 bg-gradient-to-r from-cyan-950/25 via-blue-950/15 to-transparent">
        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
          <span>Security Mandate</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        <div className="text-xs font-semibold text-slate-200 mt-1 font-mono leading-relaxed">
          Valid credentials ≠ Trusted behavior
        </div>
      </div>

      {/* Nav List grouped by sections */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1 font-mono">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider px-2 py-1 flex items-center justify-between">
              <span>{section.title}</span>
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-cyan-400'
                        : item.id === 'slow-burn'
                        ? 'text-orange-400'
                        : item.id === 'judge-demo'
                        ? 'text-violet-400'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>

                  {item.badge && (
                    <span
                      className={`ml-auto text-[9px] font-black border rounded px-1.5 py-0.5 uppercase tracking-wider ${
                        item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer telemetry */}
      <div className="p-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">EWMA Behavioral Engine</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
          </span>
        </div>
        <div className="text-[9px] text-slate-600 mt-1 truncate">
          PS02 Adaptive Trust + SC2 Multi-Window
        </div>
      </div>
    </aside>
  );
};

// Default unified navigation export for backward compatibility
export const Navigation: React.FC<NavigationProps> = (props) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <NavigationHeader
        {...props}
        isMobileNavOpen={isMobileOpen}
        onToggleMobileNav={() => setIsMobileOpen(!isMobileOpen)}
      />

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <NavigationSidebar
              {...props}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
