import React, { forwardRef, memo } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = memo(
  forwardRef(function SearchInput(
    {
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      className = '',
      wrapperClassName = 'w-full sm:w-[400px]',
      disabled = false,
      ...rest
    },
    ref
  ) {
    const handleClear = (e) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: '' } });
      }
    };

    return (
      <div className={`relative group ${wrapperClassName}`}>
        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#4DA944] transition-colors z-10">
          <Search className="w-4.5 h-4.5" />
        </div>

        <input
          ref={ref}
          type="text"
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-12 pr-9 py-2.5 bg-white border border-stone-200/90 rounded-2xl text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#4DA944] focus:ring-0 shadow-none transition-colors duration-150 disabled:bg-stone-50 disabled:cursor-not-allowed ${className}`}
          {...rest}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  })
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
