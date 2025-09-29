export interface ApiError {
  non_field_errors?: string[];
  [key: string]: string[] | string | unknown;
}

export interface ValidationError extends Error {
  fieldErrors?: Record<string, string[]>;
  nonFieldErrors?: string[];
}
