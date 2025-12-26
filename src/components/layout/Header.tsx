import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderActions } from "./HeaderActions";
import { cookies } from "next/headers";
import FontCivicLens from "../ui/header-civicLens";
import { DropdownMobileHeader } from "./DropdownMobileHeader";
import AdminPortalButton from "../admin/AdminPortalButton";

export async function Header() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');
  const isLoggedIn = !!sessionToken?.value;

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-10">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
            <Image src="/logo.png" alt="Civic Lens Logo" width={40} height={40} />
            <div className="w-[10ch] sm:w-[12ch] md:w-[14ch]">
              <FontCivicLens />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <HeaderActions isLoggedIn={isLoggedIn} />
            <AdminPortalButton />
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <DropdownMobileHeader />
            
          </div>
        </div>
      </div>
    </header>
  );
}
