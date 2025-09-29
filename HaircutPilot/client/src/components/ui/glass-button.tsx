import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface GlassButtonProps extends ButtonProps {
  glow?: boolean;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, glow = false, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "glass-button transition-all duration-300 ease-in-out",
          glow && "animate-glow",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
