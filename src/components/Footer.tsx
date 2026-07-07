import Link from 'next/link';


export default function Footer() {
  return (
    <footer className="bg-[#09101D] border-t border-[rgba(255,255,255,.08)]">
      <div className="container-main py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-[#F8FAFC]">
                Zenty<span className="text-[#7C3AED]">TV</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-[#94A3B8] leading-relaxed">
              Watch live TV channels, movies, sports, and news. Stream anytime, anywhere in stunning quality.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC] mb-4">Browse</h4>
            <ul className="space-y-3">
              <li><FooterLink href="/channels">Live TV</FooterLink></li>
              <li><FooterLink href="#">Movies</FooterLink></li>
              <li><FooterLink href="#">Sports</FooterLink></li>
              <li><FooterLink href="#">News</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC] mb-4">Support</h4>
            <ul className="space-y-3">
              <li><FooterLink href="#">Help Center</FooterLink></li>
              <li><FooterLink href="#">Contact Us</FooterLink></li>
              <li><FooterLink href="#">Devices</FooterLink></li>
              <li><FooterLink href="#">Account</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC] mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><FooterLink href="#">Privacy</FooterLink></li>
              <li><FooterLink href="#">Terms</FooterLink></li>
              <li><FooterLink href="#">Cookies</FooterLink></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,.08)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#94A3B8]">&copy; 2026 ZentyTV. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors duration-300">Twitter</a>
            <a href="#" className="text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors duration-300">GitHub</a>
            <a href="#" className="text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors duration-300">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors duration-300">
      {children}
    </Link>
  );
}
