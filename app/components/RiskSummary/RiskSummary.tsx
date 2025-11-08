'use client';

import styles from './RiskSummary.module.css';
import type { RiskSnapshot } from '@/app/lib/types';

interface RiskSummaryProps {
  risk: Omit<RiskSnapshot, 'country'> & { source: string };
}

const labels: { key: 'flood' | 'cyclone' | 'heat'; label: string }[] = [
  { key: 'flood', label: 'Flood' },
  { key: 'cyclone', label: 'Cyclone' },
  { key: 'heat', label: 'Extreme heat' },
];

export default function RiskSummary({ risk }: RiskSummaryProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h4>Country risk snapshot</h4>
        <span className={styles.source}>{risk.source}</span>
      </header>
      <ul className={styles.metrics}>
        {labels.map(({ key, label }) => {
          const value = Math.round((risk[key] ?? 0) * 100);
          return (
            <li key={key}>
              <div className={styles.metricHeader}>
                <span>{label}</span>
                <span className={styles.value}>{value}</span>
              </div>
              <div className={styles.bar} aria-hidden="true">
                <div className={styles.fill} style={{ width: `${value}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
