"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Diff, FilmIcon } from "lucide-react";

interface StatusSummaryProps {
  selectedCount: number;
  loadingCount: number;
  comparingCount: number;
  changedCount: number;
  errorCount: number;
  unchangedCount: number;
  excludedSingleCount: number;
  excludedCompletedCount?: number;
  isProcessing: boolean;
}

export function StatusSummary({
  selectedCount,
  loadingCount,
  comparingCount,
  changedCount,
  errorCount,
  unchangedCount,
  excludedSingleCount,
  excludedCompletedCount = 0,
  isProcessing = false
}: StatusSummaryProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isProcessing ? (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Processing movies...
        </Badge>
      ) : (
        <>
          <Badge variant="outline">
            {selectedCount} selected
          </Badge>
          
          {excludedSingleCount > 0 && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800">
              <FilmIcon className="h-3 w-3 mr-1" />
              {excludedSingleCount} single movies excluded
            </Badge>
          )}

          {excludedCompletedCount > 0 && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {excludedCompletedCount} completed series excluded
            </Badge>
          )}
          
          {loadingCount > 0 && (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              {loadingCount} loading
            </Badge>
          )}
          
          {comparingCount > 0 && (
            <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800">
              <Diff className="h-3 w-3 mr-1" />
              {comparingCount} comparing
            </Badge>
          )}
          
          {changedCount > 0 && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
              <RefreshCw className="h-3 w-3 mr-1" />
              {changedCount} need update
            </Badge>
          )}
          
          {unchangedCount > 0 && (
            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {unchangedCount} up to date
            </Badge>
          )}
          
          {errorCount > 0 && (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errorCount} errors
            </Badge>
          )}
        </>
      )}
    </div>
  );
}