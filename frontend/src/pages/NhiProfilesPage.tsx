import React, { useState } from 'react';
import { Identity } from '../types';
import { IdentityCard } from '../components/IdentityCard';
import { Search, Filter, Shield, Server, RefreshCw } from 'lucide-react';

interface Props {
  identities: Identity[];
  onSelectIdentity: (id: string) => void;
}

export const NhiProfilesPage: React.FC<Props> = ({ identities, onSelectIdentity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  const filteredIdentities = identities.filter((idn) => {
    const matchesSearch =
      idn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idn.owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || idn.type === typeFilter;
    const matchesState = stateFilter === 'ALL' || idn.current_state === stateFilter;

    return matchesSearch && matchesType && matchesState;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            NON-HUMAN IDENTITY PROFILES
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Autonomous behavioral baselines, trust ratings, and confidence bounds per non-human workload.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            Total Identities: <strong className="text-cyan-300">{identities.length}</strong>
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0B0F1A]/90">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by identity ID, name, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            <option value="microservice">Microservices</option>
            <option value="service_account">Service Accounts</option>
            <option value="ci_cd_runner">CI/CD Runners</option>
            <option value="bot">Bots</option>
            <option value="cloud_workload">Cloud Workloads</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States</option>
            <option value="NORMAL">Normal</option>
            <option value="DRIFTING">Drifting</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="HIGH-RISK">High-Risk</option>
          </select>
        </div>
      </div>

      {/* Grid of Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdentities.map((idn) => (
          <IdentityCard
            key={idn.id}
            identity={idn}
            onClick={() => onSelectIdentity(idn.id)}
          />
        ))}
      </div>
    </div>
  );
};
