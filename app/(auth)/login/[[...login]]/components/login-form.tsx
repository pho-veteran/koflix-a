"use client"

import { z } from "zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/auth";
import toast from "react-hot-toast";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { GoogleIcon } from "@/components/icons/google-icon";

const formSchema = z.object({
    emailOrPhone: z.string().refine((value) => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phonePattern = /^(\+\d{1,3}[- ]?)?\d{10,14}$/;

        return emailPattern.test(value) || phonePattern.test(value);
    }, {
        message: "Please enter a valid email address or phone number",
    }),
    password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

type LoginFormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
    className?: string;
}

const LoginForm: React.FC<LoginFormProps> = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/';
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            emailOrPhone: "",
            password: "",
        },
    });

    const handleLogin = async (values: LoginFormValues) => {
        try {
            setIsLoading(true);
            const { emailOrPhone, password } = values;
            
            // Determine if input is email or phone
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const isEmail = emailPattern.test(emailOrPhone);
            
            if (isEmail) {
                // Email login
                const user = await signIn(emailOrPhone, password);
                if (user) {
                    router.push(decodeURIComponent(from));
                }
            } else {
                // Phone login is not supported in this form
                toast.error("Phone login is not supported in this form. Please use email.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const user = await signInWithGoogle();
            if (user) {
                router.push(decodeURIComponent(from));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[370px]">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Welcome back! Enter your credentials to continue
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="emailOrPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email or Phone Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="text"
                                            placeholder="example@email.com or +1234567890"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link 
                                            href="/forgot-password" 
                                            className="text-xs text-muted-foreground hover:text-primary"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
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
                            className="w-full mt-4" 
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </Form>
                
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <GoogleIcon className="w-4 h-4" />
                    {isLoading ? "Processing..." : "Login with Google"}
                </Button>

                <div className="mt-6 text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link 
                        href="/register" 
                        className="text-primary hover:underline underline-offset-4"
                    >
                        Sign up
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};

export default LoginForm;