import React, { forwardRef, useState, useRef, useEffect } from 'react';

const Input = forwardRef(({ placeholder, icon, type = "text", error, className = "", onChange, onInput, onKeyUp, value, defaultValue, ...rest }, ref) => {
  const inputRef = useRef(null);

  const getIsFilled = (e) => {
    const el = e ? e.target : inputRef.current;
    if (!el) return false;
    const val = el.value !== undefined ? el.value : (value !== undefined ? value : defaultValue);
    return val !== undefined && val !== null && String(val).trim() !== '';
  };

  const [hasValue, setHasValue] = useState(() => {
    const v = value !== undefined ? value : defaultValue;
    return v !== undefined && v !== null && String(v).trim() !== '';
  });

  const checkValue = (e) => {
    setHasValue(getIsFilled(e));
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const syncValue = () => {
      const v = el.value;
      const filled = v !== undefined && v !== null && String(v).trim() !== '';
      setHasValue(filled);
    };

    syncValue();

    const form = el.form;
    if (form) {
      form.addEventListener('reset', syncValue);
    }

    const intervalId = setInterval(syncValue, 250);

    return () => {
      if (form) {
        form.removeEventListener('reset', syncValue);
      }
      clearInterval(intervalId);
    };
  }, [value, defaultValue]);

  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-stone-400 sm:text-sm">{icon}</span>
        </div>
      )}
      <input
        type={type}
        ref={(el) => {
          inputRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          checkValue(e);
          if (onChange) onChange(e);
        }}
        onInput={(e) => {
          checkValue(e);
          if (onInput) onInput(e);
        }}
        onKeyUp={(e) => {
          checkValue(e);
          if (onKeyUp) onKeyUp(e);
        }}
        className={`block w-full rounded-xl border-0 py-2.5 neo-form-input ${
          hasValue ? 'has-value' : ''
        } ${
          error ? 'neo-form-error' : ''
        } placeholder:text-stone-400 sm:text-sm sm:leading-6 text-stone-800 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          icon ? 'pl-10' : 'px-5'
        } ${className}`}
        placeholder={placeholder || " "}
        {...rest}
      />
      {error && <p className="mt-2 text-xs font-bold text-pink-500">{error.message || (typeof error === 'string' ? error : 'Invalid field')}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default React.memo(Input);
