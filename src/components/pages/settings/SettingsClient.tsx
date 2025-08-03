
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
import { Textarea } from "@/components/ui/textarea";
import { CompanyProfile } from "@/lib/definitions";
import { useEffect, useState } from "react";
import Image from "next/image";
import { resizeImage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().nullable().optional(),
  invoicePrefix: z.string().optional(),
  invoiceFooterMessage: z.string().optional(),
});

interface SettingsClientProps {
    companyProfile: CompanyProfile | null;
    handleSaveProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
}

export function SettingsClient({ companyProfile, handleSaveProfile }: SettingsClientProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      logo: null,
      invoicePrefix: "",
      invoiceFooterMessage: ""
    },
  });

  useEffect(() => {
    if (companyProfile) {
      form.reset(companyProfile);
      setImagePreview(companyProfile.logo);
    }
  }, [companyProfile, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = await resizeImage(file, 200, 200);
      setImagePreview(preview);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    const dataToSave = { ...values, logo: imagePreview };
    await handleSaveProfile(dataToSave);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Profil de l'entreprise</CardTitle>
              <CardDescription>Gérez les informations de votre entreprise qui apparaissent sur les factures et reçus.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-2 text-center">
                             <Image 
                                src={imagePreview || "https://placehold.co/200x200.png"} 
                                alt="Logo" 
                                width={150} 
                                height={150} 
                                className="mx-auto rounded-full object-cover aspect-square border"
                                data-ai-hint="logo"
                            />
                            <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} className="text-xs"/>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                    <FormLabel>Nom de l'entreprise</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Votre Entreprise" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+221 77 123 45 67" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="invoicePrefix"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Préfixe Facture</FormLabel>
                                    <FormControl>
                                        <Input placeholder="FAC-" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                              <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                    <FormLabel>Adresse</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Adresse de l'entreprise" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="invoiceFooterMessage"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                    <FormLabel>Message pied de page</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Message à afficher en bas des factures" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Enregistrer les modifications</Button>
                    </div>
                </form>
            </Form>
          </CardContent>
      </Card>
      
    </div>
  );
}
