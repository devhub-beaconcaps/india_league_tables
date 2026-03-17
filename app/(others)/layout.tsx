import ThemeWrapper from "@/components/ThemeWrapper";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ThemeWrapper>
      <div className="min-h-screen px-4 py-10 bg-[#EEF2F8] dark:bg-gray-950 transition-colors">
        <div className="w-full">
          {children}
        </div>
      </div>
    </ThemeWrapper>
  );
}