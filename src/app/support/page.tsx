import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getPublicSupportEmail,
  getPublicSupportMailtoHref,
  LEGAL_DOCUMENTS_LAST_UPDATED,
  PUBLIC_APP_WEBSITE,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Support",
  description: `Get help with ${APP_MARKETING_NAME}.`,
};

export default function SupportPage() {
  const mail = getPublicSupportEmail();
  const mailto = getPublicSupportMailtoHref();

  return (
    <LegalPageLayout title="Support" lastUpdated={LEGAL_DOCUMENTS_LAST_UPDATED}>
      <section>
        <h2>We&apos;re glad you&apos;re here</h2>
        <p>
          <strong>{APP_SHORT_NAME}</strong> ({APP_MARKETING_NAME}) is meant to be simple and
          trustworthy. If something goes wrong or you have a question, reach out—we read what you
          send and will do our best to help.
        </p>
      </section>

      <section>
        <h2>Email us</h2>
        <p>
          <a className="text-primary font-medium underline underline-offset-2" href={mailto}>
            {mail}
          </a>
        </p>
        <p>
          Official website:{" "}
          <a
            className="text-primary underline underline-offset-2"
            href={PUBLIC_APP_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PUBLIC_APP_WEBSITE.replace(/^https:\/\//, "")}
          </a>
        </p>
      </section>

      <section>
        <h2>What you can write us about</h2>
        <ul>
          <li>
            <strong>Account help</strong> — sign-in issues, profile or settings questions
          </li>
          <li>
            <strong>Bugs</strong> — something broke, looks wrong, or doesn&apos;t work as expected
          </li>
          <li>
            <strong>Questions</strong> — how a feature works or how to use the app
          </li>
          <li>
            <strong>Feedback</strong> — ideas to improve {APP_SHORT_NAME}
          </li>
        </ul>
        <p className="text-stone-600 dark:text-stone-400">
          Please include what you were doing and, when relevant, your account email (never send
          passwords). We cannot promise an instant reply, but we will get back when we can.
        </p>
      </section>
    </LegalPageLayout>
  );
}
