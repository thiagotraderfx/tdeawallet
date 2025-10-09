'use client';

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WalletClient = dynamic(() => import("@tdea/wallet"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md mx-auto">
            <Skeleton className="h-[450px] w-full" />
        </div>
    </div>
  ),
});

export default function WalletPage() {
  return <WalletClient />;
}
