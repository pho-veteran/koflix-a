"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    description,
    isOpen,
    onClose,
    onConfirm,
    loading = false,
    confirmLabel = "Continue",
    cancelLabel = "Cancel",
    variant = "destructive",
}) => {
    // Handle escape key and backdrop clicks correctly
    const handleOpenChange = (open: boolean) => {
        if (!open && !loading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent onInteractOutside={onClose} onEscapeKeyDown={onClose}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        type="button"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};