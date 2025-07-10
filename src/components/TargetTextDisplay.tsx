'use client';

import { useMemo } from 'react';
import { createRegexFromInput } from '@/utils/regexParser';

interface TargetTextDisplayProps {
  text: string;
  targetMatches: string[]; // Array of strings that should be highlighted as targets
  userRegex: string; // User's regex pattern
  userMatchColor: string; // Color for user's matches (e.g., 'blue' or 'red')
  targetMatchColor?: string; // Color for target matches (default: 'yellow')
  className?: string;
}

interface CharacterState {
  char: string;
  isTarget: boolean;
  isUserMatch: boolean;
}

export default function TargetTextDisplay({
  text,
  targetMatches,
  userRegex,
  userMatchColor,
  targetMatchColor = 'yellow',
  className = ''
}: TargetTextDisplayProps) {
  
  const characterStates = useMemo(() => {
    if (!text) return [];

    // Initialize all characters as normal
    const states: CharacterState[] = text.split('').map(char => ({
      char,
      isTarget: false,
      isUserMatch: false
    }));

    // Mark target characters
    targetMatches.forEach(target => {
      const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        for (let i = match.index; i < match.index + match[0].length; i++) {
          states[i].isTarget = true;
        }
        // Prevent infinite loops on zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });

    // Mark user regex matches
    if (userRegex && userRegex.trim()) {
      const regex = createRegexFromInput(userRegex);
      if (regex) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          for (let i = match.index; i < match.index + match[0].length; i++) {
            states[i].isUserMatch = true;
          }
          // Prevent infinite loops on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      }
    }

    return states;
  }, [text, targetMatches, userRegex]);

  const getCharacterClass = (state: CharacterState) => {
    if (state.isTarget && state.isUserMatch) {
      // Correct match - green
      return 'bg-green-400/50 dark:bg-green-600/50';
    } else if (state.isTarget && !state.isUserMatch) {
      // Target character not matched - yellow
      return 'bg-yellow-300/50 dark:bg-yellow-600/50';
    } else if (!state.isTarget && state.isUserMatch) {
      // Incorrect match - red
      return 'bg-red-400/50 dark:bg-red-600/50';
    }
    // Normal character - no background
    return '';
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm leading-relaxed max-h-80 overflow-y-auto font-jetbrains ${className}`}>
      <div className="text-gray-800 dark:text-gray-200">
        {characterStates.map((state, index) => (
          <span
            key={index}
            className={getCharacterClass(state)}
          >
            {state.char}
          </span>
        ))}
      </div>
    </div>
  );
}