import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderActions } from "./HeaderActions";
import { HeaderMobile } from "./HeaderMobile";
import { cookies } from "next/headers";

export async function Header() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');
  const isLoggedIn = !!sessionToken?.value;

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
            <Image src="/logo.png" alt="Civic Lens Logo" width={32} height={32} />
            <span className="font-headline">Civic Lens</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {/* Links removed as per request */}
          </nav>

          <div className="flex items-center gap-2">
            <HeaderActions isLoggedIn={isLoggedIn} />
            <ThemeToggle />
            <HeaderMobile />
          </div>
        </div>
      </div>
    </header>
  );
}
