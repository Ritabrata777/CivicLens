import { IssueForm } from "@/frontend/components/issues/IssueForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";

export default function ReportIssuePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Report a New Issue</CardTitle>
          <CardDescription>
            Help improve your community by reporting problems. Please provide as much detail as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueForm />
        </CardContent>
      </Card>
    </div>
  );
}
