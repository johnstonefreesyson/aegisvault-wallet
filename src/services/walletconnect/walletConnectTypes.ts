export interface DAppMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface WCSessionProposal {
  id: string;
  topic: string;
  dapp: DAppMetadata;
  requiredChains: string[]; // e.g. ['eip155:1', 'eip155:137']
  optionalChains?: string[];
  methods: string[]; // e.g. ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4']
  events: string[];
  timestamp: number;
}

export interface WCSession {
  topic: string;
  dapp: DAppMetadata;
  connectedChains: string[];
  accounts: string[];
  connectedAt: number;
  expiry: number;
  lastActive: number;
}

export interface WCSignRequest {
  id: string;
  topic: string;
  dapp: DAppMetadata;
  chainId: string; // e.g. 'eip155:1'
  method: 'personal_sign' | 'eth_signTypedData_v4' | 'eth_sendTransaction' | string;
  params: any;
  decodedData?: {
    humanText?: string;
    typedDataDomain?: any;
    typedDataMessage?: any;
    primaryType?: string;
    to?: string;
    valueEth?: string;
    dataHex?: string;
    estimatedGas?: string;
    simulationNotice?: string;
  };
  timestamp: number;
}
