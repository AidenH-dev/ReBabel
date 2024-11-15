import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Learn() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /learn/translate when this page loads
    router.replace("/learn/translate");
  }, [router]);

  return null; // This page itself won't render anything
}
