"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  dutyPeriodsService,
  DutyPeriod,
  DutyPeriodDto,
} from "@/lib/api/duty-periods";
import { logsheetsService } from "@/lib/api/logsheets";
import CustomFormField, { FormFieldType } from "@/components/CustomFormField";
import PeriodCoordinatePicker from "./PeriodCoordinatePicker";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import FmcsaGrid from "./FmcsaGrid";
import TripMap from "@/components/map/TripMap";

const SummaryValidation = z.object({
  total_off_duty_time: z.string(),
  total_sleeper_berth_time: z.string(),
  total_driving_time: z.string(),
  total_on_duty_time: z.string(),
  total_duty_time: z.string(),
  miles_driven: z.string(),
  hos_violation: z.boolean(),
  violation_notes: z.string().optional(),
});

export function ManageLogSheet({
  tripId,
  logSheetId,
}: {
  tripId: number;
  logSheetId: number;
}) {
  const router = useRouter();
  const [periods, setPeriods] = useState<DutyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<{
    total_off_duty_time: string;
    total_sleeper_berth_time: string;
    total_driving_time: string;
    total_on_duty_time: string;
    total_duty_time: string;
    hos_violation: boolean;
    violation_note?: string;
  } | null>(null);

  const form = useForm<z.infer<typeof SummaryValidation>>({
    resolver: zodResolver(SummaryValidation),
    defaultValues: {
      total_off_duty_time: "0",
      total_sleeper_berth_time: "0",
      total_driving_time: "0",
      total_on_duty_time: "0",
      total_duty_time: "0",
      miles_driven: "0",
      hos_violation: false,
      violation_notes: "",
    },
  });
  // Stable function that always operates on the provided list to avoid effect loops
  const recalcFrom = useCallback((list: DutyPeriod[]) => {
    const minutesByStatus: Record<string, number> = {
      off_duty: 0,
      sleeper_berth: 0,
      driving: 0,
      on_duty: 0,
    };

    if (!list || list.length === 0) {
      setPendingSummary({
        total_off_duty_time: "0",
        total_sleeper_berth_time: "0",
        total_driving_time: "0",
        total_on_duty_time: "0",
        total_duty_time: "0",
        hos_violation: false,
      });
      toast.info("No duty periods yet. Totals reset to 0.");
      return;
    }

    list.forEach((p) => {
      minutesByStatus[p.duty_status] += p.duration_minutes;
    });

    const toHoursStr = (m: number) => (m / 60).toFixed(2);
    const drivingHrs = minutesByStatus.driving / 60;
    const onDutyHrs = (minutesByStatus.driving + minutesByStatus.on_duty) / 60;

    const hasHosViolation = drivingHrs > 11 || onDutyHrs > 14;
    const violation_note = hasHosViolation
      ? `Auto-flagged HOS violation: driving=${drivingHrs.toFixed(2)}h, duty=${onDutyHrs.toFixed(2)}h`
      : undefined;

    setPendingSummary({
      total_off_duty_time: toHoursStr(minutesByStatus.off_duty),
      total_sleeper_berth_time: toHoursStr(minutesByStatus.sleeper_berth),
      total_driving_time: toHoursStr(minutesByStatus.driving),
      total_on_duty_time: toHoursStr(minutesByStatus.on_duty),
      total_duty_time: toHoursStr(
        minutesByStatus.driving + minutesByStatus.on_duty,
      ),
      hos_violation: hasHosViolation,
      violation_note,
    });

    if (hasHosViolation) {
      toast.warning("HOS violation detected from periods.");
    } else {
      toast.success("Summary recalculated from periods.");
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [periodList] = await Promise.all([
          dutyPeriodsService.listByLogSheet(logSheetId),
        ]);
        setPeriods(periodList.results);
        setError(null);
        recalcFrom(periodList.results);
      } catch {
        setError("Failed to load log sheet details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [logSheetId, recalcFrom]);

  const addPeriod = async (data: Omit<DutyPeriodDto, "log_sheet_id">) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
    const toGrid = (m: number) => {
      const rounded = Math.round(m / 15) * 15;
      return Math.min(1439, Math.max(0, rounded));
    };

    if (sameDay) {
      const payload: DutyPeriodDto = { log_sheet_id: logSheetId, ...data };
      const created = await dutyPeriodsService.create(payload);
      setPeriods((prev) => {
        const next = [...prev, created];
        recalcFrom(next);
        return next;
      });
      return;
    }

    const endOfStartDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      23,
      59,
      0,
      0,
    );
    const startOfEndDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      0,
      0,
      0,
      0,
    );

    const first: DutyPeriodDto = {
      ...data,
      log_sheet_id: logSheetId,
      start_time: start.toISOString(),
      end_time: endOfStartDay.toISOString(),
      grid_start_minute: toGrid(minuteOfDay(start)),
      grid_end_minute: 1439,
    };
    const second: DutyPeriodDto = {
      ...data,
      log_sheet_id: logSheetId,
      start_time: startOfEndDay.toISOString(),
      end_time: end.toISOString(),
      grid_start_minute: 0,
      grid_end_minute: toGrid(minuteOfDay(end)),
    };

    const created1 = await dutyPeriodsService.create(first);
    const created2 = await dutyPeriodsService.create(second);
    setPeriods((prev) => {
      const next = [...prev, created1, created2];
      recalcFrom(next);
      return next;
    });
    toast.info("Period crossed midnight and was split into two entries.");
  };

  useEffect(() => {
    if (!pendingSummary) return;
    form.setValue("total_off_duty_time", pendingSummary.total_off_duty_time, {
      shouldDirty: true,
    });
    form.setValue(
      "total_sleeper_berth_time",
      pendingSummary.total_sleeper_berth_time,
      { shouldDirty: true },
    );
    form.setValue("total_driving_time", pendingSummary.total_driving_time, {
      shouldDirty: true,
    });
    form.setValue("total_on_duty_time", pendingSummary.total_on_duty_time, {
      shouldDirty: true,
    });
    form.setValue("total_duty_time", pendingSummary.total_duty_time, {
      shouldDirty: true,
    });
    form.setValue("hos_violation", pendingSummary.hos_violation, {
      shouldDirty: true,
    });
    if (pendingSummary.violation_note) {
      const current = form.getValues("violation_notes") ?? "";
      if (!current) {
        form.setValue("violation_notes", pendingSummary.violation_note, {
          shouldDirty: true,
        });
      }
    }
    setPendingSummary(null);
  }, [pendingSummary, form]);

  const saveSummary = async (values: z.infer<typeof SummaryValidation>) => {
    await logsheetsService.update(logSheetId, {
      trip_id: tripId,
      total_off_duty_time: parseFloat(values.total_off_duty_time),
      total_sleeper_berth_time: parseFloat(values.total_sleeper_berth_time),
      total_driving_time: parseFloat(values.total_driving_time),
      total_on_duty_time: parseFloat(values.total_on_duty_time),
      total_duty_time: parseFloat(values.total_duty_time),
      miles_driven: parseInt(values.miles_driven, 10),
      hos_violation: values.hos_violation,
      violation_notes: values.violation_notes,
    });
    router.refresh();
  };

  const handleResize = async (
    id: number | string,
    startMinute: number,
    endMinute: number,
  ) => {
    const target =
      periods.find((p) => p.id === id) ||
      periods.find(
        (p) =>
          p.grid_start_minute === startMinute ||
          p.grid_end_minute === endMinute,
      );
    if (!target) return;
    try {
      const startDate = new Date(target.start_time);
      const endDate = new Date(target.end_time);

      const makeDateFromMinute = (base: Date, minute: number) => {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        const h = Math.floor(minute / 60);
        const m = minute % 60;
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };

      const newStartIso = makeDateFromMinute(startDate, startMinute);
      const newEndIso = makeDateFromMinute(endDate, endMinute);

      const updated = await dutyPeriodsService.update(target.id, {
        grid_start_minute: startMinute,
        grid_end_minute: endMinute,
        start_time: newStartIso,
        end_time: newEndIso,
      });
      setPeriods((prev) => {
        const next = prev.map((p) =>
          p.id === updated.id ? { ...p, ...updated } : p,
        );
        recalcFrom(next);
        return next;
      });
      toast.success("Updated period on grid");
    } catch {
      toast.error("Failed to update period");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Log Sheet</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => recalcFrom(periods)}
            disabled={periods.length === 0}
          >
            Recalculate from Periods
          </Button>
          <Button onClick={form.handleSubmit(saveSummary)}>Save Summary</Button>
        </div>
      </div>

      <section className="lg:col-span-2">
        <h3 className="mb-2 text-lg font-semibold">Your Daily Log</h3>
        <div className="mb-2 text-xs text-gray-600">
          <strong>Tip:</strong> The grid below is interactive. Drag the ends of
          a segment to adjust its time. Hover for details.
        </div>
        <FmcsaGrid
          periods={periods.map((p) => ({
            id: p.id,
            duty_status: p.duty_status,
            grid_start_minute: p.grid_start_minute,
            grid_end_minute: p.grid_end_minute,
          }))}
          onResize={handleResize}
        />
        {/* Day-level route visualization (if coordinates exist) */}
        {periods.some(
          (p) =>
            p.start_latitude &&
            p.start_longitude &&
            p.end_latitude &&
            p.end_longitude,
        ) && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium">Day Route</h4>
            <TripMap
              route={periods
                .filter(
                  (p) =>
                    p.duty_status === "driving" &&
                    p.start_latitude &&
                    p.start_longitude &&
                    p.end_latitude &&
                    p.end_longitude,
                )
                .flatMap((p) => [
                  {
                    lat: Number(p.start_latitude),
                    lng: Number(p.start_longitude),
                  },
                  { lat: Number(p.end_latitude), lng: Number(p.end_longitude) },
                ])}
              stops={
                periods
                  .filter(
                    (p) =>
                      p.duty_status === "on_duty" ||
                      p.duty_status === "off_duty",
                  )
                  .map((p) => ({
                    position:
                      p.start_latitude && p.start_longitude
                        ? {
                            lat: Number(p.start_latitude),
                            lng: Number(p.start_longitude),
                          }
                        : undefined,
                    title: p.duty_status === "on_duty" ? "On Duty" : "Off Duty",
                    note: new Date(p.start_time).toLocaleTimeString(),
                  }))
                  .filter((s) => s.position !== undefined) as {
                  position: { lat: number; lng: number };
                  title: string;
                  note?: string;
                }[]
              }
              height={260}
            />
          </div>
        )}
      </section>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-lg font-semibold">Duty Periods</h3>

            <ul className="mb-4 divide-y rounded border">
              {periods.length > 0 &&
                periods?.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{p.duty_status}</div>
                      <div className="text-muted-foreground">
                        {new Date(p.start_time).toLocaleString()} →{" "}
                        {new Date(p.end_time).toLocaleString()} • {p.city},{" "}
                        {p.state}
                      </div>
                      <div className="text-muted-foreground">
                        {p.activity_description}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        dutyPeriodsService.remove(p.id).then(() =>
                          setPeriods((prev) => {
                            const next = prev.filter((x) => x.id !== p.id);
                            recalcFrom(next);
                            return next;
                          }),
                        )
                      }
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              {periods.length === 0 && (
                <li className="text-muted-foreground p-3 text-sm">
                  No periods yet.
                </li>
              )}
            </ul>

            <QuickAddDutyPeriod onAdd={addPeriod} />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-semibold">Summary</h3>
            <Form {...form}>
              <form className="grid grid-cols-2 gap-4">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="total_off_duty_time"
                  label="Off Duty (hrs)"
                  type="number"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="total_sleeper_berth_time"
                  label="Sleeper (hrs)"
                  type="number"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="total_driving_time"
                  label="Driving (hrs)"
                  type="number"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="total_on_duty_time"
                  label="On Duty (hrs)"
                  type="number"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="total_duty_time"
                  label="Duty Total (hrs)"
                  type="number"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="miles_driven"
                  label="Miles Driven"
                  type="number"
                />
                <div className="col-span-2">
                  <CustomFormField
                    fieldType={FormFieldType.CHECKBOX}
                    control={form.control}
                    name="hos_violation"
                    label="HOS Violation"
                  />
                </div>
                <div className="col-span-2">
                  <CustomFormField
                    fieldType={FormFieldType.TEXTAREA}
                    control={form.control}
                    name="violation_notes"
                    label="Notes"
                  />
                </div>
              </form>
            </Form>
          </section>
        </div>
      )}
    </div>
  );
}

