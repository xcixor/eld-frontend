"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { dutyPeriodsService, DutyPeriod, DutyPeriodDto } from "@/lib/api/duty-periods";
import { logsheetsService } from "@/lib/api/logsheets";
import CustomFormField, { FormFieldType } from "@/components/CustomFormField";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import FmcsaGrid from "./FmcsaGrid";

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

export function ManageLogSheet({ tripId, logSheetId }: { tripId: number; logSheetId: number }) {
  const router = useRouter();
  const [periods, setPeriods] = useState<DutyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<
    | {
        total_off_duty_time: string;
        total_sleeper_berth_time: string;
        total_driving_time: string;
        total_on_duty_time: string;
        total_duty_time: string;
        hos_violation: boolean;
        violation_note?: string;
      }
    | null
  >(null);

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
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [periodList] = await Promise.all([
          dutyPeriodsService.listByLogSheet(logSheetId),
        ]);
  setPeriods(periodList.results);
  setError(null);
  // Recalculate summary after loading periods
  recalcSummary(periodList.results);
      } catch {
        setError("Failed to load log sheet details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [logSheetId]);




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
        recalcSummary(next);
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
      recalcSummary(next);
      return next;
    });
    toast.info("Period crossed midnight and was split into two entries.");
  };

  const recalcSummary = (list?: DutyPeriod[]) => {
    const minutesByStatus: Record<string, number> = {
      off_duty: 0,
      sleeper_berth: 0,
      driving: 0,
      on_duty: 0,
    };

    const source = list ?? periods;

    if (!source || source.length === 0) {
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

    source.forEach((p) => {
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
      total_duty_time: toHoursStr(minutesByStatus.driving + minutesByStatus.on_duty),
      hos_violation: hasHosViolation,
      violation_note,
    });

    if (hasHosViolation) {
      toast.warning("HOS violation detected from periods.");
    } else {
      toast.success("Summary recalculated from periods.");
    }
  };

  useEffect(() => {
    if (!pendingSummary) return;
    form.setValue("total_off_duty_time", pendingSummary.total_off_duty_time, { shouldDirty: true });
    form.setValue("total_sleeper_berth_time", pendingSummary.total_sleeper_berth_time, { shouldDirty: true });
    form.setValue("total_driving_time", pendingSummary.total_driving_time, { shouldDirty: true });
    form.setValue("total_on_duty_time", pendingSummary.total_on_duty_time, { shouldDirty: true });
    form.setValue("total_duty_time", pendingSummary.total_duty_time, { shouldDirty: true });
    form.setValue("hos_violation", pendingSummary.hos_violation, { shouldDirty: true });
    if (pendingSummary.violation_note) {
      const current = form.getValues("violation_notes") ?? "";
      if (!current) {
        form.setValue("violation_notes", pendingSummary.violation_note, { shouldDirty: true });
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
    const target = periods.find((p) => p.id === id) ||
      periods.find((p) => p.grid_start_minute === startMinute || p.grid_end_minute === endMinute);
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
        const next = prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
        recalcSummary(next);
        return next;
      });
      toast.success("Updated period on grid");
    } catch {
      toast.error("Failed to update period");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Log Sheet</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => recalcSummary()} disabled={periods.length === 0}>Recalculate from Periods</Button>
          <Button onClick={form.handleSubmit(saveSummary)}>Save Summary</Button>
        </div>
      </div>

      <section className="lg:col-span-2">
        <h3 className="text-lg font-semibold mb-2">Your Daily Log</h3>
        <div className="mb-2 text-xs text-gray-600">
          <strong>Tip:</strong> The grid below is interactive. Drag the ends of a segment to adjust its time. Hover for details.
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
      </section>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-lg font-semibold mb-2">Duty Periods</h3>

            <ul className="mb-4 divide-y rounded border">
              {periods.length > 0 && periods?.map((p) => (
                <li key={p.id} className="p-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.duty_status}</div>
                    <div className="text-muted-foreground">
                      {new Date(p.start_time).toLocaleString()} → {new Date(p.end_time).toLocaleString()} • {p.city}, {p.state}
                    </div>
                    <div className="text-muted-foreground">{p.activity_description}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      dutyPeriodsService
                        .remove(p.id)
                        .then(() =>
                          setPeriods((prev) => {
                            const next = prev.filter((x) => x.id !== p.id);
                            recalcSummary(next);
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
                <li className="p-3 text-sm text-muted-foreground">No periods yet.</li>
              )}
            </ul>


            <QuickAddDutyPeriod onAdd={addPeriod} />
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <Form {...form}>
              <form className="grid grid-cols-2 gap-4">
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="total_off_duty_time" label="Off Duty (hrs)" type="number" />
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="total_sleeper_berth_time" label="Sleeper (hrs)" type="number" />
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="total_driving_time" label="Driving (hrs)" type="number" />
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="total_on_duty_time" label="On Duty (hrs)" type="number" />
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="total_duty_time" label="Duty Total (hrs)" type="number" />
                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="miles_driven" label="Miles Driven" type="number" />
                <div className="col-span-2">
                  <CustomFormField
                    fieldType={FormFieldType.CHECKBOX}
                    control={form.control}
                    name="hos_violation"
                    label="HOS Violation"
                  />
                </div>
                <div className="col-span-2">
                  <CustomFormField fieldType={FormFieldType.TEXTAREA} control={form.control} name="violation_notes" label="Notes" />
                </div>
              </form>
            </Form>
          </section>


        </div>
      )}
    </div>
  );
}

function QuickAddDutyPeriod({ onAdd }: { onAdd: (data: Omit<DutyPeriodDto, "log_sheet_id">) => Promise<void> }) {
  const schema = z.object({
    duty_status: z.enum(["off_duty", "sleeper_berth", "driving", "on_duty"]),
    start_time: z.date(),
    end_time: z.date(),
    location: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    activity_description: z.string().min(1),
    vehicle_moved: z.boolean(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      duty_status: "on_duty",
      start_time: new Date(),
      end_time: new Date(),
      location: "",
      city: "",
      state: "",
      activity_description: "",
      vehicle_moved: true,
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
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-2 gap-3">
  <CustomFormField fieldType={FormFieldType.DATE_PICKER} control={form.control} name="start_time" label="Start" showTimeSelect dateFormat="MM/dd/yyyy h:mm aa" />
  <CustomFormField fieldType={FormFieldType.DATE_PICKER} control={form.control} name="end_time" label="End" showTimeSelect dateFormat="MM/dd/yyyy h:mm aa" />
        <CustomFormField fieldType={FormFieldType.SELECT} control={form.control} name="duty_status" label="Status">
          <SelectItem value="off_duty">Off Duty</SelectItem>
          <SelectItem value="sleeper_berth">Sleeper Berth</SelectItem>
          <SelectItem value="driving">Driving</SelectItem>
          <SelectItem value="on_duty">On Duty</SelectItem>
        </CustomFormField>
        <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="city" label="City" />
        <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="state" label="State" />
        <div className="col-span-2">
          <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="location" label="Location" />
        </div>
        <div className="col-span-2">
          <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="activity_description" label="Activity / Remarks" />
        </div>
        <CustomFormField fieldType={FormFieldType.CHECKBOX} control={form.control} name="vehicle_moved" label="Vehicle Moved" />
        <div className="col-span-2">
          <Button type="submit">Add Period</Button>
        </div>
      </form>
    </Form>
  );
}

export default ManageLogSheet;
