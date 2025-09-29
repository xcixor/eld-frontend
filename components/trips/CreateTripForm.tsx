"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CustomFormField, { FormFieldType } from "@/components/CustomFormField";
import SubmitButton from "@/components/submit-button";
import { Form } from "@/components/ui/form";
import { useState } from "react";
import { Trip, tripService } from "@/lib/api/trips";
import { toast } from "sonner";
import { ValidationError } from "@/types/api";
import { useRouter } from "next/navigation";

const CreateTripValidation = z.object({
  pickup_location: z.string().min(1, "Pickup location is required"),
  dropoff_location: z.string().min(1, "Dropoff location is required"),
  current_location: z.string().min(1, "Current location is required"),
  current_cycle_used_hours: z.coerce.number()
    .min(0, "Hours cannot be negative")
    .max(70, "Hours cannot exceed 70")
    .transform((v) => Number(v) || 0),
  driver : z.string().optional(),
  truck_id: z.string().min(1, "Truck ID is required"),
  current_lat: z.number().optional(),
  current_lng: z.number().optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  dropoff_lat: z.number().optional(),
  dropoff_lng: z.number().optional(),
});

type CreateTripFormValues = z.infer<typeof CreateTripValidation>;

export interface CreateTripFormProps {
  loading?: boolean;
  defaultValues?: Partial<CreateTripFormValues>;
  vehicleOptions?: { label: string; value: string }[];
  driver?: string;
  setSelectedTripId: (tripId: number) => void;
  setTrips: (trip: Trip) => void;
  toggleShowCreateTrip: () => void;
}

export default function CreateTripForm({
  loading,
  defaultValues,
  vehicleOptions,
  driver,
  setSelectedTripId,
  setTrips,
  toggleShowCreateTrip,
}: CreateTripFormProps) {
  const form = useForm({
    resolver: zodResolver(CreateTripValidation),
    defaultValues,
    mode: "onChange",
  });

  const [creating, setCreating] = useState(false);
  const { errors } = form.formState;
  const router = useRouter();

  const onSubmit = async  (values: CreateTripFormValues) => {
     if (!driver) return;
    setCreating(true);
    try {
      const trip = await tripService.createTrip({
        pickup_location: values.pickup_location,
        dropoff_location: values.dropoff_location,
        current_location: values.current_location,
        current_cycle_used_hours: values.current_cycle_used_hours ?? 0,
        driver_id: driver || "",
        truck_id: values.truck_id,
        current_lat: values.current_lat,
        current_lng: values.current_lng,
        pickup_lat: values.pickup_lat,
        pickup_lng: values.pickup_lng,
        dropoff_lat: values.dropoff_lat,
        dropoff_lng: values.dropoff_lng,
      });
      setTrips(trip.trip);
      setSelectedTripId(trip.trip.id);
      toggleShowCreateTrip();
      toast.success("Trip created successfully");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && "fieldErrors" in error) {
        const validationError = error as ValidationError;

        if (
          validationError.nonFieldErrors &&
          validationError.nonFieldErrors.length > 0
        ) {
          validationError.nonFieldErrors.forEach((errorMessage) => {
            toast.error(errorMessage);
          });
        }

        if (validationError.fieldErrors) {
          Object.keys(validationError.fieldErrors).forEach((fieldName) => {
            const fieldErrors = validationError.fieldErrors![fieldName];
            if (fieldErrors && fieldErrors.length > 0) {
              form.setError(fieldName as keyof CreateTripFormValues, {
                type: "server",
                message: fieldErrors[0],
              });
            }
          });
        }

        if (
          validationError.fieldErrors &&
          Object.keys(validationError.fieldErrors).length > 0
        ) {
          toast("Please fix the errors below");
        }
      } else {
        toast("Trip creation failed. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };


  return (
    <Form {...form}>
      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-500">
          Please fix the errors below before continuing
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField
          control={form.control}
          name="pickup_location"
          label="Pickup Location"
          placeholder="Enter pickup location"
          fieldType={FormFieldType.INPUT}
        />
        <CustomFormField
          control={form.control}
          name="dropoff_location"
          label="Dropoff Location"
          placeholder="Enter dropoff location"
          fieldType={FormFieldType.INPUT}
        />
        <CustomFormField
          control={form.control}
          name="current_location"
          label="Current Location"
          placeholder="Enter current location"
          fieldType={FormFieldType.INPUT}
        />
        <CustomFormField
          control={form.control}
          name="current_cycle_used_hours"
          label="Current Cycle Used (Hours)"
          placeholder="0"
          fieldType={FormFieldType.INPUT}
          type="number"
        />
        <CustomFormField
          control={form.control}
          name="truck_id"
          label="Vehicle"
          placeholder="Select truck"
          fieldType={FormFieldType.COMBOBOX}
          comboboxOptions={vehicleOptions || []}
        />



        <SubmitButton isLoading={!!loading || form.formState.isSubmitting}>
          Create Trip
        </SubmitButton>
      </form>
    </Form>
  );
}