function QuickAddDutyPeriod({
  onAdd,
}: {
  onAdd: (data: Omit<DutyPeriodDto, "log_sheet_id">) => Promise<void>;
}) {
  const schema = z.object({
    duty_status: z.enum(["off_duty", "sleeper_berth", "driving", "on_duty"]),
    start_time: z.date(),
    end_time: z.date(),
    location: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    activity_description: z.string().min(1),
    vehicle_moved: z.boolean(),
    start_latitude: z.coerce.number().optional(),
    start_longitude: z.coerce.number().optional(),
    end_latitude: z.coerce.number().optional(),
    end_longitude: z.coerce.number().optional(),
  });
  type QuickAddValues = z.infer<typeof schema>;
  const form = useForm<QuickAddValues>({
    resolver: zodResolver(schema) as unknown as Resolver<QuickAddValues>,
    defaultValues: {
      duty_status: "on_duty",
      start_time: new Date(),
      end_time: new Date(),
      location: "",
      city: "",
      state: "",
      activity_description: "",
      vehicle_moved: true,
      start_latitude: undefined,
      start_longitude: undefined,
      end_latitude: undefined,
      end_longitude: undefined,
    },
  });

  const submit = async (v: z.infer<typeof schema>) => {
    const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
    const toGrid = (m: number) => {
      const rounded = Math.round(m / 15) * 15;
      return Math.min(1439, Math.max(0, rounded));
    };
    const startMin = toGrid(minuteOfDay(v.start_time));
    const endMin = toGrid(minuteOfDay(v.end_time));

    await onAdd({
      duty_status: v.duty_status,
      start_time: v.start_time.toISOString(),
      end_time: v.end_time.toISOString(),
      location: v.location,
      city: v.city,
      state: v.state.toUpperCase(),
      activity_description: v.activity_description,
      vehicle_moved: v.vehicle_moved,
      grid_start_minute: startMin,
      grid_end_minute: endMin,
      start_latitude: Number.isFinite(v.start_latitude as number)
        ? (v.start_latitude as number)
        : undefined,
      start_longitude: Number.isFinite(v.start_longitude as number)
        ? (v.start_longitude as number)
        : undefined,
      end_latitude: Number.isFinite(v.end_latitude as number)
        ? (v.end_latitude as number)
        : undefined,
      end_longitude: Number.isFinite(v.end_longitude as number)
        ? (v.end_longitude as number)
        : undefined,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="grid grid-cols-2 gap-3"
      >
        <CustomFormField
          fieldType={FormFieldType.DATE_PICKER}
          control={form.control}
          name="start_time"
          label="Start"
          showTimeSelect
          dateFormat="MM/dd/yyyy h:mm aa"
        />
        <CustomFormField
          fieldType={FormFieldType.DATE_PICKER}
          control={form.control}
          name="end_time"
          label="End"
          showTimeSelect
          dateFormat="MM/dd/yyyy h:mm aa"
        />
        <CustomFormField
          fieldType={FormFieldType.SELECT}
          control={form.control}
          name="duty_status"
          label="Status"
        >
          <SelectItem value="off_duty">Off Duty</SelectItem>
          <SelectItem value="sleeper_berth">Sleeper Berth</SelectItem>
          <SelectItem value="driving">Driving</SelectItem>
          <SelectItem value="on_duty">On Duty</SelectItem>
        </CustomFormField>
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="city"
          label="City"
        />
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="state"
          label="State"
        />
        <div className="col-span-2">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="location"
            label="Location"
          />
        </div>
        <div className="col-span-2">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="activity_description"
            label="Activity / Remarks"
          />
        </div>
        <CustomFormField
          fieldType={FormFieldType.CHECKBOX}
          control={form.control}
          name="vehicle_moved"
          label="Vehicle Moved"
        />
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="start_latitude"
            label="Start Lat"
            type="number"
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="start_longitude"
            label="Start Lng"
            type="number"
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="end_latitude"
            label="End Lat"
            type="number"
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="end_longitude"
            label="End Lng"
            type="number"
          />
        </div>
        <div className="col-span-2">
          <PeriodCoordinatePicker
            start={(() => {
              const slat = form.getValues("start_latitude") as unknown;
              const slng = form.getValues("start_longitude") as unknown;
              const nlat =
                typeof slat === "number"
                  ? slat
                  : typeof slat === "string"
                    ? Number(slat)
                    : undefined;
              const nlng =
                typeof slng === "number"
                  ? slng
                  : typeof slng === "string"
                    ? Number(slng)
                    : undefined;
              return Number.isFinite(nlat as number) &&
                Number.isFinite(nlng as number)
                ? { lat: nlat as number, lng: nlng as number }
                : undefined;
            })()}
            end={(() => {
              const elat = form.getValues("end_latitude") as unknown;
              const elng = form.getValues("end_longitude") as unknown;
              const nlat =
                typeof elat === "number"
                  ? elat
                  : typeof elat === "string"
                    ? Number(elat)
                    : undefined;
              const nlng =
                typeof elng === "number"
                  ? elng
                  : typeof elng === "string"
                    ? Number(elng)
                    : undefined;
              return Number.isFinite(nlat as number) &&
                Number.isFinite(nlng as number)
                ? { lat: nlat as number, lng: nlng as number }
                : undefined;
            })()}
            onChangeStart={(p) => {
              form.setValue("start_latitude", p?.lat ?? undefined, {
                shouldDirty: true,
              });
              form.setValue("start_longitude", p?.lng ?? undefined, {
                shouldDirty: true,
              });
            }}
            onChangeEnd={(p) => {
              form.setValue("end_latitude", p?.lat ?? undefined, {
                shouldDirty: true,
              });
              form.setValue("end_longitude", p?.lng ?? undefined, {
                shouldDirty: true,
              });
            }}
          />
        </div>
        <div className="col-span-2">
          <Button type="submit">Add Period</Button>
        </div>
      </form>
    </Form>
  );
}

export default ManageLogSheet;
