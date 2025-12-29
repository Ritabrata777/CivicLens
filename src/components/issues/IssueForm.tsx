
"use client";

import { useActionState, useEffect, useState, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createIssueAction, type FormState } from "@/server/actions";
import { detectTrafficViolationAction } from "@/server/traffic-actions"; // Import new action
import { issueCategories } from "@/lib/types";
import { Loader2, LocateFixed } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.enum(issueCategories),
  otherCategory: z.string().optional(),
  location: z.string().min(5, "Location is required"),
  image: z.any().optional(),
  isUrgent: z.boolean().optional(),
}).refine(data => {
  if (data.category === 'Other') {
    return data.otherCategory && data.otherCategory.length > 3;
  }
  return true;
}, {
  message: "Please specify the category",
  path: ["otherCategory"],
});


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Submit Issue
    </Button>
  );
}

import { AuthModal } from "@/components/auth/AuthModal";

// ... other imports

interface IssueFormProps {
  isLoggedIn?: boolean;
}

export function IssueForm({ isLoggedIn = false }: IssueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzingTraffic, setIsAnalyzingTraffic] = useState(false); // New State
  const formRef = useRef<HTMLFormElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [trafficDetails, setTrafficDetails] = useState<{ plate?: string; types?: string[] }>({});

  const form = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Other",
      otherCategory: "",
      location: "",
      isUrgent: false,
    },
  });

  const [formState, action] = useActionState<FormState, FormData>(createIssueAction, {
    message: "",
    success: false,
  });

  useEffect(() => {
    if (formState.success) {
      toast({
        title: "Success!",
        description: formState.message || "Issue submitted successfully.",
      });
      // Small delay to allow toast to be seen? No, default toast behavior persists.
      router.push('/');
    } else if (formState.message && !formState.success && formState.message.length > 0) {
      toast({
        title: "Error",
        description: formState.message,
        variant: "destructive",
      });
    }
  }, [formState, toast, router]);

  const watchedCategory = form.watch("category");

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        try {
          const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
          if (apiKey) {
            const res = await fetch(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${apiKey}`);
            if (res.ok) {
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                form.setValue("location", data.features[0].place_name);
                toast({ title: "Location Found", description: "Address retrieved successfully." });
                setIsLocating(false);
                return;
              }
            }
          }
          // Fallback if no key or API fail
          form.setValue("location", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({ title: "Location Found", description: "Coordinates set (Address lookup failed)." });
        } catch (error) {
          console.error("Geocoding error:", error);
          form.setValue("location", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({ title: "Location Found", description: "Coordinates set (Address lookup failed)." });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        toast({
          title: "Error",
          description: "Unable to retrieve your location",
          variant: "destructive",
        });
        setIsLocating(false);
      }
    );
  };

  const [isPending, startTransition] = useTransition();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    const formData = new FormData(e.currentTarget);
    form.handleSubmit(() => {
      startTransition(() => {
        action(formData);
      });
    })(e);
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="space-y-6"
      >
        <input type="hidden" name="lat" value={coordinates?.lat ?? ''} />
        <input type="hidden" name="lat" value={coordinates?.lat ?? ''} />
        <input type="hidden" name="lng" value={coordinates?.lng ?? ''} />
        <input type="hidden" name="licensePlate" value={trafficDetails.plate ?? ''} />
        <input type="hidden" name="violationType" value={trafficDetails.types?.join(', ') ?? ''} />

        <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Large pothole on Elm Street" {...field} />
              </FormControl>
              <FormMessage>{formState.errors?.title}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide details about the issue, its impact, and how long it's been there." {...field} rows={5} />
              </FormControl>
              <FormMessage>{formState.errors?.description}</FormMessage>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                {/* Hidden input to ensure FormData captures the value */}
                <input type="hidden" name="category" value={field.value} />
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an issue category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {issueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{formState.errors?.category}</FormMessage>
              </FormItem>
            )}
          />

          {watchedCategory === 'Other' && (
            <FormField
              control={form.control}
              name="otherCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please Specify</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Broken park bench" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    <span className="sr-only">Get current location</span>
                  </Button>
                </div>
                <FormMessage>{formState.errors?.location}</FormMessage>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <FormItem>
              <FormLabel>Upload Photo/Video</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    onChange(file ?? undefined);

                    // Traffic AI Trigger
                    if (file && form.getValues('category') === 'Traffic Violation') {
                      setIsAnalyzingTraffic(true);
                      toast({ title: "AI Scanning...", description: "Checking for violations and license plate..." });

                      const formData = new FormData();
                      formData.append('image', file);

                      try {
                        // Dynamic import to avoid server-action issues if not fully set up? No, direct import is fine in Next.js 14
                        const result = await detectTrafficViolationAction(formData);
                        if (result.success && result.data) {
                          const { license_plate, violations, violation_detected } = result.data;

                          if (violation_detected) {
                            toast({ title: "Violation Detected!", description: `Found: ${violations.map(v => v.type).join(', ')}`, variant: "default" }); // "success" variant not default? default is fine.

                            // Auto-fill details
                            // Auto-fill details
                            if (license_plate) {
                              setTrafficDetails({ plate: license_plate, types: violations.map(v => v.type) }); // Save to state for hidden fields
                              form.setValue('title', `Traffic Violation: ${license_plate}`);
                              form.setValue('description', `Detected ${violations.length} violation(s).\nLicense Plate: ${license_plate}\nType: ${violations.map(v => v.type).join(', ')}`);
                              toast({ title: "Auto-Filled", description: "License plate and details added to form." });
                            } else {
                              setTrafficDetails({ types: violations.map(v => v.type) });
                              form.setValue('description', `Detected violation: ${violations.map(v => v.type).join(', ')}. Plate not clearly visible.`);
                            }
                          } else {
                            toast({ title: "No Violation Detected", description: "AI did not find a helmet violation.", variant: "destructive" });
                          }
                        } else {
                          console.error(result.message);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsAnalyzingTraffic(false);
                      }
                    }
                  }}
                  onBlur={onBlur}
                  name={name}
                />
              </FormControl>
              <FormDescription>A visual can help us address the issue faster.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isUrgent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  name={field.name}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Mark as Urgent
                </FormLabel>
                <FormDescription>
                  Check this if the issue requires immediate attention (e.g., safety hazard).
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Voter Identity Verification removed */}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
