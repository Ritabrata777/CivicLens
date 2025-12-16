
import { getIssues } from "@/backend/server/data";
import { IssueDataTable } from "./components/issue-data-table";
import { columns } from "./components/columns";

export default async function AdminDashboardPage() {
    const issues = await getIssues();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage and track all community-submitted issues.
                </p>
            </div>
            <IssueDataTable columns={columns} data={issues} />
        </div>
    );
}
