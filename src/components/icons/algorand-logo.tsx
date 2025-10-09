import type { SVGProps } from 'react';

export function AlgorandLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11.93 2.003L3 7.833V17.5l8.93 5.5 9.07-5.5V7.833L11.93 2.003z" />
      <path d="M12 7l5 3-5 3-5-3 5-3z" />
      <path d="M12 13v7" />
    </svg>
  );
}
