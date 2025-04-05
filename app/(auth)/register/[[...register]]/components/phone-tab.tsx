"use client"

import { z } from "zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { E164Number } from "libphonenumber-js";
import { sendVerificationCode } from "@/lib/auth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";

// Phone schema
const phoneSchema = z.object({
    phone: z.string()
        .min(1, "Phone number is required")
        .refine((value) => {
            return /^(\+?[0-9]{8,15})$/.test(value.replace(/[\s-]/g, ''));
        }, {
            message: "Please enter a valid phone number"
        }),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

interface PhoneTabProps {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
}

const PhoneTab: React.FC<PhoneTabProps> = ({ isLoading, setIsLoading }) => {
    const router = useRouter();
    const [phoneValue, setPhoneValue] = useState<E164Number | undefined>();
    const [phoneError, setPhoneError] = useState<string | null>(null);
    
    // Phone form
    const form = useForm<PhoneFormValues>({
        resolver: zodResolver(phoneSchema),
        defaultValues: {
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });
    
    // Handle phone registration
    const handlePhoneRegister = async (values: PhoneFormValues) => {
        try {
            setIsLoading(true);
            setPhoneError(null);
            
            if (!phoneValue) {
                setPhoneError("Please enter a valid phone number");
                return;
            }
            
            // Store password for after verification
            localStorage.setItem('phoneRegistrationPassword', values.password);
            
            const verificationId = await sendVerificationCode(phoneValue.toString());
            if (verificationId) {
                router.push("/verify-code");
            }
        } catch (error) {
            console.error("Phone registration error:", error);
            // Error is already handled by sendVerificationCode
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePhoneRegister)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="phone"
                    render={() => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <PhoneInput
                                value={phoneValue}
                                onChange={(value) => {
                                    setPhoneValue(value);
                                    form.setValue("phone", value?.toString() || "");
                                    setPhoneError(null);
                                }}
                                defaultCountry="US"
                            />
                            {(form.formState.isSubmitted && !phoneValue) || phoneError ? (
                                <p className="text-sm font-medium text-destructive mt-2">
                                    {phoneError || "Phone number is required"}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                    You&apos;ll receive a verification code via SMS
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder="********"
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder="********"
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                >
                    {isLoading ? "Sending Code..." : "Continue with Phone"}
                </Button>
            </form>
            
            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container" className="hidden"></div>
        </Form>
    );
};

export default PhoneTab;