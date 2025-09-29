import AxiosClient from "./client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://127.0.0.1:8000";
const eldClient = new AxiosClient(API_BASE_URL);

export interface DutyPeriod {
  status: string;
  start_time: string;
  end_time: string;
  location: string;
}

export interface LogSheet {
  id: number;
  date: string;
  duty_periods: DutyPeriod[];
  notes: string;
  driver_id: number;
  trip_id: number;
}

export async function fetchLogSheets(tripId: number): Promise<LogSheet[]> {
  const res = await eldClient
    .getInstance()
    .get(`/api/trips/${tripId}/eld_logs/`);
  return res.data.map((sheet: any) => ({
    id: sheet.id,
    date: sheet.date,
    duty_periods: sheet.duty_periods || [],
    notes: sheet.violation_notes || "",
    driver_id: sheet.driver_id ?? (sheet.driver && sheet.driver.id),
    trip_id: sheet.trip_id ?? (sheet.trip && sheet.trip.id),
  }));
}

export async function createLogSheet(
  tripId: number,
  data: Partial<LogSheet>,
): Promise<LogSheet> {
  const res = await eldClient.getInstance().post(`/api/eld-logs/`, {
    ...data,
    trip_id: tripId,
  });
  return res.data;
}

export async function updateLogSheet(
  logSheetId: number,
  data: Partial<LogSheet>,
): Promise<LogSheet> {
  const res = await eldClient
    .getInstance()
    .put(`/api/eld-logs/${logSheetId}/`, {
      ...data,
      driver_id: data.driver_id,
      trip_id: data.trip_id,
    });
  return res.data;
}
