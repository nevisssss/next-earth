'use client';

import styles from './RoleCard.module.css';
import WhyBox from '../WhyBox/WhyBox';
import type { Recommendation } from '@/app/lib/types';

interface RoleCardProps {
  recommendation: Recommendation;
  onInterested?: (roleId: string) => void;
}

export default function RoleCard({ recommendation, onInterested }: RoleCardProps) {
  const handleInterested = () => {
    onInterested?.(recommendation.id);
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>Suggested role</p>
          <h3 className={styles.title}>{recommendation.title}</h3>
        </div>
        <div className={styles.scoreBox} aria-label={`Match score ${Math.round(recommendation.score * 100)} percent`}>
          <span className={styles.scoreValue}>{Math.round(recommendation.score * 100)}</span>
          <span className={styles.scoreSuffix}>match</span>
        </div>
      </header>

      <div className={styles.body}>
        <WhyBox why={recommendation.why} />

        <div className={styles.learning}>
          <h4>Micro-learning boosts</h4>
          <ul>
            {recommendation.microlearning.map((item) => (
              <li key={item.link}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleInterested}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className={styles.footer}>
        <button type="button" onClick={handleInterested} className={styles.interestedBtn}>
          I want to explore this
        </button>
      </footer>
    </article>
  );
}
