'use client';

import styles from './NewsList.module.css';
import type { NewsItem } from '@/app/lib/types';

interface NewsListProps {
  items: NewsItem[];
}

export default function NewsList({ items }: NewsListProps) {
  if (items.length === 0) {
    return <p className={styles.empty}>No updates yet. Try another keyword or check back soon.</p>;
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={`${item.title}-${item.publishedAt}`} className={styles.item}>
          <div className={styles.meta}>
            <span className={styles.source}>{item.source}</span>
            <span className={styles.date}>{new Date(item.publishedAt).toLocaleDateString()}</span>
          </div>
          <a href={item.url} target="_blank" rel="noreferrer" className={styles.title}>
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
