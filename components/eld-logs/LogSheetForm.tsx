"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import CustomFormField, { FormFieldType } from "@/components/CustomFormField";
import { logsheetsService } from "@/lib/api/logsheets";
import { Form } from "@/components/ui/form";

const LogSheetValidation = z.object({
  date: z.string().min(1, "Date is required"),
});

export type LogSheetFormValues = z.infer<typeof LogSheetValidation>;

interface LogSheetFormProps {
  tripId: number;
  driverId: number;
  initialValues?: Partial<LogSheetFormValues>;
  onSuccess?: (createdId: number) => void;
}

export default function LogSheetForm({
  tripId,
  driverId,
  initialValues,
  onSuccess,
}: LogSheetFormProps) {
  const router = useRouter();
  const form = useForm<LogSheetFormValues>({
    resolver: zodResolver(LogSheetValidation),
    defaultValues: {
      date: initialValues?.date || new Date().toISOString().slice(0, 10),
    },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: LogSheetFormValues) => {
    try {
      const created = await logsheetsService.createBasic({
        date: values.date,
        driver_id: driverId,
        trip_id: tripId,
      });
      if (onSuccess) onSuccess(created.id);
      else router.push(`/dashboard/trip/${tripId}/edit-logsheet/${created.id}`);
    } catch {
      form.setError("root", {
        type: "server",
        message: "Failed to create log sheet.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="date"
          label="Date"
          type="date"
          placeholder="Date"
        />
        {form.formState.errors.root && (
          <div className="text-red-500">
            {form.formState.errors.root.message}
          </div>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Log Sheet"}
        </Button>
      </form>
    </Form>
  );
}
