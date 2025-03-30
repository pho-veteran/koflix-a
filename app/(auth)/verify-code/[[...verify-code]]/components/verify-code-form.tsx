"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { verifyCode, sendVerificationCode, resetPhoneAuth, hasActivePhoneVerification, getActivePhoneNumber } from "@/lib/auth";

const formSchema = z.object({
    code: z.string().length(6, "Verification code must be 6 digits")
});

type VerifyCodeFormValues = z.infer<typeof formSchema>;

interface VerifyCodeFormProps {
    className?: string;
}

const VerifyCodeForm: React.FC<VerifyCodeFormProps> = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [hasVerification, setHasVerification] = useState<boolean>(false);

    // Get verification status on component mount
    useEffect(() => {
        setHasVerification(hasActivePhoneVerification());
        setPhoneNumber(getActivePhoneNumber());
    }, []);

    const form = useForm<VerifyCodeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
        },
    });

    // If no verification ID, show message to return to registration
    if (!hasVerification) {
        return (
            <Card className="w-[370px]">
                <CardHeader>
                    <CardTitle className="text-2xl">Verification Required</CardTitle>
                    <CardDescription>
                        No active verification session found.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You need to request a verification code before visiting this page.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/register">Go to Registration</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const handleResendCode = async () => {
        if (!phoneNumber) {
            toast.error("Phone number not found. Please start over.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await sendVerificationCode(phoneNumber);
            toast.success("Verification code resent");
        } catch (err) {
            console.error("Error resending code:", err);
            setError("Failed to resend code. Please try again.");
            toast.error("Failed to resend code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (values: VerifyCodeFormValues) => {
        try {
            setIsLoading(true);
            setError(null);

            const user = await verifyCode(values.code);
            if (user) {
                toast.success("Phone verification successful");
                router.push("/");
            } else {
                setError("Invalid verification code. Please try again.");
            }
        } catch (err) {
            console.error("Error verifying code:", err);
            setError("Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[370px]">
            <CardHeader>
                <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
                <CardDescription>
                    We sent a verification code to {phoneNumber}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleVerifyCode)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem className="mx-auto">
                                    <FormLabel className="text-center block mb-2">Enter verification code</FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            disabled={isLoading}
                                            {...field}
                                            render={({ slots }) => (
                                                <InputOTPGroup>
                                                    {slots.map((slot, index) => (
                                                        <InputOTPSlot key={index} index={index} {...slot} />
                                                    ))}
                                                </InputOTPGroup>
                                            )}
                                        />
                                    </FormControl>
                                    {error && (
                                        <p className="text-sm font-medium text-destructive mt-2 text-center">
                                            {error}
                                        </p>
                                    )}
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Verify Code"}
                        </Button>
                    </form>
                </Form>

                <div className="mt-4 text-center">
                    <Button
                        variant="link"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-sm"
                    >
                        Didn&apos;t receive a code? Resend
                    </Button>
                </div>

                <div className="mt-2 text-center">
                    <Button
                        variant="link"
                        onClick={() => {
                            resetPhoneAuth();
                            router.push("/register");
                        }}
                        className="text-sm text-muted-foreground"
                    >
                        Use a different phone number
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default VerifyCodeForm;