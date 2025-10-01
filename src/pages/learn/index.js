import { useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Learn() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /learn/translate when this page loads
    router.replace("/learn/dashboard");
  }, [router]);

  return null; // This page itself won't render anything
}

export const getServerSideProps = withPageAuthRequired();
