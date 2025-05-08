"use client";

import { useEffect, useState } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal"; 
import { ConfirmModal } from "@/components/modals/confirm-modal";

import { columns, GenreColumn } from "./columns";
import { GenreForm } from "./form";
import { Heading } from "@/components/ui/heading";
import { useBreadcrumbs } from "@/providers/breadcrumb-provider";
import axios from "axios";
import toast from "react-hot-toast";

interface GenresClientProps {
    data: GenreColumn[];
}

export const GenreClient: React.FC<GenresClientProps> = ({ data }) => {
    const router = useRouter();
    const { setBreadcrumbs } = useBreadcrumbs();
    
    // Set breadcrumbs on mount
    useEffect(() => {
        setBreadcrumbs([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Genres" },
        ]);
    }, [setBreadcrumbs]);
    
    // Create modal states
    const [open, setOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<GenreColumn | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle edit action
    const onEdit = (genre: GenreColumn) => {
        setSelectedGenre(genre);
        setEditModalOpen(true);
    };

    // Handle delete action
    const onDelete = (genre: GenreColumn) => {
        setSelectedGenre(genre);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedGenre) return;
        
        setLoading(true);
        try {
            await axios.delete(`/api/genres/${selectedGenre.id}`);
            router.refresh();
            toast.success("Genre deleted successfully.");
            setDeleteModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // Get the specific error message from the API
                const errorMessage = error.response.data || "Failed to delete genre.";
                
                if (error.response.status === 400 && typeof errorMessage === 'string' && 
                    errorMessage.includes("associated with movies")) {
                    // Show specific toast for movies association error
                    toast.error("This genre is associated with movies and cannot be deleted. Remove all movie associations first.");
                } else {
                    // Show the exact error message from the API
                    toast.error(typeof errorMessage === 'string' ? errorMessage : "Something went wrong.");
                }
            } else {
                // Fallback error message
                toast.error("Unable to delete genre. Please try again later.");
            }
            console.error("Error deleting genre:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Create Genre Modal */}
            <Modal
                title="Create Genre"
                description="Add a new genre to your collection"
                isOpen={open}
                onClose={() => setOpen(false)}
            >
                <GenreForm
                    onClose={() => setOpen(false)}
                    onSuccess={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                />
            </Modal>

            {/* Edit Genre Modal */}
            <Modal
                title="Edit Genre"
                description="Update genre details"
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
            >
                {selectedGenre && (
                    <GenreForm
                        initialData={selectedGenre}
                        onClose={() => setEditModalOpen(false)}
                        onSuccess={() => {
                            setEditModalOpen(false);
                            router.refresh();
                        }}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                title="Delete Genre"
                description="Are you sure you want to delete this genre? This action cannot be undone."
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={loading}
                confirmLabel="Delete"
            />

            <Heading
                title="Genres Management"
                description="Manage movie genres in Koflix movie database"
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Genre
                    </Button>
                }
            />

            <DataTable 
                columns={columns(onEdit, onDelete)} 
                data={data} 
                searchKey="name" 
            />
        </>
    );
};