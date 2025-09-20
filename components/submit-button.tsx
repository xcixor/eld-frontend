import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface ButtonProps {
  isLoading: boolean;
  className?: string;
  children: React.ReactNode;
}

const SubmitButton = ({ isLoading, className, children }: ButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      className={className ?? "shad-primary-btn"}
    >
      {isLoading ? (
        <div className="flex items-center gap-4">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  );
};

export default SubmitButton;
