import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  QrCode,
  Globe,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  Layers,
  Key,
  FileText,
  Sparkles,
  Play,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { walletConnectService } from '../../services/walletconnect/walletConnectService';
import { WCSession, WCSessionProposal, WCSignRequest } from '../../services/walletconnect/walletConnectTypes';

export const WalletConnectScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeAddress, showToast } = useWallet();
  const [uriInput, setUriInput] = useState('');
  const [sessions, setSessions] = useState<WCSession[]>(() => walletConnectService.getSessions());
  const [proposals, setProposals] = useState<WCSessionProposal[]>(() => walletConnectService.getPendingProposals());
  const [requests, setRequests] = useState<WCSignRequest[]>(() => walletConnectService.getPendingRequests());
  const [activeTab, setActiveTab] = useState<'connect' | 'sessions' | 'settings'>('connect');
  const [projectIdInput, setProjectIdInput] = useState(() => walletConnectService.getProjectId());
  const [isPairing, setIsPairing] = useState(false);

  useEffect(() => {
    const unsub = walletConnectService.subscribe(() => {
      setSessions(walletConnectService.getSessions());
      setProposals(walletConnectService.getPendingProposals());
      setRequests(walletConnectService.getPendingRequests());
    });
    return unsub;
  }, []);

  const handlePair = async (uriToPair?: string) => {
    const target = uriToPair || uriInput;
    if (!target.trim()) {
      showToast('Please enter a WalletConnect URI', 'error');
      return;
    }

    setIsPairing(true);
    try {
      await walletConnectService.pair(target.trim());
      setUriInput('');
      showToast('Connection proposal received!', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid connection URI';
      showToast(msg, 'error');
    } finally {
      setIsPairing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('wc:')) {
        setUriInput(text.trim());
        handlePair(text.trim());
      } else if (text) {
        setUriInput(text.trim());
      }
    } catch {
      showToast('Unable to read clipboard automatically', 'info');
    }
  };

  const handleApproveProposal = (proposal: WCSessionProposal) => {
    walletConnectService.approveProposal(proposal.id, activeAddress);
    showToast(`Connected to ${proposal.dapp.name}`, 'success');
  };

  const handleRejectProposal = (id: string) => {
    walletConnectService.rejectProposal(id);
    showToast('Connection rejected', 'info');
  };

  const handleApproveRequest = (req: WCSignRequest) => {
    walletConnectService.approveRequest(req.id);
    showToast(`Signed request for ${req.dapp.name}`, 'success');
  };

  const handleRejectRequest = (id: string) => {
    walletConnectService.rejectRequest(id);
    showToast('Signature request rejected', 'info');
  };

  const handleSaveProjectId = () => {
    walletConnectService.setProjectId(projectIdInput);
    showToast('WalletConnect Project ID updated', 'success');
  };

  return (
    <div className="min-h-[100dvh] page-wash pb-28 px-4 md:px-10 lg:px-[10%] pt-4 flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-ink hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-ink">WalletConnect v2</h1>
          <p className="text-[11px] text-muted">Connect & approve dApp sessions</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab(activeTab === 'settings' ? 'connect' : 'settings')}
            className={`p-2 rounded-xl transition-colors ${
              activeTab === 'settings' ? 'bg-peach text-ink' : 'text-slate-400 hover:text-ink'
            }`}
            title="WalletConnect settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab('connect')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'connect' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
          }`}
        >
          Connect & Test
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all relative ${
            activeTab === 'sessions' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
          }`}
        >
          Active Sessions ({sessions.length})
          {sessions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-4" />
          )}
        </button>
      </div>

      {/* PENDING PROPOSALS MODAL / BANNER */}
      {proposals.length > 0 && (
        <div className="mb-6 space-y-4">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-5 rounded-3xl bg-card border-2 border-coral/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 p-1.5 flex items-center justify-center shrink-0 border border-slate-200">
                  {prop.dapp.icons[0] ? (
                    <img src={prop.dapp.icons[0]} alt={prop.dapp.name} className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Globe size={24} className="text-coral" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-ink truncate">{prop.dapp.name}</h3>
                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  </div>
                  <a
                    href={prop.dapp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-coral hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{prop.dapp.url}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between text-muted">
                  <span>Requested Chains:</span>
                  <span className="font-semibold text-ink font-mono">{prop.requiredChains.join(', ')}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Account:</span>
                  <span className="font-mono text-ink truncate max-w-[150px]">{activeAddress}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Permissions:</span>
                  <span className="text-ink">Sign messages, view balance, propose transactions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleRejectProposal(prop.id)}
                  className="btn-secondary h-11 text-xs"
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApproveProposal(prop)}
                  className="btn-primary h-11 text-xs"
                >
                  <CheckCircle2 size={15} />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PENDING SIGN REQUESTS MODAL / BANNER */}
      {requests.length > 0 && (
        <div className="mb-6 space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-3xl bg-card border-2 border-sky/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-sky" />
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    {req.method.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted">{req.chainId}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 p-1 flex items-center justify-center shrink-0">
                  <Globe size={18} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-ink">{req.dapp.name}</h4>
                  <p className="text-[11px] text-muted truncate">{req.dapp.url}</p>
                </div>
              </div>

              {/* Decoded Request Payload */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                {req.method === 'personal_sign' && (
                  <div>
                    <span className="text-[11px] font-semibold text-muted block mb-1">Message to Sign:</span>
                    <pre className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-ink font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                      {req.decodedData?.humanText || 'No plain text available'}
                    </pre>
                  </div>
                )}

                {req.method.includes('TypedData') && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted font-semibold">Primary Type:</span>
                      <span className="font-mono bg-sky/10 text-sky px-2 py-0.5 rounded-md font-bold">
                        {req.decodedData?.primaryType}
                      </span>
                    </div>
                    {req.decodedData?.typedDataDomain && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700">
                        <span className="font-bold text-ink block mb-0.5">Verifying Contract:</span>
                        <span className="break-all">{req.decodedData.typedDataDomain.verifyingContract}</span>
                      </div>
                    )}
                    {req.decodedData?.typedDataMessage && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700 max-h-32 overflow-y-auto">
                        <span className="font-bold text-ink block mb-0.5">Message Parameters:</span>
                        <pre className="text-[10px]">{JSON.stringify(req.decodedData.typedDataMessage, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {req.method === 'eth_sendTransaction' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Target Recipient / Contract:</span>
                      <span className="font-mono font-semibold text-ink truncate max-w-[180px]">
                        {req.decodedData?.to}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Value:</span>
                      <span className="font-bold text-coral text-sm font-mono">
                        {req.decodedData?.valueEth} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Gas Limit:</span>
                      <span className="font-mono text-muted">{req.decodedData?.estimatedGas}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleRejectRequest(req.id)}
                  className="btn-secondary h-11 text-xs"
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApproveRequest(req)}
                  className="btn-primary h-11 text-xs"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Sign</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: Connect & Test dApps */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* URI Connection Input Card */}
          <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <QrCode size={16} className="text-coral" />
                Connect with WalletConnect URI
              </span>
              <span className="text-[10px] bg-slate-100 text-muted px-2 py-0.5 rounded-full font-mono">v2.0</span>
            </div>

            <div className="relative">
              <textarea
                value={uriInput}
                onChange={(e) => setUriInput(e.target.value)}
                placeholder="Paste wc:… connection URI from any Web3 dApp"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none focus:border-coral resize-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 bottom-3 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-coral hover:bg-slate-50 shadow-2xs"
              >
                Paste
              </button>
            </div>

            <button
              onClick={() => handlePair()}
              disabled={isPairing || !uriInput.trim()}
              className="btn-primary w-full h-11 text-xs"
            >
              {isPairing ? 'Pairing...' : 'Connect dApp'}
            </button>
          </div>

          {/* Test dApps Simulation Suite */}
          <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                Interactive dApp Simulator
              </span>
              <span className="text-[11px] text-muted">Test approval flows</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Launch a live simulation with popular Web3 dApps to test session proposals, `personal_sign` logins, and EIP-712 permit signing without external browser tabs:
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {[
                { name: 'Uniswap' as const, desc: 'DEX & Permit2 Sign', color: '#ff007a' },
                { name: 'OpenSea' as const, desc: 'NFT Login Sign', color: '#2081e2' },
                { name: 'PancakeSwap' as const, desc: 'BSC Swaps', color: '#d1884f' },
                { name: 'Aave' as const, desc: 'Lending Sign', color: '#b6509e' },
              ].map((dapp) => (
                <button
                  key={dapp.name}
                  onClick={() => {
                    walletConnectService.simulateDAppProposal(dapp.name);
                    showToast(`Simulated connection proposal from ${dapp.name}!`, 'info');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors">
                      {dapp.name}
                    </span>
                    <Play size={11} className="text-muted group-hover:text-coral" />
                  </div>
                  <span className="text-[10px] text-muted block">{dapp.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-3xl border border-slate-200/80">
              <Layers size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-ink mb-1">No Active Sessions</h3>
              <p className="text-xs text-muted max-w-xs mx-auto mb-4">
                You have not connected to any dApps yet. Paste a WalletConnect URI or use the test dApps to get started.
              </p>
              <button
                onClick={() => setActiveTab('connect')}
                className="btn-primary px-6 h-10 text-xs mx-auto inline-flex"
              >
                Connect a dApp
              </button>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.topic}
                className="p-4 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 p-1 flex items-center justify-center shrink-0">
                      {sess.dapp.icons[0] ? (
                        <img src={sess.dapp.icons[0]} alt={sess.dapp.name} className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Globe size={20} className="text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink">{sess.dapp.name}</h4>
                      <p className="text-[11px] text-muted truncate max-w-[180px]">{sess.dapp.url}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      walletConnectService.disconnectSession(sess.topic);
                      showToast(`Disconnected from ${sess.dapp.name}`, 'info');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-muted">Chains:</span>
                  <div className="flex flex-wrap gap-1">
                    {sess.connectedChains.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simulate incoming sign action for this session */}
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted">Simulate:</span>
                  <button
                    onClick={() => {
                      walletConnectService.simulateDAppSignRequest(sess.topic, 'personal_sign');
                      showToast('Queued personal_sign request', 'info');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                  >
                    personal_sign
                  </button>
                  <button
                    onClick={() => {
                      walletConnectService.simulateDAppSignRequest(sess.topic, 'typed_data');
                      showToast('Queued EIP-712 Permit request', 'info');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                  >
                    Permit2
                  </button>
                  <button
                    onClick={() => {
                      walletConnectService.simulateDAppSignRequest(sess.topic, 'transaction');
                      showToast('Queued transaction request', 'info');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                  >
                    Send Tx
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Settings */}
      {activeTab === 'settings' && (
        <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-ink mb-1">Reown / WalletConnect Project ID</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              You can use the default public project ID or enter your custom project ID from cloud.reown.com for your custom dApp relay.
            </p>
          </div>

          <input
            type="text"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            placeholder="Enter Reown project ID"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none focus:border-coral"
          />

          <button
            onClick={handleSaveProjectId}
            className="btn-primary w-full h-10 text-xs"
          >
            Save Project ID
          </button>
        </div>
      )}
    </div>
  );
};
