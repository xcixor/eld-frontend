"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "@/components/submit-button";
import { RegistrationFormValidation } from "@/lib/validation";
import { Eye, EyeOff } from "lucide-react";
import { authService, ValidationError } from "@/lib/api/auth";

type SignupProps = {
  className?: string;
  defaultValues?: Partial<z.infer<typeof RegistrationFormValidation>>;
};
export function RegistrationForm({
  className,
  defaultValues,
  ...props
}: SignupProps) {
  const form = useForm<z.infer<typeof RegistrationFormValidation>>({
    resolver: zodResolver(RegistrationFormValidation),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
      username: "",
      driver_number: "",
      initials: "",
      home_operating_center: "",
      license_number: "",
      license_state: "",
      ...defaultValues,
    },
  });
  const { isValid, errors } = form.formState;
  const [isLoading, setIsLoading] = useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);




  const toggleIsPasswordHidden = () =>
    setIsPasswordHidden((current) => !current);

  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const toggleIsConfirmPasswordHidden = () =>
    setIsConfirmPasswordHidden((current) => !current);

  const router = useRouter();

  const onSubmit = async (
    values: z.infer<typeof RegistrationFormValidation>,
  ) => {
    const {
      email,
      password,
      password_confirm,
      first_name,
      last_name,
      username,
      driver_number,
      initials,
      home_operating_center,
      license_number,
      license_state,
    } = values;

    if (isValid) {
      setIsLoading(true);
      try {
        const registrationData = {
          email,
          password,
          password_confirm,
          first_name,
          last_name,
          username: username as string,
          driver_number: driver_number as string,
          initials: initials as string,
          home_operating_center: home_operating_center as string,
          license_number: license_number as string,
          license_state: license_state as string,
        };

        const response = await authService.register(registrationData);

        if (response.status_code === 201) {
          toast("Signup successful! Please signin.");
          router.push("/auth/login");
        } else {
          toast("Signup failed. Please try again.");
        }
      } catch (error) {

        // Handle validation errors with field-specific messages
        if (error instanceof Error && 'fieldErrors' in error) {
          const validationError = error as ValidationError;

          // Handle non-field errors (show as toast)
          if (validationError.nonFieldErrors && validationError.nonFieldErrors.length > 0) {
            validationError.nonFieldErrors.forEach(errorMessage => {
              toast.error(errorMessage);
            });
          }

          // Handle field-specific errors (show below fields)
          if (validationError.fieldErrors) {
            // Set server errors on form fields
            Object.keys(validationError.fieldErrors).forEach((fieldName) => {
              const fieldErrors = validationError.fieldErrors![fieldName];
              if (fieldErrors && fieldErrors.length > 0) {
                form.setError(fieldName as any, {
                  type: "server",
                  message: fieldErrors[0], // Show first error message
                });
              }
            });
          }

          // Show generic message if there are field errors
          if (validationError.fieldErrors && Object.keys(validationError.fieldErrors).length > 0) {
            toast("Please fix the errors below");
          }
        } else {
          toast("Signup failed. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-500">
          Please fix the errors below before continuing
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-dark-700 text-2xl">
            <h1>Signup</h1>
          </CardTitle>

          <CardDescription className="text-dark-600">
            Signup below or{" "}
            <Link href="/auth/signin" className="underline">
              signin
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="items-center justify-between gap-4 md:flex">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="first_name"
                    label="First Name"
                    placeholder="Jane"
                  />

                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="last_name"
                    label="Last Name"
                    placeholder="Doe"
                  />
                </div>

                <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="example@mail.com"
                  />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-input-label">
                        Password
                      </FormLabel>
                      <FormControl className="border-dark-100 rounded-md border">
                        <div className="relative">
                          <Input
                            {...field}
                            type={isPasswordHidden ? "password" : "text"}
                            className="shad-input"
                          />
                          {isPasswordHidden ? (
                            <EyeOff
                              className="text-dark-400 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                              onClick={toggleIsPasswordHidden}
                            />
                          ) : (
                            <Eye
                              className="text-dark-400 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                              onClick={toggleIsPasswordHidden}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-input-label">
                        Confirm Password
                      </FormLabel>
                      <FormControl className="border-dark-100 rounded-md border">
                        <div className="relative">
                          <Input
                            {...field}
                            type={isConfirmPasswordHidden ? "password" : "text"}
                            className="shad-input"
                          />
                          {isConfirmPasswordHidden ? (
                            <EyeOff
                              className="text-dark-400 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                              onClick={toggleIsConfirmPasswordHidden}
                            />
                          ) : (
                            <Eye
                              className="text-dark-400 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                              onClick={toggleIsConfirmPasswordHidden}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="username"
                  label="Username"
                  placeholder="Enter username"
                />

                <div className="items-center justify-between gap-4 md:flex">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="driver_number"
                    label="Driver Number"
                    placeholder="D123"
                  />

                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="initials"
                    label="Initials"
                    placeholder="JD"
                  />
                </div>

                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="home_operating_center"
                  label="Home Operating Center"
                  placeholder="HOC1"
                />

                <div className="items-center justify-between gap-4 md:flex">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="license_number"
                    label="License Number"
                    placeholder="L123"
                  />

                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="license_state"
                    label="License State"
                    placeholder="CA"
                  />
                </div>

                <SubmitButton isLoading={isLoading}>
                  Complete Signup
                </SubmitButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
