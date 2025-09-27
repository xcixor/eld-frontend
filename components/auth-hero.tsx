import React from "react";

type Props = {};

const AuthHero = (props: Props) => {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-6 bg-[rgba(64,64,64,0.8)] p-12">
      <div className="flex w-1/2 flex-col gap-4">
        <p className="text-[0.8rem] font-bold text-white uppercase">
          ELD Route Planner
        </p>
        <h1 className="text-2xl font-bold text-white md:text-4xl">
          Plan your routes with ease
        </h1>
        <p className="text-md font-medium text-white md:text-lg">
          Plan your routes efficiently and stay compliant with ELD regulations.
        </p>
      </div>
    </div>
  );
};

export default AuthHero;
