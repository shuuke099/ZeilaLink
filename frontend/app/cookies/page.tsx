import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cookie Policy | ZeilaLink",
  description: "How ZeilaLink uses cookies and browser storage.",
};

const headingClass = "text-xl font-black text-heading";
const paragraphClass = "text-sm leading-7 text-muted sm:text-base";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            ZeilaLink legal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-heading sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-sm text-muted">Last updated: July 20, 2026</p>
        </header>

        <div className="mt-10 space-y-10 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
          <section className="space-y-3">
            <h2 className={headingClass}>What we use</h2>
            <p className={paragraphClass}>
              ZeilaLink uses cookies and similar browser storage that are necessary to remember your language and theme, maintain account sessions, protect the service, and retain limited assistant history on your device.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={headingClass}>Storage categories</h2>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-background-muted text-heading">
                  <tr>
                    <th className="px-4 py-3 font-black">Category</th>
                    <th className="px-4 py-3 font-black">Purpose</th>
                    <th className="px-4 py-3 font-black">Typical duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted">
                  <tr>
                    <td className="px-4 py-3 font-bold text-heading">Language</td>
                    <td className="px-4 py-3">Remembers English or Somali.</td>
                    <td className="px-4 py-3">Up to one year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-heading">Theme</td>
                    <td className="px-4 py-3">Remembers light or dark display preferences.</td>
                    <td className="px-4 py-3">Until cleared</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-heading">Session and security</td>
                    <td className="px-4 py-3">Keeps you signed in and helps protect requests.</td>
                    <td className="px-4 py-3">Session or limited duration</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-heading">Assistant history</td>
                    <td className="px-4 py-3">Keeps recent assistant messages on your device.</td>
                    <td className="px-4 py-3">Until cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Third-party services</h2>
            <p className={paragraphClass}>
              Payment, messaging, and other external services may set their own cookies after you choose to visit them. Their policies apply on their websites. ZeilaLink does not currently use advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Your controls</h2>
            <p className={paragraphClass}>
              Browser settings let you inspect, block, or delete cookies and local storage. Blocking necessary storage may sign you out or prevent language, theme, and assistant preferences from working correctly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Contact</h2>
            <p className={paragraphClass}>
              Questions about browser storage can be sent to{" "}
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
