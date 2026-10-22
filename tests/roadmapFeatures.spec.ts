import { describe, it, expect } from 'vitest';
import { evaluatePasscode } from '../src/utils/passcodeSecurity';
import { unlockThrottle } from '../src/services/storage/unlockThrottle';
import { multiChainService } from '../src/services/blockchain/multichain/multiChainService';
import { walletConnectService } from '../src/services/walletconnect/walletConnectService';
import { riskScanner } from '../src/services/security/riskScanner';
import { txSimulator } from '../src/services/security/txSimulator';

describe('Phase 0: Passcode Security and Throttling', () => {
  it('rejects trivial, sequential, or blacklisted passcodes', () => {
    expect(evaluatePasscode('123456').isValid).toBe(false);
    expect(evaluatePasscode('000000').isValid).toBe(false);
    expect(evaluatePasscode('password').isValid).toBe(false);
    expect(evaluatePasscode('12345678').isValid).toBe(false);
  });

  it('approves robust passcodes with high entropy', () => {
    const strong = evaluatePasscode('AegisVault#2026!');
    expect(strong.isValid).toBe(true);
    expect(strong.score).toBeGreaterThanOrEqual(3);
  });

  it('unlock throttle schedules backoff on failed attempts', () => {
    unlockThrottle.reset();
    expect(unlockThrottle.getThrottleState().isLocked).toBe(false);

    // 1st attempt: no delay
    unlockThrottle.recordFailedAttempt();
    expect(unlockThrottle.getThrottleState().isLocked).toBe(false);

    // 3rd attempt: 15s delay
    unlockThrottle.recordFailedAttempt();
    const third = unlockThrottle.recordFailedAttempt();
    expect(third.isLocked).toBe(true);
    expect(third.remainingSeconds).toBeGreaterThan(0);

    unlockThrottle.reset();
  });
});

describe('Phase 1: WalletConnect v2', () => {
  it('parses valid wc: v2 URIs and rejects invalid versions', () => {
    const validUri = 'wc:7f6e507f383a1383765709cb7c838f4a7302400ac197bd76e83bed4f414f6775@2?relay-protocol=irn&symKey=587d5484ce91cbe0cf583d4704c09425c675c768a1266b637365c7974f14fa3b';
    const parsed = walletConnectService.parseUri(validUri);
    expect(parsed.version).toBe(2);
    expect(parsed.topic).toBe('7f6e507f383a1383765709cb7c838f4a7302400ac197bd76e83bed4f414f6775');
    expect(parsed.symKey).toBeDefined();

    expect(() => walletConnectService.parseUri('invalid-uri')).toThrow();
  });

  it('decodes personal_sign hex data into human readable text', () => {
    const hex = '0x48656c6c6f2057656233'; // "Hello Web3"
    const req = walletConnectService.queueSignRequest('topic_test', 'personal_sign', [hex, '0x123']);
    expect(req.decodedData?.humanText).toBe('Hello Web3');
    expect(req.method).toBe('personal_sign');

    walletConnectService.rejectRequest(req.id);
  });
});

describe('Phase 2: Multi-Chain Derivations', () => {
  const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('derives native segwit Bitcoin address (bc1q...) and legacy address (1...)', () => {
    const btc = multiChainService.deriveBitcoinAccount(phrase);
    expect(btc.nativeSegwit.startsWith('bc1q')).toBe(true);
    expect(btc.legacy.startsWith('1')).toBe(true);
    expect(btc.derivationPath).toBe("m/84'/0'/0'/0/0");
  });

  it('derives Solana, Tron, and Cosmos accounts deterministically', () => {
    const sol = multiChainService.deriveSolanaAccount(phrase);
    expect(sol.address).toBeDefined();
    expect(sol.derivationPath).toBe("m/44'/501'/0'/0'");

    const trx = multiChainService.deriveTronAccount(phrase);
    expect(trx.address.startsWith('T')).toBe(true);
    expect(trx.derivationPath).toBe("m/44'/195'/0'/0/0");

    const atom = multiChainService.deriveCosmosAccount(phrase);
    expect(atom.address.startsWith('cosmos1')).toBe(true);
    expect(atom.derivationPath).toBe("m/44'/118'/0'/0/0");
  });
});

describe('Phase 6: Security Scanner & Simulation', () => {
  it('flags address poisoning candidate sharing identical start/end chars', async () => {
    const legitUserAddress = '0x1234567890abcdef1234567890abcdef1234abcd';
    const fakePoisonedAddress = '0x123499999999999999999999999999999999abcd';

    const audit = await riskScanner.scanAddress(fakePoisonedAddress, [legitUserAddress]);
    expect(audit.isAddressPoisoningCandidate).toBe(true);
    expect(audit.level).toBe('CRITICAL');
  });

  it('flags zero address burn hazard', async () => {
    const nullAddr = '0x0000000000000000000000000000000000000000';
    const audit = await riskScanner.scanAddress(nullAddr);
    expect(audit.level).toBe('CRITICAL');
    expect(audit.flags.some((f) => f.id === 'zero_address')).toBe(true);
  });

  it('simulates transaction and alerts on unlimited token approvals', () => {
    // approve spender max uint256
    const infiniteApproveCalldata =
      '0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const sim = txSimulator.simulateTransaction({
      to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      from: '0x1234',
      data: infiniteApproveCalldata,
    });
    expect(sim.unlimitedAllowanceGranted).toBe(true);
    expect(sim.verdict).toBe('WARNING');
  });
});
