'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { SplitChars } from './Split';

type Props = { text: string; className?: string; as?: 'h2' | 'h3' };

/** Characters rise out of a mask, slightly rotated, when the heading enters view. */
export default function RevealHeading({ text, className, as = 'h2' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      gsap.from(ref.current!.querySelectorAll('.char'), {
        yPercent: 120,
        rotate: 10,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.022,
        scrollTrigger: { trigger: ref.current, start: 'top 88%' },
      });
    },
    { scope: ref },
  );
  const Tag = as;
  return (
    <Tag ref={ref} className={className}>
      <SplitChars text={text} />
    </Tag>
  );
}
