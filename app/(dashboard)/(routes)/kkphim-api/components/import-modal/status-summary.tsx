"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";

interface StatusSummaryProps {
  selectedCount: number;
  loadingCount: number;
  loadedCount: number;
  errorCount: number;
  existingCount: number;
  isWaiting?: boolean;
}

export function StatusSummary({
  selectedCount,
  loadingCount,
  loadedCount,
  errorCount,
  existingCount,
  isWaiting = false
}: StatusSummaryProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isWaiting ? (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Contact movies database...
        </Badge>
      ) : (
        <>
          <Badge variant="outline">
            {selectedCount} selected
          </Badge>
          
          {existingCount > 0 && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800">
              <Info className="h-3 w-3" />
              {existingCount} already exist
            </Badge>
          )}
          
          {loadingCount > 0 && (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
              <Loader2 className="h-3 w-3 animate-spin" />
              {loadingCount} loading
            </Badge>
          )}
          
          {loadedCount > 0 && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3" />
              {loadedCount} ready to import
            </Badge>
          )}
          
          {errorCount > 0 && (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800">
              <AlertCircle className="h-3 w-3" />
              {errorCount} errors
            </Badge>
          )}
        </>
      )}
    </div>
  );
}