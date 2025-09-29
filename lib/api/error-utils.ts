import { AxiosError } from "axios";
import { ValidationError } from "@/types/api";

export type SimpleErrorPayload = { status_code?: number; error: string };
export type DRFErrorPayload = Record<string, string[] | string>;

const hasSimpleError = (p: unknown): p is SimpleErrorPayload => {
  return (
    !!p &&
    typeof p === "object" &&
    "error" in (p as Record<string, unknown>) &&
    typeof (p as { error: unknown }).error === "string"
  );
};


export function parseValidationErrorFromAxiosError(
  err: AxiosError,
): ValidationError {
  const v = new Error("Validation failed") as ValidationError;
  v.fieldErrors = {};
  v.nonFieldErrors = [];

  const data = err.response?.data as unknown;

  if (hasSimpleError(data)) {
    v.nonFieldErrors = [data.error];
    return v;
  }

  if (data && typeof data === "object") {
    const dict = data as DRFErrorPayload;
    Object.keys(dict).forEach((field) => {
      const fieldError = dict[field];
      if (field === "non_field_errors") {
        if (Array.isArray(fieldError)) {
          v.nonFieldErrors = fieldError as string[];
        } else if (typeof fieldError === "string") {
          v.nonFieldErrors = [fieldError];
        }
      } else {
        if (Array.isArray(fieldError)) {
          v.fieldErrors![field] = fieldError as string[];
        } else if (typeof fieldError === "string") {
          v.fieldErrors![field] = [fieldError];
        }
      }
    });
  }

  return v;
}
