import Image from "next/image";

export const Logo = () => {
  return (
    <Image
      src="/logo.png"
      alt="ELD Logo"
      height={120}
      width={120}
      className="bg-transparent"
    />
  );
};
