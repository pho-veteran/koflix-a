"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./action-cell";

export type CountryColumn = {
    id: string;
    name: string;
    slug: string;
    movieCount: number;
    createdAt: string;
};

export const columns = (
    onEdit: (country: CountryColumn) => void,
    onDelete: (country: CountryColumn) => void
): ColumnDef<CountryColumn>[] => [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "slug",
            header: "Slug",
        },
        {
            accessorKey: "movieCount",
            header: "Movies",
        },
        {
            accessorKey: "createdAt",
            header: "Date",
        },
        {
            id: "actions",
            cell: ({ row }) => <CellAction data={row.original} onEdit={onEdit} onDelete={onDelete} />,
        },
    ];