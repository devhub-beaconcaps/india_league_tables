import ThemeWrapper from "@/components/ThemeWrapper";


export default async function AuthLayout({ children }) {

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