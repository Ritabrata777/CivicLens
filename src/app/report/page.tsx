import { IssueForm } from "@/components/issues/IssueForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { isUserLoggedIn } from "@/lib/auth-server";

// ... existing imports

export default async function ReportIssuePage() {
  const isLoggedIn = await isUserLoggedIn();

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
