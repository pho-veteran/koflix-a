"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
    title?: string;
    description?: string;
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    title,
    description,
    isOpen,
    onClose,
    children,
}) => {
    // Handle escape key and backdrop clicks correctly
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    // Key to force remount when closed and reopened
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent onInteractOutside={onClose} onEscapeKeyDown={onClose}>
                {(title || description) && (
                    <DialogHeader>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                )}
                <div className="py-4">{children}</div>
            </DialogContent>
        </Dialog>
    );
};