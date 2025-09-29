import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, hover = true, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "metric-card rounded-xl",
          hover && "cursor-pointer group",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
MetricCard.displayName = "MetricCard";

export { MetricCard };
