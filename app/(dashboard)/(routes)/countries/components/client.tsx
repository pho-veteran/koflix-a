"use client";

import { useEffect, useState } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal"; 
import { ConfirmModal } from "@/components/modals/confirm-modal";

import { columns, CountryColumn } from "./columns";
import { CountryForm } from "./form";
import { Heading } from "@/components/ui/heading";
import { useBreadcrumbs } from "@/providers/breadcrumb-provider";
import axios from "axios";
import toast from "react-hot-toast";

interface CountriesClientProps {
    data: CountryColumn[];
}

export const CountryClient: React.FC<CountriesClientProps> = ({ data }) => {
    const router = useRouter();
    const { setBreadcrumbs } = useBreadcrumbs();

    // Set breadcrumbs on mount
    useEffect(() => {
        setBreadcrumbs([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Countries" },
        ]);
    }, [setBreadcrumbs]);
    
    // Create modal states
    const [open, setOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryColumn | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle edit action
    const onEdit = (country: CountryColumn) => {
        setSelectedCountry(country);
        setEditModalOpen(true);
    };

    // Handle delete action
    const onDelete = (country: CountryColumn) => {
        setSelectedCountry(country);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCountry) return;
        
        setLoading(true);
        try {
            await axios.delete(`/api/countries/${selectedCountry.id}`);
            router.refresh();
            toast.success("Country deleted successfully.");
            setDeleteModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // Get the specific error message from the API
                const errorMessage = error.response.data || "Failed to delete country.";
                
                if (error.response.status === 400 && typeof errorMessage === 'string' && 
                    errorMessage.includes("associated with movies")) {
                    // Show specific toast for movies association error
                    toast.error("This country is associated with movies and cannot be deleted. Remove all movie associations first.");
                } else {
                    // Show the exact error message from the API
                    toast.error(typeof errorMessage === 'string' ? errorMessage : "Something went wrong.");
                }
            } else {
                // Fallback error message
                toast.error("Unable to delete country. Please try again later.");
            }
            console.error("Error deleting country:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Create Country Modal */}
            <Modal
                title="Create Country"
                description="Add a new country to your collection"
                isOpen={open}
                onClose={() => setOpen(false)}
            >
                <CountryForm
                    onClose={() => setOpen(false)}
                    onSuccess={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                />
            </Modal>

            {/* Edit Country Modal */}
            <Modal
                title="Edit Country"
                description="Update country details"
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
            >
                {selectedCountry && (
                    <CountryForm
                        initialData={selectedCountry}
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
                title="Delete Country"
                description="Are you sure you want to delete this country? This action cannot be undone."
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={loading}
                confirmLabel="Delete"
            />

            <Heading
                title="Countries Management"
                description="Manage movie countries in Koflix movie database"
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Country
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