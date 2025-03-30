"use client"

import { z } from "zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

interface ForgotPasswordFormProps {
    className?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    const handleSubmit = async (values: ForgotPasswordFormValues) => {
        try {
            setIsLoading(true);
            await resetPassword(values.email);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Error resetting password:", error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isSubmitted) {
        return (
            <Card className="w-[370px]">
                <CardHeader>
                    <CardTitle className="text-2xl">Check Your Email</CardTitle>
                    <CardDescription>
                        We&apos;ve sent a password reset link to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        If you don&apos;t see the email in your inbox, please check your spam folder.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-[370px]">
            <CardHeader>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="example@email.com"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button 
                            type="submit" 
                            className="w-full mt-4" 
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending Link..." : "Send Reset Link"}
                        </Button>
                    </form>
                </Form>
                
                <div className="mt-6 text-center text-sm">
                    Remember your password?{" "}
                    <Link 
                        href="/login" 
                        className="text-primary hover:underline underline-offset-4"
                    >
                        Back to Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default ForgotPasswordForm;