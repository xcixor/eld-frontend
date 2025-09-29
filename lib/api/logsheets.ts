import { AxiosError } from "axios";
import { ApiError, ValidationError } from "@/types/api";
import AxiosClient from "./client";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";
const logsheetsClient = new AxiosClient(API_BASE_URL);

export interface LogSheetCreateDto {
  date: string;
  total_off_duty_time: number;
  total_sleeper_berth_time: number;
  total_driving_time: number;
  total_on_duty_time: number;
  total_duty_time: number;
  miles_driven: number;
  hos_violation: boolean;
  violation_notes?: string;
  driver_id: number;
  trip_id: number;
}

export interface LogSheetMinimalCreateDto {
  date: string;
  driver_id: number;
  trip_id: number;
}

export const logsheetsService = {
  getOne: async (logSheetId: number): Promise<LogSheet> => {
    const response = await logsheetsClient.getInstance().get(`/api/eld-logs/${logSheetId}/`);
    return response.data as LogSheet;
  },
  createBasic: async (data: LogSheetMinimalCreateDto): Promise<LogSheet> => {
    const response = await logsheetsClient.getInstance().post(`/api/eld-logs/`, data);
    return response.data;
  },
  create: async (tripId: number, data: LogSheetCreateDto): Promise<LogSheet> => {
    try {
      const response = await logsheetsClient.getInstance().post(`/api/eld-logs/`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        const validationError = new Error("Validation failed") as ValidationError;
        validationError.fieldErrors = {};
        validationError.nonFieldErrors = [];
        const serverErrors = axiosError.response.data;
        Object.keys(serverErrors).forEach((field) => {
          const fieldError = serverErrors[field];
          if (field === "non_field_errors") {
            if (Array.isArray(fieldError)) {
              validationError.nonFieldErrors = fieldError;
            } else if (typeof fieldError === "string") {
              validationError.nonFieldErrors = [fieldError];
            }
          } else {
            if (Array.isArray(fieldError)) {
              validationError.fieldErrors![field] = fieldError;
            } else if (typeof fieldError === "string") {
              validationError.fieldErrors![field] = [fieldError];
            }
          }
        });
        throw validationError;
      }
      throw new Error("Log sheet creation failed");
    }
  },
  update: async (logSheetId: number, data: Partial<LogSheetCreateDto> & { trip_id: number }): Promise<LogSheet> => {
    try {
      const response = await logsheetsClient.getInstance().put(`/api/eld-logs/${logSheetId}/`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        const validationError = new Error("Validation failed") as ValidationError;
        validationError.fieldErrors = {};
        validationError.nonFieldErrors = [];
        const serverErrors = axiosError.response.data;
        Object.keys(serverErrors).forEach((field) => {
          const fieldError = serverErrors[field];
          if (field === "non_field_errors") {
            if (Array.isArray(fieldError)) {
              validationError.nonFieldErrors = fieldError;
            } else if (typeof fieldError === "string") {
              validationError.nonFieldErrors = [fieldError];
            }
          } else {
            if (Array.isArray(fieldError)) {
              validationError.fieldErrors![field] = fieldError;
            } else if (typeof fieldError === "string") {
              validationError.fieldErrors![field] = [fieldError];
            }
          }
        });
        throw validationError;
      }
      throw new Error("Log sheet update failed");
    }
  },
};




export interface LogSheet {
  id: number;
  date: string;
  total_off_duty_time: number;
  total_sleeper_berth_time: number;
  total_driving_time: number;
  total_on_duty_time: number;
  total_duty_time: number;
  miles_driven: number;
  hos_violation: boolean;
  violation_notes?: string;
  driver_id: number;
  trip_id: number;
}


type LogSheetResponse = {
  id: number;
  date: string;
  total_off_duty_time?: number | string;
  total_sleeper_berth_time?: number | string;
  total_driving_time?: number | string;
  total_on_duty_time?: number | string;
  total_duty_time?: number | string;
  miles_driven?: number | string;
  hos_violation?: boolean;
  violation_notes?: string;
  driver_id?: number;
  trip_id?: number;
  driver?: { id: number } | null;
  trip?: { id: number } | null;
};

export async function getLogSheetsForTrip(tripId: string): Promise<LogSheet[]> {
  const response = await logsheetsClient
    .getInstance()
    .get<LogSheetResponse[]>(`/api/trips/${tripId}/eld_logs/`);
  return response.data.map((sheet): LogSheet => ({
    id: Number(sheet.id),
    date: String(sheet.date),
    total_off_duty_time: Number(sheet.total_off_duty_time ?? 0),
    total_sleeper_berth_time: Number(sheet.total_sleeper_berth_time ?? 0),
    total_driving_time: Number(sheet.total_driving_time ?? 0),
    total_on_duty_time: Number(sheet.total_on_duty_time ?? 0),
    total_duty_time: Number(sheet.total_duty_time ?? 0),
    miles_driven: Number(sheet.miles_driven ?? 0),
    hos_violation: Boolean(sheet.hos_violation ?? false),
    violation_notes: sheet.violation_notes ?? '',
    driver_id: sheet.driver_id ?? sheet.driver?.id ?? 0,
    trip_id: sheet.trip_id ?? sheet.trip?.id ?? 0,
  }));
}
