import AuthHero from "@/components/auth-hero";
import { RegistrationForm } from "@/components/auth/register";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import React from "react";

type Props = {};

const register = (props: Props) => {
  return (
    <div className="flex h-screen flex-col-reverse justify-center md:flex-row md:items-stretch">
      <div className="basis-1/2 bg-slate-100 p-[10%] md:flex md:flex-col md:justify-center">
        <RegistrationForm />
      </div>
      <div className="bg-secondary-600 flex h-full basis-1/2 flex-col items-center justify-center bg-[url('/hero.jpg')] bg-cover bg-center bg-no-repeat">
        <AuthHero />
      </div>
    </div>
  );
};

export default register;
