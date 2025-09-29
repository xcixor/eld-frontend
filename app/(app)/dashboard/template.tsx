import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Navbar from "@/components/navbar/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar bgColor="bg-secondary-100/50" />
      <MaxWidthWrapper className="py-4">{children}</MaxWidthWrapper>
    </>
  );
}
