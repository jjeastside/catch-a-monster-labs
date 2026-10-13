import { PageHeading } from "../components/page-heading";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "Privacy Policy — Cam Lab",
    description:
        "Learn how Cam Lab handles locally stored preferences, Index progress, shared builds, feedback, and third-party services.",
    alternates: {
        canonical: "https://jjeastside.github.io/catch-a-monster-labs/privacy/",
    },
};



function PolicySection({
    number,
    title,
    children,
}: {
    number: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="grid gap-3 border-b border-[#17355d] py-7 last:border-b-0 md:grid-cols-[3rem_1fr]">
            <span className="grid size-9 place-items-center rounded-full border border-[#285b94] bg-[#092446] text-xs font-black text-[#61adff]">
                {number}
            </span>
            <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-6 text-[#aebbd0]">{children}</div>
            </div>
        </section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#040b18] text-[#f4f7ff]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-[1050px] px-4 py-8 sm:px-6 sm:py-12">
                <header className="relative overflow-hidden rounded-2xl border border-[#1e4777] bg-[radial-gradient(circle_at_82%_18%,rgba(65,83,255,.2),transparent_22rem),linear-gradient(145deg,#081a34,#061126_60%,#081832)] px-6 py-9 shadow-2xl shadow-black/20 sm:px-10 sm:py-12">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,#3f64ff_1px,transparent_1px)] [background-size:72px_72px]"
                    />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                        <PageHeading title="Privacy Policy" image="/icons/attribute-resistance.png">Understand your data and <span className="text-[#64b1ff]">stay in control.</span></PageHeading>
                    </div>
                </header>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                        ["No accounts", "Cam Lab does not ask you to create an account."],
                        ["Local by default", "Progress and preferences stay in your browser."],
                        ["No data sales", "Cam Lab does not sell personal information."],
                    ].map(([title, description]) => (
                        <div key={title} className="rounded-xl border border-[#1c416e] bg-[#07162c] p-5">
                            <p className="font-bold text-[#66afff]">{title}</p>
                            <p className="mt-1.5 text-sm leading-5 text-[#a3b0c6]">{description}</p>
                        </div>
                    ))}
                </div>

                <article className="mt-5 rounded-2xl border border-[#1d426f] bg-[#061329]/90 px-5 sm:px-8">
                    <div className="border-b border-[#17355d] py-6 text-sm text-[#95a5bd]">
                        <strong className="text-white">Effective date:</strong> September 2, 2026
                    </div>

                    <PolicySection number="1" title="Information Cam Lab does not request">
                        <p>
                            Cam Lab does not provide user accounts or require your name, email address, payment information, Roblox credentials, or other direct personal identifiers. The feedback form includes an optional Discord username field only for visitors who want a reply.
                        </p>
                        <p>
                            Please never enter passwords, account credentials, or sensitive personal information into build names, notes, imported files, or any other Cam Lab field.
                        </p>
                    </PolicySection>

                    <PolicySection number="2" title="Information stored on your device">
                        <p>
                            Cam Lab uses your browser&apos;s local storage to remember features such as Index Tracker progress, saved and active builds, favorite monsters, achievement selections, account multipliers, and related calculator preferences.
                        </p>
                        <p>
                            This information normally stays on your device and is not automatically sent to Cam Lab. You can remove it by using Cam Lab&apos;s clear controls where available or by clearing this site&apos;s stored data in your browser.
                        </p>
                    </PolicySection>

                    <PolicySection number="3" title="Build sharing">
                        <p>
                            When you choose to share a build, Cam Lab creates an encoded build link. To create a shorter link and rich preview, the encoded build configuration and preview details—such as monster name, rarity, element, calculated damage, health, critical stats, and image path—are sent to the Cam Lab sharing service hosted through Cloudflare.
                        </p>
                        <p>
                            Anyone with a shared link may be able to view and reproduce that build. Treat shared build information as public and remove anything you do not want others to see before sharing.
                        </p>
                    </PolicySection>

                    <PolicySection number="4" title="Feedback submissions">
                        <p>
                            When you send feedback, Cam Lab sends the selected category, your message, the current page, the Cam Lab version, browser information, and any optional Discord username you provide to the Cam Lab feedback service hosted through Cloudflare. Cloudflare Turnstile also processes technical information needed to detect automated abuse.
                        </p>
                        <p>
                            Accepted feedback is published as a public issue in the Cam Lab GitHub repository by the Cam Lab Feedback bot. Do not include passwords, private account details, or anything you do not want publicly visible. Providing a Discord username is optional and does not guarantee a response.
                        </p>
                    </PolicySection>

                    <PolicySection number="5" title="Hosting and technical information">
                        <p>
                            Cam Lab is published through GitHub Pages and uses Cloudflare for share links, feedback delivery, and abuse protection. GitHub, Cloudflare, and normal internet infrastructure may process limited technical information needed to deliver and secure these services, such as IP addresses, request details, browser or device information, and diagnostic logs. Cam Lab does not intentionally use this information to identify visitors or include it in public GitHub feedback issues.
                        </p>
                        <p>
                            Learn more in the{" "}
                            <a
                                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#63afff] underline decoration-[#315f91] underline-offset-4 hover:text-[#9bd0ff]"
                            >
                                GitHub Privacy Statement
                            </a>{" "}
                            and{" "}
                            <a
                                href="https://www.cloudflare.com/privacypolicy/"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#63afff] underline decoration-[#315f91] underline-offset-4 hover:text-[#9bd0ff]"
                            >
                                Cloudflare Privacy Policy
                            </a>.
                        </p>
                    </PolicySection>

                    <PolicySection number="6" title="Cookies and analytics">
                        <p>
                            Cam Lab does not currently operate its own advertising cookies or third-party behavioral analytics. Hosting and sharing providers may use cookies or similar technologies according to their own policies when necessary to provide, protect, or measure their services.
                        </p>
                    </PolicySection>

                    <PolicySection number="7" title="Third-party links">
                        <p>
                            Cam Lab may link to GitHub, Roblox, Discord, and other third-party websites. Visiting those services is governed by their own terms and privacy practices. A link from Cam Lab does not mean Cam Lab controls or endorses how another service handles information.
                        </p>
                    </PolicySection>

                    <PolicySection number="8" title="Children's privacy">
                        <p>
                            Cam Lab is a general fan-made reference tool and does not knowingly collect personal information from children. If you believe personal information has been submitted through a Cam Lab service, please contact the project so it can be reviewed.
                        </p>
                    </PolicySection>

                    <PolicySection number="9" title="Changes to this policy">
                        <p>
                            This policy may be updated when Cam Lab adds features, changes service providers, or changes how information is handled. The effective date at the top of this page will be updated when material changes are made.
                        </p>
                    </PolicySection>

                    <PolicySection number="10" title="Contact">
                        <p>
                            For privacy questions or requests related to Cam Lab, use the site&apos;s feedback form and select General feedback. The resulting issue is public, so do not include passwords or other sensitive information.
                        </p>
                        <Link
                            href="#feedback"
                            className="mt-1 inline-flex rounded-lg border border-[#2b659f] bg-[#09294d] px-4 py-2 text-sm font-bold text-[#6db5ff] transition hover:border-[#4b8fd1] hover:bg-[#0b335e] hover:text-white"
                        >
                            Contact Cam Lab →
                        </Link>
                    </PolicySection>
                </article>
            </main>

            <SiteFooter />
        </div>
    );
}
