import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';
import { parseCustomFee, resolveFees } from '../src/services/blockchain/transactionService';
import { parseApproveCall } from '../src/services/blockchain/approvalService';
import { looksLikeSpam } from '../src/services/blockchain/indexerService';

describe('custom fees', () => {
  it('accepts valid gwei values and rejects bad ones', () => {
    expect(parseCustomFee({ maxFeeGwei: '20', priorityGwei: '1.5' })).toEqual({
      maxFee: ethers.parseUnits('20', 'gwei'),
      priority: ethers.parseUnits('1.5', 'gwei'),
    });
    expect(parseCustomFee({ maxFeeGwei: '', priorityGwei: '1' })).toBeNull();
    expect(parseCustomFee({ maxFeeGwei: '1', priorityGwei: '2' })).toBeNull(); // priority > max
    expect(parseCustomFee({ maxFeeGwei: 'abc', priorityGwei: '1' })).toBeNull();
  });
  it('uses legacy gasPrice when the chain has no EIP-1559 data', () => {
    const legacy = { gasPrice: ethers.parseUnits('5', 'gwei'), maxFeePerGas: null, maxPriorityFeePerGas: null } as unknown as ethers.FeeData;
    const r = resolveFees(legacy, 'fast');
    expect(r.gasPrice).toBeGreaterThan(ethers.parseUnits('5', 'gwei'));
    expect(r.maxFeePerGas).toBeUndefined();
    expect(resolveFees(legacy, 'normal', { maxFeeGwei: '9', priorityGwei: '1' }).gasPrice).toBe(ethers.parseUnits('9', 'gwei'));
  });
  it('scales 1559 fees by speed', () => {
    const fd = { gasPrice: 1n, maxFeePerGas: 100n * 10n ** 9n, maxPriorityFeePerGas: 2n * 10n ** 9n } as unknown as ethers.FeeData;
    expect(resolveFees(fd, 'slow').maxFeePerGas!).toBeLessThan(resolveFees(fd, 'fast').maxFeePerGas!);
  });
});

describe('approve calldata', () => {
  const iface = new ethers.Interface(['function approve(address,uint256)']);
  const spender = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
  it('extracts the spender', () => {
    expect(parseApproveCall(iface.encodeFunctionData('approve', [spender, 5n]))?.spender).toBe(spender);
  });
  it('ignores other calls', () => {
    expect(parseApproveCall('0xa9059cbb' + '0'.repeat(128))).toBeNull();
    expect(parseApproveCall(undefined)).toBeNull();
  });
});

describe('spam token heuristic', () => {
  it('flags airdrop lures, keeps normal tokens', () => {
    expect(looksLikeSpam('Visit uniswap-claim.xyz to claim', 'UNI-RWD')).toBe(true);
    expect(looksLikeSpam('Free 1000 USDT voucher', 'USDT')).toBe(true);
    expect(looksLikeSpam('Chainlink', 'LINK')).toBe(false);
    expect(looksLikeSpam('Uniswap', 'UNI')).toBe(false);
  });
});
