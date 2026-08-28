import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = forwardRef(({
  options = [],
  placeholder = "Select an option",
  error,
  value: controlledValue,
  onChange,
  onBlur,
  disabled = false,
  name,
  className = "",
  buttonClassName = "",
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const hiddenSelectRef = useRef(null);
  const containerRef = useRef(null);

  const getRefValue = () => {
    if (controlledValue !== undefined) return controlledValue;
    if (hiddenSelectRef.current) return hiddenSelectRef.current.value || '';
    return '';
  };

  const [selectedValue, setSelectedValue] = useState(getRefValue());

  useEffect(() => {
    if (controlledValue !== undefined) {
      setSelectedValue(controlledValue);
    } else if (hiddenSelectRef.current) {
      setSelectedValue(hiddenSelectRef.current.value || '');
    }
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onBlur) onBlur(event);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const handleSelectOption = (opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    setSelectedValue(val);

    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = val;
      const event = new Event('change', { bubbles: true });
      hiddenSelectRef.current.dispatchEvent(event);
    }

    if (onChange) {
      onChange({ target: { name, value: val } });
    }
  };

  const activeValue = selectedValue || (hiddenSelectRef.current ? hiddenSelectRef.current.value : '');

  const currentDisplayLabel = () => {
    if (!activeValue) return placeholder;
    const found = options.find(o => (typeof o === 'object' ? o.value === activeValue : o === activeValue));
    if (found) {
      return typeof found === 'object' ? found.label : found;
    }
    return activeValue;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <select
        ref={(e) => {
          hiddenSelectRef.current = e;
          if (typeof ref === 'function') ref(e);
          else if (ref) ref.current = e;
        }}
        name={name}
        value={activeValue}
        onChange={(e) => {
          setSelectedValue(e.target.value);
          if (onChange) onChange(e);
        }}
        onBlur={onBlur}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        {...rest}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${
          buttonClassName || 'py-2.5 px-4 text-xs bg-white'
        } border ${
          error ? 'border-rose-400' : isOpen ? 'border-slate-800' : 'border-stone-200/90 hover:border-stone-300'
        } rounded-xl font-medium text-stone-800 transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      >
        <span className={activeValue ? 'text-stone-900 font-bold' : 'text-stone-400'}>
          {currentDisplayLabel()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ease-in-out shrink-0 ${
            isOpen ? 'rotate-180 text-slate-800' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[99] bg-white border border-stone-200/90 shadow-lg rounded-xl p-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            const isSelected = activeValue === val;

            return (
              <div
                key={val}
                onClick={() => handleSelectOption(opt)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-150 mb-0.5 last:mb-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-slate-900'
                }`}
              >
                <span>{lbl}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
              </div>
            );
          })}
        </div>
      )}


      {error && (
        <p className="mt-1.5 text-xs font-bold text-rose-500">
          {error.message || (typeof error === 'string' ? error : 'Invalid selection')}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default React.memo(Select);
