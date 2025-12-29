import { } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card/50 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-primary/80">

            <span className="font-headline">Civic Lens</span>
          </div>
          <p className="mt-4 md:mt-0">&copy; {new Date().getFullYear()} Civic Lens. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
