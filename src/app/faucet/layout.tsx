import React from 'react';

export default function FaucetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">{children}</div>;
}
