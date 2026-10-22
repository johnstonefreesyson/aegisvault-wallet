import React from 'react';

const NAVY = '#1a2a52';
const PEACH = '#ffdac4';
const CORAL = '#f4693f';
const SKY = '#5aaef0';
const CLOUD = '#e6ebf6';

const Backdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 320 300" className="w-full h-full" fill="none" role="img" aria-hidden="true">
    <path d="M52 92c0-14 12-24 26-24 4-14 18-24 34-24 19 0 34 12 36 28 14 1 24 10 24 22 0 0-120 0-120-2z" fill={CLOUD} />
    <path d="M214 74c0-9 8-16 18-16 3-9 12-15 23-15 13 0 22 8 24 18 9 1 15 7 15 13H214z" fill={CLOUD} />
    {children}
    <ellipse cx="160" cy="268" rx="70" ry="8" fill={CLOUD} />
  </svg>
);

export const PhoneIllustration: React.FC = () => (
  <Backdrop>
    <g transform="rotate(8 190 180)">
      <rect x="170" y="108" width="84" height="132" rx="14" fill="#c9d6ee" />
    </g>
    <g transform="rotate(-6 150 170)">
      <rect x="104" y="106" width="92" height="150" rx="14" fill={PEACH} stroke={NAVY} strokeWidth="3" />
      <rect x="138" y="114" width="26" height="6" rx="3" fill={NAVY} />
      <circle cx="150" cy="150" r="18" fill={CORAL} />
      <text x="150" y="158" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">$</text>
      <rect x="116" y="180" width="68" height="12" rx="6" fill="#fff" />
      <rect x="116" y="198" width="68" height="12" rx="6" fill="#fff" />
      <rect x="116" y="220" width="68" height="14" rx="7" fill={NAVY} />
    </g>
    <circle cx="104" cy="214" r="30" fill={SKY} />
    <circle cx="104" cy="206" r="8" stroke="#fff" strokeWidth="2" />
    <path d="M88 232c2-10 9-15 16-15s14 5 16 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </Backdrop>
);

export const CardsIllustration: React.FC = () => (
  <Backdrop>
    <g transform="rotate(-10 170 170)">
      <rect x="96" y="120" width="130" height="86" rx="10" fill="#9fb8cf" />
      <rect x="96" y="134" width="130" height="16" fill={NAVY} opacity=".7" />
    </g>
    <g transform="rotate(-3 160 190)">
      <rect x="82" y="150" width="140" height="94" rx="10" fill={PEACH} stroke={NAVY} strokeWidth="3" />
      <rect x="82" y="162" width="140" height="22" fill={NAVY} opacity=".75" />
      <rect x="96" y="196" width="56" height="5" rx="2.5" fill={CORAL} opacity=".6" />
      <rect x="96" y="208" width="38" height="5" rx="2.5" fill={CORAL} opacity=".6" />
    </g>
    <circle cx="232" cy="206" r="32" fill={SKY} />
    <path d="M216 207l11 11 21-22" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Backdrop>
);

export const GlobalIllustration: React.FC = () => (
  <Backdrop>
    <g transform="rotate(14 165 190)">
      <rect x="86" y="150" width="160" height="88" rx="8" fill={NAVY} stroke="#fff" strokeWidth="3" />
      <circle cx="166" cy="194" r="24" fill="#12204a" />
      <circle cx="166" cy="194" r="18" fill={PEACH} />
      <text x="166" y="202" textAnchor="middle" fontSize="22" fontWeight="700" fill={NAVY}>$</text>
      <circle cx="98" cy="162" r="9" fill={PEACH} />
      <circle cx="234" cy="226" r="9" fill={PEACH} />
    </g>
    <circle cx="106" cy="138" r="34" fill={SKY} />
    <circle cx="106" cy="138" r="14" stroke="#fff" strokeWidth="2" />
    <ellipse cx="106" cy="138" rx="6" ry="14" stroke="#fff" strokeWidth="2" />
    <path d="M92 138h28" stroke="#fff" strokeWidth="2" />
    {[[226, 150, 9, PEACH], [250, 172, 8, CORAL], [140, 238, 10, PEACH], [196, 120, 7, CORAL], [240, 130, 6, PEACH]].map(([x, y, r, c], i) => (
      <g key={i}>
        <circle cx={x as number} cy={y as number} r={r as number} fill={c as string} />
        <text x={x as number} y={(y as number) + (r as number) * 0.4} textAnchor="middle" fontSize={(r as number) * 1.2} fontWeight="700" fill={NAVY}>$</text>
      </g>
    ))}
  </Backdrop>
);

export const ShieldIllustration: React.FC = () => (
  <Backdrop>
    <g transform="rotate(8 200 170)">
      <rect x="168" y="112" width="92" height="120" rx="14" fill="#c9d6ee" />
    </g>
    <g transform="rotate(-4 160 175)">
      <path d="M160 100l56 20v46c0 36-24 62-56 76-32-14-56-40-56-76v-46z" fill={PEACH} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      <rect x="138" y="158" width="44" height="36" rx="8" fill={NAVY} />
      <path d="M146 158v-10a14 14 0 0 1 28 0v10" stroke={NAVY} strokeWidth="5" strokeLinecap="round" />
      <circle cx="160" cy="175" r="5" fill={CORAL} />
      <rect x="158" y="177" width="4" height="10" rx="2" fill={CORAL} />
    </g>
    <circle cx="226" cy="214" r="30" fill={SKY} />
    <path d="M211 215l10 10 20-21" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {[[92, 150, 7, CORAL], [250, 126, 6, PEACH], [112, 232, 6, PEACH]].map(([x, y, r, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} />
    ))}
  </Backdrop>
);

export const ChartIllustration: React.FC = () => (
  <Backdrop>
    <g transform="rotate(7 190 180)">
      <rect x="170" y="116" width="84" height="124" rx="14" fill="#c9d6ee" />
    </g>
    <g transform="rotate(-5 150 175)">
      <rect x="96" y="112" width="112" height="140" rx="14" fill={PEACH} stroke={NAVY} strokeWidth="3" />
      <rect x="132" y="120" width="40" height="6" rx="3" fill={NAVY} />
      <rect x="110" y="140" width="84" height="46" rx="10" fill="#fff" />
      <path d="M118 176l18-14 14 8 20-20 18 10" stroke={CORAL} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="110" y="196" width="84" height="12" rx="6" fill="#fff" />
      <rect x="110" y="214" width="84" height="16" rx="8" fill={NAVY} />
    </g>
    <circle cx="96" cy="218" r="30" fill={SKY} />
    <path d="M82 212h26m0 0l-7-7m7 7l-7 7M110 226H84m0 0l7-7m-7 7l7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="238" cy="150" r="14" fill={CORAL} />
    <text x="238" y="156" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">$</text>
  </Backdrop>
);
