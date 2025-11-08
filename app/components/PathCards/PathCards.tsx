// components/PathCards/PathCards.tsx
'use client';

import { PathChoice } from '../../lib/types';
import styles from './PathCards.module.css';

interface PathCardsProps {
  selected?: PathChoice;
  onSelect: (path: PathChoice) => void;
}

const pathOptions = [
  {
    id: 'help_hospitals' as PathChoice,
    title: 'Help Hospitals',
    description: 'Support healthcare facilities in climate-affected areas',
    icon: '🏥',
  },
  {
    id: 'post_disaster' as PathChoice,
    title: 'Support Communities After Disasters',
    description: 'Aid recovery and rebuilding efforts',
    icon: '🤝',
  },
  {
    id: 'green_workforce' as PathChoice,
    title: 'Join the Green Workforce',
    description: 'Build a career in sustainable industries',
    icon: '🌱',
  },
];

export default function PathCards({ selected, onSelect }: PathCardsProps) {
  return (
    <div className={styles.container}>
      {pathOptions.map((option) => (
        <button
          key={option.id}
          className={`${styles.card} ${selected === option.id ? styles.selected : ''} appear`}
          onClick={() => onSelect(option.id)}
          aria-pressed={selected === option.id}
        >
          <span className={styles.icon}>{option.icon}</span>
          <h3 className={styles.title}>{option.title}</h3>
          <p className={styles.description}>{option.description}</p>
        </button>
      ))}
    </div>
  );
}
