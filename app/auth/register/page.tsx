import { RegistrationForm } from "@/components/auth/register";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import React from "react";

type Props = {};

const register = (props: Props) => {
  return (
    <MaxWidthWrapper>
      <RegistrationForm />
    </MaxWidthWrapper>
  );
};

export default register;
