import { IssueForm } from "@/components/issues/IssueForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { redirect } from "next/navigation";
import { isUserLoggedIn } from "@/lib/auth-server";

// ... existing imports

export default async function ReportIssuePage() {
  const isLoggedIn = await isUserLoggedIn();

  if (!isLoggedIn) {
    redirect("/login?next=/report");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        {/* ... */}
        <CardContent>
          <IssueForm isLoggedIn={isLoggedIn} />
        </CardContent>
      </Card>
    </div>
  );
}
