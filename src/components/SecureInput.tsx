import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { validateAndSanitizeInput } from '@/utils/inputSanitizer';
import { cn } from '@/lib/utils';

interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  validationType: 'email' | 'phone' | 'name' | 'amount' | 'text';
  onValidatedChange: (value: string, isValid: boolean) => void;
  showValidation?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  validationType,
  onValidatedChange,
  showValidation = true,
  className,
  ...props
}) => {
  const [error, setError] = useState<string | undefined>();
  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const result = validateAndSanitizeInput(value, validationType);
    
    setError(result.error);
    setIsValid(result.isValid);
    
    onValidatedChange(result.sanitized, result.isValid);
  }, [validationType, onValidatedChange]);

  return (
    <div className="space-y-1">
      <Input
        {...props}
        onChange={handleChange}
        className={cn(
          className,
          !isValid && showValidation && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {error && showValidation && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};