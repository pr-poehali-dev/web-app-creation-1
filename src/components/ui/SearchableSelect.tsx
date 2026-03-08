import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  allowCustom?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Начните вводить...',
  disabled = false,
  id,
  allowCustom = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = (options ?? []).filter(o =>
    String(o ?? '').toLowerCase().includes(String(isOpen ? search : value ?? '').toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (allowCustom && isOpen && search) {
          onChange(search);
        }
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowCustom, isOpen, search, onChange]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearch(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (allowCustom) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCustom && search) {
      e.preventDefault();
      onChange(search);
      setIsOpen(false);
      setSearch('');
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={isOpen ? search : value}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-8"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={disabled}
        >
          <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
          {allowCustom && search && !options.includes(search) && (
            <button
              type="button"
              onClick={() => handleSelect(search)}
              className="w-full text-left px-3 py-2 text-sm border-b border-input hover:bg-accent transition-colors text-primary font-medium"
            >
              Использовать: «{search}»
            </button>
          )}
          {filtered.length > 0 ? (
            filtered.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-input last:border-b-0 hover:bg-accent transition-colors ${
                  value === option ? 'bg-accent font-medium' : ''
                }`}
              >
                {option}
              </button>
            ))
          ) : !allowCustom ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}