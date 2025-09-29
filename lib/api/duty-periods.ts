import AxiosClient from "./client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";
const dutyClient = new AxiosClient(API_BASE_URL);

export type DutyStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty";

export interface DutyPeriodDto {
  log_sheet_id: number;
  duty_status: DutyStatus;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
  state: string;
  activity_description: string;
  vehicle_moved: boolean;
  grid_start_minute: number; // 0-1439
  grid_end_minute: number; // 0-1439
}

export interface DutyPeriod extends Omit<DutyPeriodDto, "log_sheet_id"> {
  id: number;
  duration_minutes: number;
}

export interface DutyResponse {
    status_code: number;
    count: number;
    next: string | null;
    previous: string | null;
    results: DutyPeriod[];
    error?: string;
}

export const dutyPeriodsService = {
  listByLogSheet: async (logSheetId: number): Promise<DutyResponse> => {
    const res = await dutyClient
      .getInstance()
      .get(`/api/duty-periods/?log_sheet=${logSheetId}`);
    return {
        ...res.data,
        status_code: res.status,
      };
  },
  create: async (data: DutyPeriodDto): Promise<DutyPeriod> => {
    const res = await dutyClient.getInstance().post(`/api/duty-periods/`, data);
    return res.data as DutyPeriod;
  },
  update: async (
    id: number,
    data: Partial<DutyPeriodDto>,
  ): Promise<DutyPeriod> => {
    const res = await dutyClient.getInstance().patch(`/api/duty-periods/${id}/`, data);
    return res.data as DutyPeriod;
  },
  remove: async (id: number): Promise<void> => {
    await dutyClient.getInstance().delete(`/api/duty-periods/${id}/`);
  },
};
