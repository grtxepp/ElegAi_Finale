import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password input with an accessible show/hide toggle.
 * Drop-in replacement for a normal <input className="input" />.
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  className = 'input',
  ...rest
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`${className} pr-11`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light transition hover:text-charcoal"
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
