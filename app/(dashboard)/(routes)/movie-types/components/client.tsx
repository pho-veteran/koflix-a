"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal"; 
import { ConfirmModal } from "@/components/modals/confirm-modal";

import { columns, MovieTypeColumn } from "./columns";
import { MovieTypeForm } from "./form";
import { Heading } from "@/components/ui/heading";
import axios from "axios";
import toast from "react-hot-toast";

interface MovieTypesClientProps {
    data: MovieTypeColumn[];
}

export const MovieTypeClient: React.FC<MovieTypesClientProps> = ({ data }) => {
    const router = useRouter();
    
    // Create modal states
    const [open, setOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMovieType, setSelectedMovieType] = useState<MovieTypeColumn | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle edit action
    const onEdit = (movieType: MovieTypeColumn) => {
        setSelectedMovieType(movieType);
        setEditModalOpen(true);
    };

    // Handle delete action
    const onDelete = (movieType: MovieTypeColumn) => {
        setSelectedMovieType(movieType);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedMovieType) return;
        
        setLoading(true);
        try {
            await axios.delete(`/api/movie-types/${selectedMovieType.id}`);
            router.refresh();
            toast.success("Movie type deleted successfully.");
            setDeleteModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // Get the specific error message from the API
                const errorMessage = error.response.data || "Failed to delete movie type.";
                
                if (error.response.status === 400 && typeof errorMessage === 'string' && 
                    errorMessage.includes("associated with movies")) {
                    // Show specific toast for movies association error
                    toast.error("This movie type is associated with movies and cannot be deleted. Remove all movie associations first.");
                } else {
                    // Show the exact error message from the API
                    toast.error(typeof errorMessage === 'string' ? errorMessage : "Something went wrong.");
                }
            } else {
                // Fallback error message
                toast.error("Unable to delete movie type. Please try again later.");
            }
            console.error("Error deleting movie type:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Create Movie Type Modal */}
            <Modal
                title="Create Movie Type"
                description="Add a new movie type to your collection"
                isOpen={open}
                onClose={() => setOpen(false)}
            >
                <MovieTypeForm
                    onClose={() => setOpen(false)}
                    onSuccess={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                />
            </Modal>

            {/* Edit Movie Type Modal */}
            <Modal
                title="Edit Movie Type"
                description="Update movie type details"
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
            >
                {selectedMovieType && (
                    <MovieTypeForm
                        initialData={selectedMovieType}
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
                title="Delete Movie Type"
                description="Are you sure you want to delete this movie type? This action cannot be undone."
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={loading}
                confirmLabel="Delete"
            />

            <Heading
                title="Movie Types Management"
                description="Manage movie types in Koflix movie database"
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Movie Type
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