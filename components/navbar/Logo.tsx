import Image from "next/image";

export const Logo = () => {
  return (
    <Image
      src="/logo.png"
      alt="ELD Logo"
      height={80}
      width={80}
      className="bg-transparent"
    />
  );
};
