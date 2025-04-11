"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "react-hot-toast";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
});

interface CountryFormProps {
    initialData?: {
        id?: string;
        name?: string;
        slug?: string;
    };
    onClose?: () => void;
    onSuccess?: () => void;
}

export const CountryForm: React.FC<CountryFormProps> = ({
    initialData,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);

    const toastMessage = initialData ? "Country updated." : "Country created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/countries/${initialData.id}`, values);
            } else {
                await axios.post("/api/countries", values);
            }
            toast.success(toastMessage);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error("Something went wrong.");
            console.error("Error saving country:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Type the country name"
                                            {...field}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="country-slug"
                                            {...field}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    {onClose && (
                        <Button variant="outline" onClick={onClose} type="button" disabled={loading}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : action}
                    </Button>
                </div>
            </form>
        </Form>
    );
};