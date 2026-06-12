import Link from 'next/link';

import WardMark from '@/components/WardMark';
import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

const resourceLinks = [
  { label: 'Developer docs', href: '/docs' },
  { label: 'Protocol spec', href: '/spec' },
  { label: 'Assurance', href: '/assurance' },
  { label: 'GitHub', href: 'https://github.com/wflores9/ward-protocol', external: true },
];

const companyLinks = [
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Conformance', href: '/conformance' },
  { label: 'Certified', href: '/certified' },
  { label: 'Privacy', href: '/privacy' },
];

function FooterLink({ link }: { link: { label: string; href: string; external?: boolean } }) {
  if (link.external) {
    return <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>;
  }
  return <Link href={link.href}>{link.label}</Link>;
}

export default function Footer() {
  return (
    <footer className="premium-footer">
      <div className="site-container py-14 md:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <Link href="/" className="premium-brand premium-brand-footer" aria-label="Ward Protocol home">
              <WardMark size={48} shape="square" />
              <div>
                <strong>Ward</strong>
                <span>Protocol</span>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#91a8bd]">
              Conformance and deterministic default-resolution infrastructure for institutional tokenized credit.
            </p>
            <p className="mt-5 font-mono text-xs font-bold text-[#d5b75f]">ward_signed = False - always</p>
          </div>

          <div className="premium-footer-col">
            <p>Navigation</p>
            {SITE_NAVIGATION.map((link) => <FooterLink key={link.href} link={link} />)}
          </div>

          <div className="premium-footer-col">
            <p>Resources</p>
            {resourceLinks.map((link) => <FooterLink key={link.href} link={link} />)}
          </div>

          <div className="premium-footer-col">
            <p>Company</p>
            {companyLinks.map((link) => <FooterLink key={link.href} link={link} />)}
            <a href={PILOT_URL} target="_blank" rel="noopener noreferrer">Discuss a pilot</a>
          </div>
        </div>

        <div className="premium-footer-bottom">
          <span>© 2026 Ward Labs LLC</span>
          <span>XLS-65/XLS-66 mainnet readiness tracked as dependency</span>
        </div>
      </div>
    </footer>
  );
}
