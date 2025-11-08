// components/SkillChips/SkillChips.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import styles from './SkillChips.module.css';

interface SkillChipsProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}

export default function SkillChips({ value, onChange, placeholder = 'Type a skill and press Enter' }: SkillChipsProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  return (
    <div className={styles.container}>
      <div className={styles.chipList}>
        {value.map((skill) => (
          <span key={skill} className={styles.chip}>
            {skill}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          aria-label="Add skill"
        />
      </div>
    </div>
  );
}
