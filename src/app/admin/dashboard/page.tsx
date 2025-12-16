
import { getIssues } from "@/server/data";
import { IssueDataTable } from "./components/issue-data-table";
import { columns } from "./components/columns";

export default async function AdminDashboardPage() {
    const issues = await getIssues();

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-secondary/20 p-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 blur-2xl rounded-full" />
                <h1 className="text-3xl font-bold tracking-tight text-primary font-headline relative z-10">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-2 relative z-10 max-w-2xl">
                    Welcome to the command center. Manage community issues, verify outcomes, and oversee the decentralized governance process.
                </p>
            </div>
            <IssueDataTable columns={columns} data={issues} />
        </div>
    );
}
