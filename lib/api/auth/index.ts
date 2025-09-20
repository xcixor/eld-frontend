import AxiosClient from "../client";
import { AxiosError } from "axios";

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  username: string;
  driver_number: string;
  initials: string;
  home_operating_center: string;
  license_number: string;
  license_state: string;
}

export interface AuthResponse {
  status_code: number;
  // Registration response fields
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  // Login response fields
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  expires?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ApiError {
  // DRF validation error structure
  non_field_errors?: string[];
  [key: string]: string[] | string | unknown;
}

export interface ValidationError extends Error {
  fieldErrors?: Record<string, string[]>;
  nonFieldErrors?: string[];
}

// API Base URL for your Django backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";

const authClient = new AxiosClient(API_BASE_URL);

export const authService = {
  // Login user
  login: async (loginData: LoginDto): Promise<AuthResponse> => {
    try {
      const response = await authClient.getInstance().post(
        "/api/auth/login/",
        {
          username: loginData.username,
          password: loginData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error(
        "Login error:",
        axiosError.response?.data || axiosError.message,
      );

      if (axiosError.response?.data?.non_field_errors) {
        throw new Error(axiosError.response.data.non_field_errors[0]);
      }

      throw new Error("Login failed");
    }
  },

  register: async (registerData: RegisterDto): Promise<AuthResponse> => {
    try {
      const response = await authClient
        .getInstance()
        .post("/api/auth/register/", registerData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

      return {
        ...response.data,
        status_code: response.status
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        const validationError = new Error("Validation failed") as ValidationError;
        validationError.fieldErrors = {};
        validationError.nonFieldErrors = [];

        const serverErrors = axiosError.response.data;

        Object.keys(serverErrors).forEach((field) => {
          const fieldError = serverErrors[field];

          if (field === 'non_field_errors') {
            if (Array.isArray(fieldError)) {
              validationError.nonFieldErrors = fieldError;
            } else if (typeof fieldError === 'string') {
              validationError.nonFieldErrors = [fieldError];
            }
          } else {
            if (Array.isArray(fieldError)) {
              validationError.fieldErrors![field] = fieldError;
            } else if (typeof fieldError === 'string') {
              validationError.fieldErrors![field] = [fieldError];
            }
          }
        });

        throw validationError;
      }

      throw new Error("Registration failed");
    }
  },
};

export default authService;
