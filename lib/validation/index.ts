import { z } from "zod";

export const LoginFormValidation = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const RegistrationFormValidation = z
  .object({
    email: z.string().email().min(2).max(100),
    password: z.string().min(8).max(100),
    password_confirm: z.string().min(8).max(100),
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    username: z.string().min(2).max(100).optional(),
    driver_number: z.string().min(2).max(100).optional(),
    initials: z.string().min(2).max(100).optional(),
    home_operating_center: z.string().min(2).max(100).optional(),
    license_number: z.string().min(2).max(100).optional(),
    license_state: z.string().min(2).max(100).optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords must match",
    path: ["password_confirm"],
  });
