export function createRegexFromInput(input: string): RegExp | null {
  if (!input || !input.trim()) return null;
  
  try {
    // Always use global flag only - no user flag control
    return new RegExp(input.trim(), 'g');
  } catch {
    return null;
  }
}

export function formatRegexDisplay(pattern: string): string {
  // Format like regexr.com: /pattern/g
  if (!pattern.trim()) return '';
  return `/${pattern.trim()}/g`;
}