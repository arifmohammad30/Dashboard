import React, { forwardRef } from 'react';

const Input = forwardRef(({ placeholder, icon, type = "text", error, ...rest }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-stone-400 sm:text-sm">{icon}</span>
      </div>
    )}
    <input
      type={type}
      className={`block w-full rounded-xl border-0 py-2.5 neo-form-input ${
        error ? 'neo-form-error' : ''
      } placeholder:text-stone-400 sm:text-sm sm:leading-6 text-stone-800 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        icon ? 'pl-10' : 'px-5'
      }`}
      placeholder={placeholder || " "}
      ref={ref}
      {...rest}
    />
    {error && <p className="mt-2 text-xs font-bold text-pink-500">{error.message || (typeof error === 'string' ? error : 'Invalid field')}</p>}
  </div>
));

Input.displayName = 'Input';

export default React.memo(Input);
