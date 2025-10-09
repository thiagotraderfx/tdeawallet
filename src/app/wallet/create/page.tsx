'use client';

import { CreateWalletView } from '@tdea/wallet';
import { useRouter } from 'next/navigation';

export default function CreateWalletPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <CreateWalletView
            onWalletCreated={() => router.push('/wallet')}
            onBack={() => router.push('/wallet')}
        />
    </div>
  );
}
