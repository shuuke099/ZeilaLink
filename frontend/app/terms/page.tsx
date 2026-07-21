import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Use | ZeilaLink",
  description: "Terms governing use of the ZeilaLink platform.",
};

const sectionClass = "space-y-3";
const headingClass = "text-xl font-black text-heading";
const paragraphClass = "text-sm leading-7 text-muted sm:text-base";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            ZeilaLink legal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-heading sm:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-4 text-sm text-muted">Last updated: July 20, 2026</p>
        </header>

        <div className="mt-10 space-y-10 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
          <section className={sectionClass}>
            <h2 className={headingClass}>Using ZeilaLink</h2>
            <p className={paragraphClass}>
              By creating an account or using ZeilaLink, you agree to these terms and our Privacy Policy. You must provide accurate information, keep your account secure, and use only roles and features you are authorized to use.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Jobs, training, and services</h2>
            <p className={paragraphClass}>
              Employers, training providers, service providers, applicants, and customers are responsible for their listings, qualifications, communications, and decisions. ZeilaLink provides the platform but does not guarantee employment, enrollment, service outcomes, earnings, or the accuracy of third-party content.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Acceptable use</h2>
            <p className={paragraphClass}>
              You may not impersonate others, publish fraudulent or discriminatory content, harass users, upload malware, probe security controls, scrape the platform without permission, misuse personal information, or use ZeilaLink for unlawful activity.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Your content</h2>
            <p className={paragraphClass}>
              You retain ownership of content you submit. You give ZeilaLink permission to store, process, and display it only as needed to operate and improve the platform. You must have the right to submit that content and must not expose confidential information unnecessarily.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Payments and external services</h2>
            <p className={paragraphClass}>
              Payments may be handled by an independent payment provider and are also subject to that provider&apos;s terms. Links to external websites or messaging services are provided for convenience; their own policies apply when you leave ZeilaLink.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Suspension and changes</h2>
            <p className={paragraphClass}>
              We may restrict or suspend accounts to protect users, investigate abuse, comply with law, or enforce these terms. We may update the service or these terms and will post the revised date on this page.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Contact</h2>
            <p className={paragraphClass}>
              Questions about these terms can be sent to{" "}
              <a className="font-bold text-primary hover:underline" href="mailto:contact@zeilalink.com">
                contact@zeilalink.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
