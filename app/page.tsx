import MaxWidthWrapper from "@/components/MaxWidthWrapper";

export default function Home() {
  return (
    <MaxWidthWrapper>
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <h1 className="mb-4 text-4xl font-bold">ELD Route Planner</h1>
      </div>
    </MaxWidthWrapper>
  );
}
