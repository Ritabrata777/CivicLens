
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { useToast } from "@/frontend/hooks/use-toast";
import { createIssueAction, type FormState } from "@/backend/server/actions";
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

export function IssueForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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

  const watchedCategory = form.watch("category");

  useEffect(() => {
    if (formState.message && form.formState.isSubmitSuccessful) {
      if (formState.success) {
        toast({
          title: "Success!",
          description: formState.message,
        });
        router.push(`/issues/${formState.issueId}`);
      } else {
        toast({
          title: "Error",
          description: formState.message,
          variant: "destructive",
        });
      }
    }
  }, [formState, router, toast, form.formState.isSubmitSuccessful]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, you would use a geocoding service to convert lat/lng to an address
                const { latitude, longitude } = position.coords;
                form.setValue("location", `approx. ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                setIsLocating(false);
                toast({ title: "Location Detected", description: "Approximate location has been filled in." });
            },
            () => {
                setIsLocating(false);
                toast({ title: "Error", description: "Unable to retrieve your location.", variant: "destructive" });
            }
        );
    } else {
        toast({ title: "Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    form.handleSubmit(() => {
      action(formData);
    })(e);
  };


  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="space-y-6"
      >
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
                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <LocateFixed className="h-4 w-4" />}
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
                  onChange={(e) => onChange(e.target.files?.[0] ?? undefined)}
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

        <div className="flex justify-end">
            <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
