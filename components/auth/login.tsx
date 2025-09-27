"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { LoginFormValidation } from "@/lib/validation";
import { Eye, EyeOff } from "lucide-react";

import { signIn } from "next-auth/react";

type LoginProps = {
  className?: string;
  defaultValues?: Partial<z.infer<typeof LoginFormValidation>>;
  callbackUrl?: string;
};

export function LoginForm({ className, defaultValues, ...props }: LoginProps) {
  const form = useForm<z.infer<typeof LoginFormValidation>>({
    resolver: zodResolver(LoginFormValidation),
    defaultValues: {
      username: "",
      password: "",
      ...defaultValues,
    },
  });

  const { isValid, errors } = form.formState;
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  const toggleIsPasswordHidden = () =>
    setIsPasswordHidden((current) => !current);

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof LoginFormValidation>) => {
    const { username, password } = values;

    if (isValid) {
      setIsLoading(true);
      try {
        await signIn("credentials", {
          username,
          password,
          redirect: true,
          callbackUrl: props.callbackUrl ?? "/dashboard",
        });
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Login failed. Please check your credentials.");
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
            <h1>Sign In</h1>
          </CardTitle>

          <CardDescription className="text-dark-600">
            Sign in below or
            <Link href="/register" className="underline">
              create an account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="username"
                  label="Username"
                  placeholder="Enter your username"
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
                            placeholder="Enter your password"
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

                <SubmitButton isLoading={isLoading}>Sign In</SubmitButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
