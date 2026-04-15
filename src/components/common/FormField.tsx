import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/** Single source of truth for input/select/textarea chrome across the app.
 *  Changing focus-ring colour, radius, disabled state, etc. happens here —
 *  every form field picks up the change without touching the call sites. */

const INPUT_BASE =
  'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ' +
  'disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed';

const LABEL = 'block text-sm font-medium text-gray-700 mb-1';
const HINT = 'text-xs text-gray-500 mt-1.5';
const ERROR = 'text-xs text-red-600 mt-1.5';

interface FieldExtras {
  /** Label above the control. Omit for fieldless inputs. */
  label?: ReactNode;
  /** Small hint shown below when there is no error. */
  hint?: ReactNode;
  /** Error text shown below; also shifts the border to red. */
  error?: ReactNode;
  /** Adds a trailing asterisk to the label. */
  required?: boolean;
  /** Class applied to the outer wrapper div (not the control). */
  wrapperClassName?: string;
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & FieldExtras;
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldExtras;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras;

function errorBorder(error: ReactNode | undefined): string {
  return error ? ' !border-red-400 focus:!ring-red-400' : '';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, hint, error, required, wrapperClassName, className, ...rest }, ref) => (
    <div className={wrapperClassName}>
      {label && (
        <label className={LABEL}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <input
        ref={ref}
        className={`${INPUT_BASE}${errorBorder(error)} ${className ?? ''}`}
        {...rest}
      />
      {error && <p className={ERROR}>{error}</p>}
      {!error && hint && <p className={HINT}>{hint}</p>}
    </div>
  ),
);
TextInput.displayName = 'TextInput';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, wrapperClassName, className, children, ...rest }, ref) => (
    <div className={wrapperClassName}>
      {label && (
        <label className={LABEL}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <select
        ref={ref}
        className={`${INPUT_BASE}${errorBorder(error)} ${className ?? ''}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className={ERROR}>{error}</p>}
      {!error && hint && <p className={HINT}>{hint}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, wrapperClassName, className, ...rest }, ref) => (
    <div className={wrapperClassName}>
      {label && (
        <label className={LABEL}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <textarea
        ref={ref}
        className={`${INPUT_BASE}${errorBorder(error)} ${className ?? ''}`}
        {...rest}
      />
      {error && <p className={ERROR}>{error}</p>}
      {!error && hint && <p className={HINT}>{hint}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';
