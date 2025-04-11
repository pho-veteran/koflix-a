"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface StatusSummaryProps {
  selectedCount: number;
  loadingCount: number;
  loadedCount: number;
  errorCount: number;
}

export function StatusSummary({ selectedCount, loadingCount, loadedCount, errorCount }: StatusSummaryProps) {
  return (
    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="px-2 py-1">
          {selectedCount} selected
        </Badge>

        {loadingCount > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 px-2 py-1">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            {loadingCount} loading
          </Badge>
        )}

        {loadedCount > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-600 px-2 py-1">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {loadedCount} ready
          </Badge>
        )}

        {errorCount > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-600 px-2 py-1">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errorCount} failed
          </Badge>
        )}
      </div>
    </div>
  );
}