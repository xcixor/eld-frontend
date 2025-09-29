import AxiosClient from "./client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";
const vehiclesClient = new AxiosClient(API_BASE_URL);

export interface Vehicle {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  vehicle_number: string;
  state: string;
  driver_id: number;
}

export interface VehiclesResponse {
    status_code: number;
    count: number;
    next: string | null;
    previous: string | null;
    results: Vehicle[];
    error?: string;
}


export const vehiclesService = {
  getVehicles: async (): Promise<VehiclesResponse> => {
    try {
      const response = await vehiclesClient.getInstance().get(
        `/api/vehicles/`
      );
       return {
        ...response.data,
        status_code: response.status,
      };
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      throw new Error("Failed to fetch vehicles.");
    }
  },
}