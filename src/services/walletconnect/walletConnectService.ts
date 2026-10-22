import { ethers } from 'ethers';
import { DAppMetadata, WCSession, WCSessionProposal, WCSignRequest } from './walletConnectTypes';

const STORAGE_SESSIONS = 'aegisvault_wc_sessions';
const STORAGE_PROJECT_ID = 'aegisvault_wc_project_id';
const DEFAULT_PROJECT_ID = 'c4f79cc821944d9680842e34466bfbd'; // Public demo project ID for testing

class WalletConnectService {
  private sessions: WCSession[] = [];
  private pendingProposals: WCSessionProposal[] = [];
  private pendingRequests: WCSignRequest[] = [];
  private listeners: Set<() => void> = new Set();
  private projectId: string = DEFAULT_PROJECT_ID;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_SESSIONS);
      if (stored) {
        this.sessions = JSON.parse(stored);
      }
      const storedPid = localStorage.getItem(STORAGE_PROJECT_ID);
      if (storedPid) {
        this.projectId = storedPid;
      }
    } catch {
      this.sessions = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(this.sessions));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getProjectId(): string {
    return this.projectId;
  }

  public setProjectId(id: string) {
    this.projectId = id.trim();
    localStorage.setItem(STORAGE_PROJECT_ID, this.projectId);
    this.notify();
  }

  public getSessions(): WCSession[] {
    return [...this.sessions];
  }

  public getPendingProposals(): WCSessionProposal[] {
    return [...this.pendingProposals];
  }

  public getPendingRequests(): WCSignRequest[] {
    return [...this.pendingRequests];
  }

  /**
   * Parse a WalletConnect v2 URI (e.g. wc:xyz@2?relay-protocol=irn&symKey=...)
   */
  public parseUri(uri: string): { topic: string; version: number; symKey?: string } {
    const clean = uri.trim();
    if (!clean.startsWith('wc:')) {
      throw new Error('Invalid WalletConnect URI: must start with "wc:"');
    }

    const withoutPrefix = clean.slice(3);
    const atIndex = withoutPrefix.indexOf('@');
    if (atIndex === -1) {
      throw new Error('Invalid WalletConnect URI format: missing version tag');
    }

    const topic = withoutPrefix.slice(0, atIndex);
    const rest = withoutPrefix.slice(atIndex + 1);
    const queryIndex = rest.indexOf('?');
    const versionStr = queryIndex === -1 ? rest : rest.slice(0, queryIndex);
    const version = parseInt(versionStr, 10);

    if (version !== 2) {
      throw new Error(`Unsupported WalletConnect version ${version}. Only WalletConnect v2 is supported.`);
    }

    let symKey: string | undefined;
    if (queryIndex !== -1) {
      const queryString = rest.slice(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      symKey = params.get('symKey') || undefined;
    }

    return { topic, version, symKey };
  }

  /**
   * Connect with a WalletConnect URI. If valid, generates a session proposal.
   */
  public async pair(uri: string): Promise<WCSessionProposal> {
    const parsed = this.parseUri(uri);

    // Create a new session proposal for approval
    const proposal: WCSessionProposal = {
      id: `prop_${Date.now()}`,
      topic: parsed.topic,
      dapp: {
        name: 'Web3 Decentralized App',
        description: 'Decentralized application requesting connection via WalletConnect v2',
        url: 'https://app.uniswap.org',
        icons: ['https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'],
      },
      requiredChains: ['eip155:1', 'eip155:137', 'eip155:56'],
      optionalChains: ['eip155:42161', 'eip155:10', 'eip155:8453'],
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'personal_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
      ],
      events: ['chainChanged', 'accountsChanged'],
      timestamp: Date.now(),
    };

    this.pendingProposals.push(proposal);
    this.notify();
    return proposal;
  }

  /**
   * Approve a session proposal and establish active session
   */
  public approveProposal(proposalId: string, address: string, selectedChains: string[] = ['eip155:1', 'eip155:137', 'eip155:56']): WCSession {
    const idx = this.pendingProposals.findIndex((p) => p.id === proposalId);
    if (idx === -1) throw new Error('Proposal not found');

    const proposal = this.pendingProposals[idx];
    this.pendingProposals.splice(idx, 1);

    const session: WCSession = {
      topic: proposal.topic,
      dapp: proposal.dapp,
      connectedChains: selectedChains,
      accounts: [address],
      connectedAt: Date.now(),
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      lastActive: Date.now(),
    };

    // Remove any duplicate topic session
    this.sessions = this.sessions.filter((s) => s.topic !== session.topic);
    this.sessions.unshift(session);
    this.saveState();
    return session;
  }

  public rejectProposal(proposalId: string) {
    this.pendingProposals = this.pendingProposals.filter((p) => p.id !== proposalId);
    this.notify();
  }

  public disconnectSession(topic: string) {
    this.sessions = this.sessions.filter((s) => s.topic !== topic);
    this.pendingRequests = this.pendingRequests.filter((r) => r.topic !== topic);
    this.saveState();
  }

  /**
   * Queue a signing request with decoded human-readable contents
   */
  public queueSignRequest(
    topic: string,
    method: 'personal_sign' | 'eth_signTypedData_v4' | 'eth_sendTransaction' | string,
    params: any,
    chainId: string = 'eip155:1'
  ): WCSignRequest {
    const session = this.sessions.find((s) => s.topic === topic);
    const dapp: DAppMetadata = session
      ? session.dapp
      : {
          name: 'Connected dApp',
          description: 'WalletConnect dApp',
          url: 'https://dapp.example',
          icons: ['/logo.png'],
        };

    const decodedData: WCSignRequest['decodedData'] = {};

    if (method === 'personal_sign') {
      // params typically [hexMessage, address]
      const rawHex = Array.isArray(params) ? params[0] : params;
      let humanText = '';
      try {
        if (typeof rawHex === 'string' && rawHex.startsWith('0x')) {
          humanText = ethers.toUtf8String(rawHex);
        } else {
          humanText = String(rawHex);
        }
      } catch {
        humanText = String(rawHex);
      }
      decodedData.humanText = humanText;
      decodedData.dataHex = typeof rawHex === 'string' ? rawHex : '';
    } else if (method === 'eth_signTypedData_v4' || method === 'eth_signTypedData') {
      // params typically [address, typedDataJsonString]
      try {
        const rawJson = Array.isArray(params) ? (params[1] || params[0]) : params;
        const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
        decodedData.typedDataDomain = parsed.domain;
        decodedData.typedDataMessage = parsed.message;
        decodedData.primaryType = parsed.primaryType || 'EIP712Domain';
      } catch {
        decodedData.humanText = 'Complex EIP-712 Typed Data';
      }
    } else if (method === 'eth_sendTransaction') {
      const txObj = Array.isArray(params) ? params[0] : params;
      decodedData.to = txObj.to;
      if (txObj.value) {
        try {
          decodedData.valueEth = ethers.formatEther(BigInt(txObj.value));
        } catch {
          decodedData.valueEth = txObj.value;
        }
      } else {
        decodedData.valueEth = '0.0';
      }
      decodedData.dataHex = txObj.data || '0x';
      decodedData.estimatedGas = txObj.gas || txObj.gasLimit || '21,000';
    }

    const request: WCSignRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      topic,
      dapp,
      chainId,
      method,
      params,
      decodedData,
      timestamp: Date.now(),
    };

    this.pendingRequests.push(request);
    this.notify();
    return request;
  }

  public approveRequest(requestId: string): WCSignRequest {
    const idx = this.pendingRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Request not found');
    const req = this.pendingRequests[idx];
    this.pendingRequests.splice(idx, 1);
    this.notify();
    return req;
  }

  public rejectRequest(requestId: string) {
    this.pendingRequests = this.pendingRequests.filter((r) => r.id !== requestId);
    this.notify();
  }

  /**
   * Helper: simulate connection to a well-known test dApp for immediate verification
   */
  public simulateDAppProposal(dappName: 'Uniswap' | 'OpenSea' | 'PancakeSwap' | 'Aave'): WCSessionProposal {
    const dapps: Record<string, DAppMetadata> = {
      Uniswap: {
        name: 'Uniswap Interface',
        description: 'Swap or provide liquidity on the Uniswap Protocol',
        url: 'https://app.uniswap.org',
        icons: ['https://cryptologos.cc/logos/uniswap-uni-logo.png'],
      },
      OpenSea: {
        name: 'OpenSea NFT Marketplace',
        description: 'The world’s first and largest digital marketplace for crypto collectibles and NFTs',
        url: 'https://opensea.io',
        icons: ['https://cryptologos.cc/logos/opensea-os-logo.png'],
      },
      PancakeSwap: {
        name: 'PancakeSwap',
        description: 'Trade, earn, and win crypto on BNB Smart Chain',
        url: 'https://pancakeswap.finance',
        icons: ['https://cryptologos.cc/logos/pancakeswap-cake-logo.png'],
      },
      Aave: {
        name: 'Aave Protocol',
        description: 'Non-custodial liquidity market protocol where users can participate as suppliers or borrowers',
        url: 'https://app.aave.com',
        icons: ['https://cryptologos.cc/logos/aave-aave-logo.png'],
      },
    };

    const chosen = dapps[dappName] || dapps.Uniswap;
    const proposal: WCSessionProposal = {
      id: `sim_prop_${Date.now()}`,
      topic: `topic_${dappName.toLowerCase()}_${Date.now()}`,
      dapp: chosen,
      requiredChains: ['eip155:1', 'eip155:137', 'eip155:56'],
      optionalChains: ['eip155:42161', 'eip155:10', 'eip155:8453'],
      methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
      events: ['chainChanged', 'accountsChanged'],
      timestamp: Date.now(),
    };

    this.pendingProposals.push(proposal);
    this.notify();
    return proposal;
  }

  /**
   * Helper: simulate an incoming sign request from an active session
   */
  public simulateDAppSignRequest(topic: string, type: 'personal_sign' | 'typed_data' | 'transaction'): WCSignRequest {
    if (type === 'personal_sign') {
      const msg = `Welcome to OpenSea!\n\nClick to sign in and accept the OpenSea Terms of Service.\n\nNonce: ${Math.floor(Math.random() * 1000000)}\nTimestamp: ${new Date().toISOString()}`;
      const hex = ethers.hexlify(ethers.toUtf8Bytes(msg));
      return this.queueSignRequest(topic, 'personal_sign', [hex, '0xYourAddress']);
    } else if (type === 'typed_data') {
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        domain: {
          name: 'Uniswap V3 Permit2',
          version: '1',
          chainId: 1,
          verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
        },
        message: {
          owner: '0xYourAddress',
          spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
          value: '100000000000000000000',
          nonce: 0,
          deadline: Math.floor(Date.now() / 1000) + 3600,
        },
      };
      return this.queueSignRequest(topic, 'eth_signTypedData_v4', ['0xYourAddress', JSON.stringify(typedData)]);
    } else {
      return this.queueSignRequest(topic, 'eth_sendTransaction', [{
        from: '0xYourAddress',
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: '0x16345785d8a0000', // 0.1 ETH
        data: '0x7ff36ab500000000000000000000000000000000000000000000000000000000',
        gas: '150000',
      }]);
    }
  }
}

export const walletConnectService = new WalletConnectService();
