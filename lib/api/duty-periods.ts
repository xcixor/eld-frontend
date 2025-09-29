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
  grid_start_minute: number;
  grid_end_minute: number;
  start_latitude?: number | null;
  start_longitude?: number | null;
  end_latitude?: number | null;
  end_longitude?: number | null;
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
    const payload = sanitizeDutyPeriodPayload(data);
    try {
      const res = await dutyClient.getInstance().post(`/api/duty-periods/`, payload);
      return res.data as DutyPeriod;
    } catch (err: unknown) {
      const detail = extractAxiosErrorDetail(err);
      console.error("DutyPeriod.create failed:", detail);
      throw err;
    }
  },
  update: async (
    id: number,
    data: Partial<DutyPeriodDto>,
  ): Promise<DutyPeriod> => {
    const payload = sanitizeDutyPeriodPayload(data as DutyPeriodDto, true);
    try {
      const res = await dutyClient.getInstance().patch(`/api/duty-periods/${id}/`, payload);
      return res.data as DutyPeriod;
    } catch (err: unknown) {
      const detail = extractAxiosErrorDetail(err);
      console.error("DutyPeriod.update failed:", detail);
      throw err;
    }
  },
  remove: async (id: number): Promise<void> => {
    await dutyClient.getInstance().delete(`/api/duty-periods/${id}/`);
  },
};

function round6(n: unknown): number | null {
  if (n === undefined || n === null) return null;
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 1e6) / 1e6;
}

function sanitizeDutyPeriodPayload<T extends DutyPeriodDto>(data: Partial<T>, isPartial = false): Partial<T> {
  const out: Partial<T> = { ...data };
  const record = out as Record<string, unknown>;
  // Round coords to 6 dp and remove if null
  const keys: Array<keyof DutyPeriodDto> = [
    "start_latitude",
    "start_longitude",
    "end_latitude",
    "end_longitude",
  ];
  for (const k of keys) {
    if (k in record) {
      const v = round6(record[k as string]);
      if (v === null) {
        if (isPartial) delete record[k as string];
        else record[k as string] = null;
      } else {
        record[k as string] = v;
      }
    }
  }
  // Ensure grid minutes are integers within range if present
  if ("grid_start_minute" in record && record.grid_start_minute != null) {
    const n = typeof record.grid_start_minute === "string" ? Number(record.grid_start_minute) : (record.grid_start_minute as number);
    record.grid_start_minute = Math.min(1439, Math.max(0, Math.round(n)));
  }
  if ("grid_end_minute" in record && record.grid_end_minute != null) {
    const n = typeof record.grid_end_minute === "string" ? Number(record.grid_end_minute) : (record.grid_end_minute as number);
    record.grid_end_minute = Math.min(1439, Math.max(0, Math.round(n)));
  }

  // Normalize end_time if equal or before start_time
  const sRaw = record["start_time"] as string | undefined;
  const eRaw = record["end_time"] as string | undefined;
  if (sRaw && eRaw) {
    const s = new Date(sRaw);
    const e = new Date(eRaw);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e <= s) {
      let delta = 15; // default 15 minutes
      const gs = record["grid_start_minute"] as number | undefined;
      const ge = record["grid_end_minute"] as number | undefined;
      if (typeof gs === "number" && typeof ge === "number" && ge > gs) {
        delta = ge - gs;
      }
      const newEnd = new Date(s.getTime() + delta * 60 * 1000);
      record["end_time"] = newEnd.toISOString();
    }
  }
  return out;
}

function extractAxiosErrorDetail(err: unknown): unknown {
  if (typeof err === "object" && err !== null) {
    const maybeAxios = err as { response?: { data?: unknown }; message?: string };
    if (maybeAxios.response && "data" in maybeAxios.response) {
      return maybeAxios.response.data;
    }
    if (maybeAxios.message) return maybeAxios.message;
  }
  return String(err);
}
