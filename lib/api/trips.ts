import { AxiosError } from "axios";
import AxiosClient from "./client";
import { ApiError, ValidationError } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";
const tripsClient = new AxiosClient(API_BASE_URL);

export interface Trip {
  id: number;
  trip_number: string;
  status: string;
  estimated_start_time?: string;
  estimated_end_time?: string;
  // Optional extra fields often present in responses
  pickup_location?: string;
  dropoff_location?: string;
  current_location?: string;
  start_time?: string;
  end_time?: string;
  // Coordinates (optional)
  current_lat?: number | null;
  current_lng?: number | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
}

export interface CreateTripResponse {
  status_code: number;
  trip: Trip;
  error?: string;
}

export interface CreateTripDto {
  pickup_location: string;
  dropoff_location: string;
  current_location: string;
  current_cycle_used_hours: number;
  driver_id: number | string;
  // Optional fields supported by form/backend
  truck_id?: string;
  current_lat?: number;
  current_lng?: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
}

export interface TripResponse {
  status_code: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: Trip[];
  error?: string;
}

export const tripService = {
  fetchTripsForDriver: async (driverId: number): Promise<TripResponse> => {
    try {
      const response = await tripsClient
        .getInstance()
        .get(`/api/trips/?driver=${driverId}`);
      return {
        ...response.data,
        status_code: response.status,
      };
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      throw new Error("Failed to fetch trips.");
    }
  },

  createTrip: async (data: CreateTripDto): Promise<CreateTripResponse> => {
    try {
      const response = await tripsClient
        .getInstance()
        .post("/api/trip-planning/", data, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      return {
        ...response.data,
        status_code: response.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        const validationError = new Error(
          "Validation failed",
        ) as ValidationError;
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

      throw new Error("Trip creation failed");
    }
  },
  getTripById: async (id: number): Promise<Trip> => {
    try {
      const response = await tripsClient.getInstance().get(`/api/trips/${id}/`);
      return response.data as Trip;
    } catch (error) {
      console.error("Failed to fetch trip details:", error);
      throw new Error("Failed to fetch trip details.");
    }
  },
};
