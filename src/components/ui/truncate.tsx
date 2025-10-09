'use client';

import { Copy } from 'lucide-react';
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface TruncateProps {
  text: string;
  startChars?: number;
  endChars?: number;
  showCopy?: boolean;
}

export function Truncate({ text, startChars = 8, endChars = 8, showCopy = true }: TruncateProps) {
    const { toast } = useToast();
  if (!text) return null;

  const truncated = text.length > startChars + endChars
    ? `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`
    : text;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Copiado al portapapeles." });
  };
  
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-sm">{truncated}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {showCopy && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
