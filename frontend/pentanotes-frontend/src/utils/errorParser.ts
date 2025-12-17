/**
 * Parses API error messages into a user-friendly format
 */
export const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message;
    
    // Try to parse JSON error messages
    try {
      const parsed = JSON.parse(message);
      
      // Handle DRF validation errors
      if (typeof parsed === 'object') {
        const errors: string[] = [];
        
        // Check for non_field_errors (general errors)
        if (parsed.non_field_errors && Array.isArray(parsed.non_field_errors)) {
          errors.push(...parsed.non_field_errors);
        }
        
        // Check for field-specific errors
        Object.keys(parsed).forEach((key) => {
          if (key !== 'non_field_errors' && Array.isArray(parsed[key])) {
            const fieldErrors = parsed[key].map((err: string) => 
              `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${err}`
            );
            errors.push(...fieldErrors);
          }
        });
        
        if (errors.length > 0) {
          return errors.join('\n');
        }
        
        // Check for detail field (common in DRF)
        if (parsed.detail) {
          return parsed.detail;
        }
        
        // If we couldn't parse it, return the stringified version
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      // Not JSON, return the error message as-is
    }
    
    return message;
  }
  
  return 'An unexpected error occurred';
};

export function parseApiError(error: any): string {
  if (error?.message) return error.message;
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => e.message).join(', ');
  }
  return 'An unexpected error occurred';
}




