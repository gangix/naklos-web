import {
  forwardRef,
  useId,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Paperclip, Upload } from 'lucide-react';

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

// ============================================================================
// Checkbox
// ============================================================================

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Label rendered to the right of the box. ReactNode so callers can embed
   *  links / formatted text. */
  label: ReactNode;
  /** Sub-text shown below the label. */
  description?: ReactNode;
  /** Triggered with the new boolean state. */
  onChange?: (checked: boolean) => void;
  /** 'start' = align checkbox to top of label (use for multi-line legal text);
   *  'center' = vertically centred (default). */
  align?: 'start' | 'center';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, onChange, align = 'center', ...rest }, ref) => (
    <label className={`flex ${align === 'start' ? 'items-start' : 'items-center'} gap-3 cursor-pointer`}>
      <input
        ref={ref}
        type="checkbox"
        onChange={(e) => onChange?.(e.target.checked)}
        className={
          'mt-0.5 w-5 h-5 text-primary-600 border-gray-300 rounded ' +
          'focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer ' +
          'disabled:opacity-50 disabled:cursor-not-allowed ' +
          (className ?? '')
        }
        {...rest}
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-gray-700 leading-relaxed">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </span>
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';

// ============================================================================
// FileInput
// ============================================================================

interface FileInputProps extends FieldExtras {
  /** Triggered with the selected File (or null when cleared). */
  onChange: (file: File | null) => void;
  /** Forwarded to the native input — e.g. ".xlsx,.xls" or "image/*". */
  accept?: string;
  /** Forwarded to the native input. */
  disabled?: boolean;
  /** Forwarded to the native input — multiple file selection. */
  multiple?: boolean;
  /** Label on the picker button. Falls back to a generic 'Choose file' label. */
  buttonLabel?: ReactNode;
  /** Currently-selected file's name to display next to the button. Pass null
   *  to hide. Caller owns the source of truth. */
  selectedFileName?: string | null;
}

/** Hidden native file input + styled trigger button. Solves the problem
 *  that browsers render `<input type="file">` chrome differently and
 *  ignore most CSS — we replace the native control with a Tailwind button
 *  while keeping accessibility (label still triggers the input). */
export function FileInput({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  onChange,
  accept,
  disabled,
  multiple,
  buttonLabel,
  selectedFileName,
}: FileInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  }

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={inputId} className={LABEL}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={
            'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ' +
            'bg-white border border-gray-300 rounded-lg transition-colors ' +
            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ' +
            'disabled:opacity-60 disabled:cursor-not-allowed'
          }
        >
          <Upload className="w-4 h-4" strokeWidth={2} />
          {buttonLabel ?? 'Dosya Seç'}
        </button>
        {selectedFileName && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="truncate">{selectedFileName}</span>
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className={ERROR}>{error}</p>}
      {!error && hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

// ============================================================================
// Textarea
// ============================================================================

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
