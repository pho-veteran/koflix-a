import React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
  separator?: boolean;
}

export function Heading({
  title,
  description,
  className,
  actions,
  separator = true
}: HeadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-1 items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex-shrink-0 md:mt-0">
            {actions}
          </div>
        )}
      </div>
      {separator && <Separator />}
    </div>
  );
}