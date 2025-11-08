'use client';

import styles from './WhyBox.module.css';

interface WhyBoxProps {
  why: string;
  source?: string;
}

export default function WhyBox({ why, source = 'ASDI/NOAA data' }: WhyBoxProps) {
  return (
    <div className={styles.container}>
      <p className={styles.caption}>Why this fits you</p>
      <p className={styles.copy}>{why}</p>
      <p className={styles.source}>Data: {source}</p>
    </div>
  );
}
