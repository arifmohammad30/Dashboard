import React, { forwardRef, useRef, useEffect } from 'react';

const Select = forwardRef(({ options, placeholder = "Select an option", error, onChange, onBlur, ...rest }, ref) => {
  const internalRef = useRef(null);

  const checkValue = (element) => {
    if (element && element.value && element.value !== "") {
      element.classList.add('has-value');
    } else if (element) {
      element.classList.remove('has-value');
    }
  };

  useEffect(() => {
    checkValue(internalRef.current);
  }, []);

  const handleChange = (e) => {
    checkValue(e.target);
    if (onChange) onChange(e);
  };

  const handleBlur = (e) => {
    checkValue(e.target);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative">
      <select
        className={`block w-full rounded-xl border-0 py-2.5 pl-5 pr-12 text-stone-800 neo-form-input ${
          error ? 'neo-form-error' : ''
        } sm:text-sm sm:leading-6 outline-none cursor-pointer appearance-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
        ref={(e) => {
          internalRef.current = e;
          if (typeof ref === 'function') ref(e);
          else if (ref) ref.current = e;
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        {...rest}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="mt-2 text-xs font-bold text-pink-500 relative">{error.message || (typeof error === 'string' ? error : 'Invalid field')}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default React.memo(Select);
