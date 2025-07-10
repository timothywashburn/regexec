'use client';

import { useState, useRef } from 'react';
import { createRegexFromInput } from '@/utils/regexParser';

interface CustomRegexInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  blur?: boolean;
}

export default function CustomRegexInput({
  value,
  onChange,
  placeholder = "Enter your regex pattern here...",
  disabled = false,
  className = "",
  blur = false
}: CustomRegexInputProps) {
  const [isValidRegex, setIsValidRegex] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateRegex = (pattern: string) => {
    if (!pattern.trim()) {
      setIsValidRegex(true);
      setErrorMessage('');
      return true;
    }

    const regex = createRegexFromInput(pattern);
    if (regex) {
      setIsValidRegex(true);
      setErrorMessage('');
      return true;
    } else {
      setIsValidRegex(false);
      setErrorMessage('Invalid regex pattern');
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validateRegex(newValue);
  };

  const handleFakeBoxClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  };

  const handleLeadingDelimiterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current && !disabled) {
      // If already focused, just move cursor
      if (document.activeElement === inputRef.current) {
        inputRef.current.setSelectionRange(0, 0);
      } else {
        inputRef.current.focus();
        // Use requestAnimationFrame to ensure focus is complete
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(0, 0);
        });
      }
    }
  };

  const handleTrailingDelimiterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current && !disabled) {
      const length = inputRef.current.value.length;
      // If already focused, just move cursor
      if (document.activeElement === inputRef.current) {
        inputRef.current.setSelectionRange(length, length);
      } else {
        inputRef.current.focus();
        // Use requestAnimationFrame to ensure focus is complete
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(length, length);
        });
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Your Regex Pattern
      </label>
      
      <div className="relative">
        {/* Fake textbox container */}
        <div 
          onClick={handleFakeBoxClick}
          className={`border rounded-lg transition-colors bg-white dark:bg-gray-900 cursor-text ${
            isValidRegex 
              ? isFocused
                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                : 'border-gray-300 dark:border-gray-600'
              : 'border-red-500 dark:border-red-400 ring-2 ring-red-500/20'
          }`}
        >
          <div className="flex font-jetbrains text-sm">
            {/* Leading / delimiter */}
            <span 
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLeadingDelimiterClick}
              className={`text-gray-400 dark:text-gray-500 select-none pl-3 py-3 flex items-center cursor-text ${blur ? 'blur-sm' : ''}`}
            >
              /
            </span>
            
            {/* Real input for pattern */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder=""
              disabled={disabled}
              className={`bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-3 min-w-0 ${blur ? 'blur-sm' : ''}`}
              style={{ 
                fontFamily: 'inherit', 
                width: value ? `${value.length}ch` : '1ch',
                minWidth: '1ch'
              }}
              spellCheck={false}
              autoComplete="off"
            />
            
            {/* Trailing /g delimiter */}
            <span 
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTrailingDelimiterClick}
              className={`text-gray-400 dark:text-gray-500 select-none pr-3 py-3 flex items-center cursor-text flex-1 ${blur ? 'blur-sm' : ''}`}
            >
              /g
            </span>
          </div>
        </div>
      </div>

      {!isValidRegex && errorMessage && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}
      
      {isValidRegex && value.trim() && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          ✓ Valid regex pattern
        </div>
      )}
    </div>
  );
}