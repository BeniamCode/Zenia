import type { SVGProps } from 'react';
import { Leaf } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  // Ensuring the logo is accessible and has a semantic meaning if it acts as one.
  // If it's purely decorative within a link that has text, aria-hidden might be suitable.
  // For now, assuming it can be part of a link that might not have other text (e.g. icon-only link to home).
  return <Leaf {...props} role="img" aria-label="Nutrition Navigator Logo" />;
}
