"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./action-cell";

export type MovieTypeColumn = {
    id: string;
    name: string;
    slug: string;
    movieCount: number;
    createdAt: string;
};

export const columns = (
    onEdit: (movieType: MovieTypeColumn) => void,
    onDelete: (movieType: MovieTypeColumn) => void
): ColumnDef<MovieTypeColumn>[] => [
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