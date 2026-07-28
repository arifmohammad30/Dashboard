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
    setIsOpen(false);

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
        className={`w-full flex items-center justify-between py-2.5 px-4 bg-white border ${
          error ? 'border-rose-400 focus:ring-rose-200' : isOpen ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-stone-200 hover:border-stone-300'
        } rounded-xl text-sm font-medium text-stone-800 shadow-2xs transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
      >
        <span className={activeValue ? 'text-stone-900 font-semibold' : 'text-stone-400'}>
          {currentDisplayLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ease-in-out shrink-0 ${
            isOpen ? 'rotate-180 text-sky-600' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#F8FAFC] border border-stone-200/90 shadow-xl rounded-2xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            const isSelected = activeValue === val;

            return (
              <div
                key={val}
                onClick={() => handleSelectOption(opt)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-150 mb-1 last:mb-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-stone-100/70 text-stone-700 hover:bg-slate-200/90 hover:text-slate-900 border border-stone-200/40'
                }`}
              >
                <span>{lbl}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
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
