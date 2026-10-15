"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const CONTACT_EMAIL = "jjeastside711@gmail.com";
const OPEN_CONTACT_EVENT = "cam-lab:open-contact";

const concernOptions = [
    { value: "privacy", label: "Privacy or personal information" },
    { value: "safety", label: "Safety or inappropriate content" },
    { value: "site", label: "Website concern" },
    { value: "other", label: "Other / general question" },
] as const;

type ConcernCategory = (typeof concernOptions)[number]["value"];

/** Contact is handled by the visitor's email app, not the public feedback Worker. */
export function ContactWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState<ConcernCategory>("privacy");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [includePage, setIncludePage] = useState(false);
    const [draftOpened, setDraftOpened] = useState(false);
    const [copyStatus, setCopyStatus] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const openContact = useCallback(() => {
        previousFocusRef.current = document.activeElement as HTMLElement | null;
        setCopyStatus("");
        setDraftOpened(false);
        setIsOpen(true);
    }, []);

    const closeContact = useCallback(() => {
        setIsOpen(false);
        previousFocusRef.current?.focus();
    }, []);

    useEffect(() => {
        window.addEventListener(OPEN_CONTACT_EVENT, openContact);
        return () => window.removeEventListener(OPEN_CONTACT_EVENT, openContact);
    }, [openContact]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        modalRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeContact();
                return;
            }
            if (event.key !== "Tab" || !modalRef.current) return;

            const focusable = Array.from(
                modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
                ),
            );
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeContact, isOpen]);

    const selectedCategory = concernOptions.find((option) => option.value === category)?.label ?? "Other / general question";
    const mailSubject = `[Cam Lab Contact] ${selectedCategory} — ${subject.trim()}`;
    const mailBody = [
        "Hello Cam Lab,",
        "",
        message.trim(),
        ...(includePage && typeof window !== "undefined"
            ? ["", `Page: ${window.location.origin}${window.location.pathname}`]
            : []),
        "",
        "Sent using Cam Lab's contact form.",
    ].join("\n");
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

    const openEmailDraft = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (subject.trim().length < 3 || message.trim().length < 10) return;
        setCopyStatus("");
        setDraftOpened(true);
        // This opens a mail composer; sending still requires action in the email app.
        window.location.href = mailtoUrl;
    };

    const copyDraft = async () => {
        try {
            await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\nSubject: ${mailSubject}\n\n${mailBody}`);
            setCopyStatus("Copied! Paste this into an email to Cam Lab.");
        } catch {
            setCopyStatus("Copy was blocked. You can still select your message and email the address above.");
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[125] grid place-items-center overflow-y-auto bg-[#020713]/80 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeContact();
            }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="contact-title"
                aria-describedby="contact-description"
                tabIndex={-1}
                className="relative my-auto w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#334d83] bg-[#111d3f] shadow-[0_22px_70px_rgba(0,0,0,0.62)] outline-none"
            >
                <div className="max-h-[calc(100vh-24px)] overflow-y-auto p-5 sm:max-h-[calc(100vh-40px)] sm:p-6">
                    <button
                        type="button"
                        onClick={closeContact}
                        aria-label="Close contact dialog"
                        className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-xl text-[#9ca9c6] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]"
                    >
                        ×
                    </button>

                    <div className="pr-10">
                        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-[#315b9b] bg-[#122f61] text-[#8cc5ff]">
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="m4 7 8 6 8-6" />
                            </svg>
                        </div>
                        <h2 id="contact-title" className="text-xl font-black tracking-tight text-white">
                            Contact Cam Lab
                        </h2>
                        <p id="contact-description" className="mt-1 text-sm leading-5 text-[#aebbd8]">
                            Have a private concern or question? Prepare an email directly to the Cam Lab developer.
                        </p>
                    </div>

                    {draftOpened ? (
                        <div className="mt-5 space-y-4">
                            <div className="rounded-xl border border-[#315b9b] bg-[#0a2348] p-4">
                                <h3 className="text-base font-bold text-white">Your email draft is ready</h3>
                                <p className="mt-2 text-sm leading-6 text-[#b9c9e5]">
                                    Your email app should have opened with the message. <strong className="text-white">It has not been sent by Cam Lab.</strong> Please press Send in your email app to finish.
                                </p>
                            </div>
                            <a
                                href={mailtoUrl}
                                className="block rounded-lg bg-[#2d7add] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#388cf4]"
                            >
                                Open email draft again ↗
                            </a>
                            <button
                                type="button"
                                onClick={copyDraft}
                                className="w-full rounded-lg border border-[#38527e] bg-[#152c54] px-4 py-2.5 text-sm font-bold text-[#dceaff] transition hover:bg-[#1d3867]"
                            >
                                Copy email instead
                            </button>
                            {copyStatus && <p role="status" className="text-center text-xs text-[#9fc6ff]">{copyStatus}</p>}
                            <button
                                type="button"
                                onClick={() => setDraftOpened(false)}
                                className="w-full text-center text-sm font-semibold text-[#9eafd2] underline underline-offset-4 hover:text-white"
                            >
                                Edit your message
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mt-5 rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-3 text-xs leading-5 text-[#aab8d3]">
                                Unlike feedback, this <strong className="text-white">does not create a public GitHub issue</strong>. Your email app handles sending the message.
                            </div>

                            <form onSubmit={openEmailDraft} className="mt-5 space-y-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-[#dbe3f7]">Concern type</span>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value as ConcernCategory)}
                                        className="mt-2 w-full rounded-lg border border-[#425f9c] bg-[#101c42] px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                    >
                                        {concernOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-[#dbe3f7]">Subject</span>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value.slice(0, 100))}
                                        maxLength={100}
                                        minLength={3}
                                        required
                                        placeholder="Briefly describe your concern"
                                        className="mt-2 w-full rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#69789d] focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-[#dbe3f7]">Your message <span className="font-normal text-[#8f9dbc]">(minimum 10 characters)</span></span>
                                    <textarea
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value.slice(0, 1200))}
                                        minLength={10}
                                        maxLength={1200}
                                        rows={5}
                                        required
                                        placeholder="Describe what happened and what you'd like us to know..."
                                        className="mt-2 w-full resize-y rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-3 text-sm leading-5 text-white outline-none placeholder:text-[#69789d] focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                    />
                                    <span className="mt-1 block text-right text-xs text-[#8f9dbc]">{message.length}/1200 characters</span>
                                </label>
                                <label className="flex items-center gap-2.5 text-xs leading-5 text-[#b3bfd9]">
                                    <input
                                        type="checkbox"
                                        checked={includePage}
                                        onChange={(event) => setIncludePage(event.target.checked)}
                                        className="size-4 rounded accent-[#56a3ff]"
                                    />
                                    Include current page address in the email
                                </label>
                                <div className="rounded-lg border border-[#263c67] bg-[#0b1532] px-3 py-2 text-xs text-[#a5b6d6]">
                                    To: <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#72b7ff] hover:underline">{CONTACT_EMAIL}</a>
                                </div>
                                <button
                                    type="submit"
                                    disabled={subject.trim().length < 3 || message.trim().length < 10}
                                    className="w-full rounded-lg bg-[#2d7add] px-4 py-3 text-sm font-black text-white transition hover:bg-[#388cf4] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    Open email draft ↗
                                </button>
                                <p className="text-center text-[11px] leading-4 text-[#8f9dbc]">
                                    This opens your email application; you must send the draft there. No message is submitted to Cam Lab by this form.
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
