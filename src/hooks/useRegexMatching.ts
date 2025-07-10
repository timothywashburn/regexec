import { useMemo } from 'react';
import { createRegexFromInput } from '@/utils/regexParser';

interface RegexMatchResult {
  correctMatches: number;
  totalTargets: number;
  userMatches: string[];
  isComplete: boolean;
}

export function useRegexMatching(
  text: string,
  targetMatches: string[],
  userRegex: string
): RegexMatchResult {
  return useMemo(() => {
    const result: RegexMatchResult = {
      correctMatches: 0,
      totalTargets: targetMatches.length,
      userMatches: [],
      isComplete: false
    };

    if (!userRegex || !userRegex.trim()) {
      return result;
    }

    const regex = createRegexFromInput(userRegex);
    if (regex) {
      const foundMatches: string[] = [];
      let match;
      
      // Find all matches from user's regex
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        foundMatches.push(match[0]);
        // Prevent infinite loops on zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
      
      result.userMatches = foundMatches;
      
      // Count how many target emails are correctly matched
      const correctlyMatched = targetMatches.filter(target => 
        foundMatches.some(userMatch => 
          userMatch === target  // Exact match, case-sensitive
        )
      );
      
      result.correctMatches = correctlyMatched.length;
      result.isComplete = result.correctMatches === result.totalTargets;
    }

    return result;
  }, [text, targetMatches, userRegex]);
}