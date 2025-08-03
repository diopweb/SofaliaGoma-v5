
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.37 1.62-4.1 1.62-4.87 0-8.84-3.97-8.84-8.84s3.97-8.84 8.84-8.84c2.6 0 4.52.99 5.92 2.32l2.4-2.4C18.62.9 15.9.01 12.48.01 5.61.01 0 5.62 0 12.5s5.61 12.48 12.48 12.48c7.1 0 12.28-4.87 12.28-12.5 0-.76-.07-1.5-.2-2.22h-12.1z" />
    </svg>
);


export default function LoginPage() {
  const { login, loginWithGoogle, error, loading } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    await login(values.email, values.password);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
         <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground mb-2">
            <Flame className="text-primary h-8 w-8" />
            <span className="font-headline">SwiftSale</span>
        </div>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte pour continuer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} />
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
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={loginWithGoogle} disabled={loading}>
          <GoogleIcon className="mr-2 h-5 w-5 fill-current" />
          Google
        </Button>
      </CardContent>
    </Card>
  );
}

