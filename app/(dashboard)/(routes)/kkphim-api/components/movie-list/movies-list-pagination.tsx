import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface MoviesListPaginationProps {
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
}

export const MoviesListPagination = ({
    currentPage,
    totalPages,
    isLoading,
    onPageChange,
}: MoviesListPaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1 && !isLoading) onPageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>

                {/* First page */}
                {currentPage > 3 && (
                    <PaginationItem>
                        <PaginationLink
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(1);
                            }}
                        >
                            1
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* Ellipsis if needed */}
                {currentPage > 4 && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum;

                    if (currentPage <= 3) {
                        // If we're near the start, show pages 1-5
                        pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        // If we're near the end, show the last 5 pages
                        pageNum = totalPages - 4 + i;
                    } else {
                        // Otherwise show 2 pages before and 2 after current page
                        pageNum = currentPage - 2 + i;
                    }

                    // Skip if page number is outside valid range
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                        <PaginationItem key={`page-${pageNum}`}>
                            <PaginationLink
                                href="#"
                                isActive={currentPage === pageNum}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(pageNum);
                                }}
                                className={isLoading ? "pointer-events-none" : ""}
                            >
                                {pageNum}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                {/* Ellipsis if needed */}
                {currentPage < totalPages - 3 && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                    <PaginationItem>
                        <PaginationLink
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(totalPages);
                            }}
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                )}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages && !isLoading) onPageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};