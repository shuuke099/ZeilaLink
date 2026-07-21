import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | ZeilaLink",
  description: "How ZeilaLink collects, uses, and protects personal information.",
};

const sectionClass = "space-y-3";
const headingClass = "text-xl font-black text-heading";
const listClass = "list-disc space-y-2 pl-5 text-sm leading-7 text-muted sm:text-base";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            ZeilaLink legal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-heading sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted">Last updated: July 20, 2026</p>
        </header>

        <div className="mt-10 space-y-10 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
          <section className={sectionClass}>
            <h2 className={headingClass}>Information we collect</h2>
            <ul className={listClass}>
              <li>Account and contact details, including your name, email address, phone number, and role.</li>
              <li>Profile, resume, application, employer, provider, training, and service-booking information you submit.</li>
              <li>Support and assistant messages, device information, and basic service activity needed to operate and secure the platform.</li>
              <li>Payment status and transaction references from payment providers. ZeilaLink does not store complete payment-card details.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>How we use information</h2>
            <ul className={listClass}>
              <li>Provide accounts, job applications, training, services, bookings, and customer support.</li>
              <li>Verify users and organizations, prevent abuse, protect the platform, and meet legal obligations.</li>
              <li>Communicate service updates and improve the reliability and usefulness of ZeilaLink.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>When information is shared</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              We share information only as needed with the employers, applicants, providers, or customers involved in a transaction; with vendors that provide hosting, email, payments, storage, or assistant services; or when required to protect users, enforce our terms, or comply with law. We do not sell personal information.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Retention and security</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              We retain information only while it is needed for the platform, legal obligations, dispute resolution, and security. We use administrative and technical safeguards, but no online service can guarantee absolute security. Please report suspected account misuse promptly.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Your choices</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              You may update available profile information in your account and ask to access, correct, or delete personal information, subject to legal and operational retention requirements.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Contact</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              Privacy questions and requests can be sent to{" "}
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
