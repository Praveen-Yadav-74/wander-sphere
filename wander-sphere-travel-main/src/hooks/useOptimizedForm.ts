import { useState, useCallback, useRef, useEffect } from 'react';

type FormValues = Record<string, any>;
type FormErrors = Record<string, string>;
type ValidationRules = Record<string, (value: any, formValues: FormValues) => string | null>;

interface UseOptimizedFormOptions {
  initialValues: FormValues;
  validationRules?: ValidationRules;
  onSubmit?: (values: FormValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseOptimizedFormResult {
  values: FormValues;
  errors: FormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFieldValue: (field: string, value: any) => void;
  resetForm: () => void;
}

/**
 * Custom hook for optimizing form handling with validation and performance optimizations
 * @param options Form configuration options
 * @returns Form state and handlers
 */
export function useOptimizedForm(options: UseOptimizedFormOptions): UseOptimizedFormResult {
  const {
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use refs to avoid unnecessary re-renders
  const valuesRef = useRef(values);
  const errorsRef = useRef(errors);
  const touchedRef = useRef(touched);
  
  // Update refs when state changes
  useEffect(() => {
    valuesRef.current = values;
    errorsRef.current = errors;
    touchedRef.current = touched;
  }, [values, errors, touched]);

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const validator = validationRules[name];
      return validator ? validator(value, valuesRef.current) : null;
    },
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    
    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, valuesRef.current[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    return newErrors;
  }, [validateField, validationRules]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      
      setValues((prevValues) => ({
        ...prevValues,
        [name]: newValue,
      }));
      
      if (validateOnChange && touchedRef.current[name]) {
        const error = validateField(name, newValue);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: error || '',
        }));
      }
    },
    [validateField, validateOnChange]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
      
      if (validateOnBlur) {
        const error = validateField(name, valuesRef.current[name]);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: error || '',
        }));
      }
    },
    [validateField, validateOnBlur]
  );

  // Set field value programmatically
  const setFieldValue = useCallback((field: string, value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [field]: value,
    }));
    
    if (validateOnChange && touchedRef.current[field]) {
      const error = validateField(field, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: error || '',
      }));
    }
  }, [validateField, validateOnChange]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(valuesRef.current).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);
      
      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);
      
      // If there are no errors and onSubmit is provided, call it
      if (Object.keys(formErrors).length === 0 && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(valuesRef.current);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validateForm]
  );

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Calculate if the form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
  };
}