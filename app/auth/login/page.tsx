import { LoginForm } from "@/components/auth/login";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import React from "react";

type Props = {};

const login = (props: Props) => {
  return (
    <MaxWidthWrapper>
      <LoginForm />
    </MaxWidthWrapper>
  );
};

export default login;