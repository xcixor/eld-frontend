import AuthHero from "@/components/auth-hero";
import { LoginForm } from "@/components/auth/login";
import React from "react";

const login = () => {
  return (
    <div className="flex h-screen flex-col-reverse justify-center md:flex-row md:items-stretch">
      <div className="basis-1/2 bg-slate-100 p-[10%] md:flex md:flex-col md:justify-center">
        <LoginForm />
      </div>
      <div className="bg-secondary-600 flex h-full basis-1/2 flex-col items-center justify-center bg-[url('/hero.jpg')] bg-cover bg-center bg-no-repeat">
        <AuthHero />
      </div>
    </div>
  );
};

export default login;
