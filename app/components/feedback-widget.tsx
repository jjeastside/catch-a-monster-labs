"use client";

import Script from "next/script";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const FEEDBACK_ENDPOINT =
    "https://cam-lab-feedback.camlab.workers.dev/feedback";
const TURNSTILE_SITE_KEY = "0x4AAAAAAEkgz3D6dd8N1N0R";
const OPEN_FEEDBACK_EVENT = "cam-lab:open-feedback";

const categoryOptions = [
    { value: "feature", label: "Feature — something I want" },
    { value: "bug", label: "Bug — something is broken" },
    { value: "data", label: "Data correction — something is inaccurate" },
    { value: "general", label: "General feedback" },
] as const;

type FeedbackCategory = (typeof categoryOptions)[number]["value"];

type TurnstileApi = {
    render: (
        container: HTMLElement,
        options: {
            sitekey: string;
            action: string;
            theme: "dark";
            callback: (token: string) => void;
            "expired-callback": () => void;
            "error-callback": (errorCode: string) => boolean;
        },
    ) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

function isFeedbackCategory(value: unknown): value is FeedbackCategory {
    return categoryOptions.some((option) => option.value === value);
}

function currentPageContext() {
    const shareHash = window.location.hash.startsWith("#b=")
        ? ""
        : window.location.hash;

    return `${window.location.pathname}${window.location.search}${shareHash}`;
}

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState<FeedbackCategory>("feature");
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState("");
    const [scriptReady, setScriptReady] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [createdIssue, setCreatedIssue] = useState<{
        number: number;
        url: string;
    } | null>(null);
    const turnstileContainerRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const openFeedback = useCallback(
        (nextCategory?: FeedbackCategory) => {
            if (nextCategory) setCategory(nextCategory);
            if (createdIssue) {
                setMessage("");
                setContact("");
                setCreatedIssue(null);
            }
            setErrorMessage("");
            setIsOpen(true);
        },
        [createdIssue],
    );

    useEffect(() => {
        const handleOpenFeedback = (event: Event) => {
            const requestedCategory = (
                event as CustomEvent<{ category?: unknown }>
            ).detail?.category;

            openFeedback(
                isFeedbackCategory(requestedCategory)
                    ? requestedCategory
                    : undefined,
            );
        };
        const handleHashChange = () => {
            if (window.location.hash === "#feedback") openFeedback();
        };

        window.addEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();

        return () => {
            window.removeEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [openFeedback]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        modalRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (
            !isOpen ||
            createdIssue ||
            !scriptReady ||
            !window.turnstile ||
            !turnstileContainerRef.current
        ) {
            return;
        }

        turnstileWidgetIdRef.current = window.turnstile.render(
            turnstileContainerRef.current,
            {
                sitekey: TURNSTILE_SITE_KEY,
                action: "feedback",
                theme: "dark",
                callback: (token) => {
                    setTurnstileToken(token);
                    setErrorMessage("");
                },
                "expired-callback": () => setTurnstileToken(""),
                "error-callback": (errorCode) => {
                    setTurnstileToken("");
                    setErrorMessage(
                        `Human verification could not load (code ${errorCode}). Please try again.`,
                    );
                    return true;
                },
            },
        );

        return () => {
            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
            setTurnstileToken("");
        };
    }, [createdIssue, isOpen, scriptReady]);

    const resetTurnstile = () => {
        setTurnstileToken("");
        if (turnstileWidgetIdRef.current && window.turnstile) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }
    };

    const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (message.trim().length < 10 || !turnstileToken || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await fetch(FEEDBACK_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    message: message.trim(),
                    contact: contact.trim(),
                    turnstileToken,
                    page: currentPageContext(),
                    version: "1.0.8",
                    browser: navigator.userAgent,
                }),
            });
            const result = (await response.json().catch(() => null)) as {
                error?: string;
                issueNumber?: number;
                issueUrl?: string;
            } | null;

            if (
                !response.ok ||
                !result?.issueUrl ||
                typeof result.issueNumber !== "number"
            ) {
                setErrorMessage(
                    result?.error ||
                        "Feedback could not be submitted. Please try again.",
                );
                resetTurnstile();
                return;
            }

            setCreatedIssue({
                number: result.issueNumber,
                url: result.issueUrl,
            });
        } catch {
            setErrorMessage(
                "Cam Lab could not reach the feedback service. Please try again.",
            );
            resetTurnstile();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={() => setScriptReady(true)}
                onReady={() => setScriptReady(true)}
            />

            {!isOpen && (
                <button
                    type="button"
                    onClick={() => openFeedback()}
                    className="fixed bottom-4 right-4 z-[80] inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(0,0,0,0.38)] transition hover:-translate-y-0.5 hover:bg-[#ff7a50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a79] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b111a] sm:bottom-5 sm:right-5"
                    aria-haspopup="dialog"
                >
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5 fill-none stroke-current"
                        strokeWidth="2"
                    >
                        <path d="M5 5h14v11H9l-4 3V5Z" />
                        <path d="M9 10h6M12 7v6" />
                    </svg>
                    Feedback
                </button>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#020713]/80 p-3 backdrop-blur-sm sm:p-5"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsOpen(false);
                    }}
                >
                    <div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feedback-title"
                        tabIndex={-1}
                        className="relative my-auto w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#334d83] bg-[#111d3f] shadow-[0_22px_70px_rgba(0,0,0,0.62)] outline-none"
                    >
                        <div className="max-h-[calc(100vh-24px)] overflow-y-auto p-5 sm:max-h-[calc(100vh-40px)] sm:p-6">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close feedback dialog"
                                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-xl text-[#9ca9c6] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]"
                            >
                                ×
                            </button>

                            {createdIssue ? (
                                <div className="py-8 text-center">
                                    <div className="mx-auto grid size-14 place-items-center rounded-full border border-[#4ad295]/40 bg-[#143c34] text-2xl text-[#73e4b3]">
                                        ✓
                                    </div>
                                    <h2
                                        id="feedback-title"
                                        className="mt-4 text-xl font-black text-white"
                                    >
                                        Feedback sent
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#aebbd8]">
                                        Thank you! Your feedback was added as GitHub
                                        Issue #{createdIssue.number} by the Cam Lab
                                        feedback bot.
                                    </p>
                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <a
                                            href={createdIssue.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-[#4c63b8] bg-[#263a7a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#30478f]"
                                        >
                                            View public issue
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-lg border border-[#35476e] bg-[#17264d] px-4 py-2.5 text-sm font-bold text-[#cbd5eb] transition hover:bg-[#1d315f]"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="pr-10">
                                        <h2
                                            id="feedback-title"
                                            className="text-xl font-black tracking-tight text-white"
                                        >
                                            Send feedback
                                        </h2>
                                        <p className="mt-1 text-sm leading-5 text-[#aebbd8]">
                                            Tell us what you want, what&apos;s broken, or
                                            any thoughts—it goes straight to the Cam Lab
                                            GitHub tracker.
                                        </p>
                                    </div>

                                    <div className="mt-5 rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-3 text-xs leading-5 text-[#9eacd0]">
                                        This feedback is about the <strong className="text-white">Cam Lab website</strong>—not the Catch a Monster game itself. Cam Lab is fan-made and cannot change anything in-game.
                                    </div>

                                    <form
                                        onSubmit={submitFeedback}
                                        className="mt-5 space-y-4"
                                    >
                                        <label className="block">
                                            <span className="text-sm font-bold text-[#dbe3f7]">
                                                Category
                                            </span>
                                            <select
                                                id="feedback-category"
                                                name="feedback-category"
                                                value={category}
                                                onChange={(event) =>
                                                    setCategory(
                                                        event.target.value as FeedbackCategory,
                                                    )
                                                }
                                                className="mt-2 w-full rounded-lg border border-[#425f9c] bg-[#101c42] px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                            >
                                                {categoryOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-bold text-[#dbe3f7]">
                                                Your message
                                                <span className="ml-1 font-normal text-[#8f9dbc]">
                                                    (minimum 10 characters)
                                                </span>
                                            </span>
                                            <textarea
                                                id="feedback-message"
                                                name="feedback-message"
                                                value={message}
                                                onChange={(event) =>
                                                    setMessage(event.target.value.slice(0, 2000))
                                                }
                                                maxLength={2000}
                                                minLength={10}
                                                rows={5}
                                                required
                                                placeholder="e.g. The Index Tracker is slow on mobile, or this monster's stat is incorrect..."
                                                className="mt-2 w-full resize-y rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-3 text-sm leading-5 text-white outline-none placeholder:text-[#69789d] focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                            />
                                            <span className="mt-1 flex items-center justify-between gap-3 text-xs text-[#8f9dbc]">
                                                <span>
                                                    {message.trim().length < 10
                                                        ? `${10 - message.trim().length} more characters required`
                                                        : "Minimum length reached"}
                                                </span>
                                                <span>{message.length}/2000 characters</span>
                                            </span>
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-bold text-[#dbe3f7]">
                                                Discord username
                                                <span className="ml-1 font-normal text-[#8f9dbc]">
                                                    (optional)
                                                </span>
                                            </span>
                                            <input
                                                id="feedback-discord-username"
                                                name="feedback-discord-username"
                                                type="text"
                                                value={contact}
                                                onChange={(event) =>
                                                    setContact(event.target.value.slice(0, 80))
                                                }
                                                maxLength={80}
                                                autoComplete="off"
                                                placeholder="Only if you want a reply (shown publicly)"
                                                className="mt-2 w-full rounded-lg border border-[#293b68] bg-[#0b1532] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#69789d] focus:border-[#62a7ff] focus:ring-2 focus:ring-[#62a7ff]/20"
                                            />
                                        </label>

                                        <div
                                            ref={turnstileContainerRef}
                                            className="flex min-h-[65px] justify-center"
                                        />

                                        {errorMessage && (
                                            <p
                                                role="alert"
                                                className="rounded-lg border border-[#b74b60]/45 bg-[#421d2a] px-3 py-2.5 text-sm text-[#ffb7c4]"
                                            >
                                                {errorMessage}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                message.trim().length < 10 ||
                                                !turnstileToken
                                            }
                                            className="w-full rounded-lg bg-[#ff6b3d] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff7a50] disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            {isSubmitting
                                                ? "Sending feedback..."
                                                : "Send feedback"}
                                        </button>

                                        <p className="text-center text-[11px] leading-4 text-[#7f8dac]">
                                            Feedback creates a public GitHub issue. Don&apos;t
                                            include passwords or private information.
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
