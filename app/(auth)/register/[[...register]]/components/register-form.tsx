"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import EmailTab from "./email-tab";
import PhoneTab from "./phone-tab";

interface RegisterFormProps {
    className?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [authTab, setAuthTab] = useState<string>("email");

    const handleGoogleRegister = async () => {
        try {
            setIsLoading(true);
            const user = await signInWithGoogle();
            if (user) {
                router.push("/");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[370px]">
            <CardHeader>
                <CardTitle className="text-2xl">Register</CardTitle>
                <CardDescription>
                    Create a new account to get started
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="phone">Phone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="email">
                        <EmailTab 
                            isLoading={isLoading} 
                            setIsLoading={setIsLoading} 
                        />
                    </TabsContent>
                    
                    <TabsContent value="phone">
                        <PhoneTab 
                            isLoading={isLoading} 
                            setIsLoading={setIsLoading} 
                        />
                    </TabsContent>
                </Tabs>

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
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                >
                    <GoogleIcon className="w-4 h-4" />
                    {isLoading ? "Processing..." : "Register with Google"}
                </Button>

                <div className="mt-6 text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="hover:underline underline-offset-4">
                        Login
                    </Link>
                </div>
            </CardContent>
            <div id="recaptcha-container"></div>
        </Card>
    );
};

export default RegisterForm;