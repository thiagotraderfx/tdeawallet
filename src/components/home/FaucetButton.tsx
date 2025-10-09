'use client';

import Link from 'next/link';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FaucetButton() {
  return (
    <Link href="/faucet" passHref>
      <Button
        variant="outline"
        className="w-full h-full p-6 flex items-start text-left gap-4 transition-all hover:bg-accent hover:text-accent-foreground"
      >
        <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
          <Droplets className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-start">
            <h3 className="text-lg font-bold">Dispensador (Faucet)</h3>
            <p className="text-sm text-muted-foreground text-left">Obtén tokens de prueba para la TestNet de Algorand.</p>
        </div>
      </Button>
    </Link>
  );
}
