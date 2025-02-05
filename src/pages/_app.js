import "@/styles/globals.css"; // Your Tailwind CSS file
import { Fredoka } from "@next/font/google";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import ReportIssueButton from '@/components/report-issue'; // Adjust the path as needed
import { Analytics } from "@vercel/analytics/react"


const fredoka = Fredoka({
  subsets: ["latin"], // Specify character subsets
  weight: ["300", "400", "500", "600", "700"], // Choose the weights you need
});

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <div className={fredoka.className}>
        <Component {...pageProps} />
        {/* Floating button (always visible) */}
        <ReportIssueButton/>
        <Analytics/>
      </div>
    </UserProvider>
  );
}
