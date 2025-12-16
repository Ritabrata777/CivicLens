import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function CreateAccountPage() {
  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex justify-center items-center gap-2 mb-6">
            <ShieldCheck className="w-8 h-8 text-primary"/>
            <h1 className="text-3xl font-bold font-headline text-primary">Create Your Account</h1>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Join Civic Lens</CardTitle>
          <CardDescription>
            Become a part of the community and start making a difference today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
