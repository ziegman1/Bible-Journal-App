import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getPrivacyPolicyUrl,
  getPublicSupportEmail,
  getPublicSupportMailtoHref,
  LEGAL_DOCUMENTS_LAST_UPDATED,
  PUBLIC_APP_WEBSITE,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_MARKETING_NAME} collects, uses, and protects your information.`,
};

export default function PrivacyPolicyPage() {
  const mail = getPublicSupportEmail();
  const mailto = getPublicSupportMailtoHref();

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LEGAL_DOCUMENTS_LAST_UPDATED}>
      <section>
        <h2>Overview</h2>
        <p>
          <strong>{APP_SHORT_NAME}</strong> (<strong>{APP_MARKETING_NAME}</strong>) helps you with
          discipleship practices—including journaling, prayer, logging share conversations, groups,
          and related tools. This policy explains what information we may handle and how we use it.
          The public URL of this policy is <strong>{getPrivacyPolicyUrl()}</strong>. Our website is{" "}
          <a
            className="text-primary underline underline-offset-2"
            href={PUBLIC_APP_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PUBLIC_APP_WEBSITE.replace(/^https:\/\//, "")}
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Information we may collect</h2>
        <ul>
          <li>
            <strong>Account information</strong> — such as email address, display name, and data
            needed to sign you in and keep your account working (processed with the help of our
            authentication and hosting providers).
          </li>
          <li>
            <strong>Content you create</strong> — journal entries, reflections, prayer or share
            logs, reading activity, group participation, and other material you save in the app.
          </li>
          <li>
            <strong>Usage-related data</strong> — information needed to run and improve the service,
            such as basic device or browser details, timestamps, diagnostic or error information,
            and similar technical data our infrastructure may log in the ordinary course of
            operation.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>Provide app features you choose to use</li>
          <li>Keep the service reliable and improve how it works</li>
          <li>Maintain security and help prevent abuse</li>
          <li>Support journaling, prayer, share logging, groups, and related features</li>
          <li>Respond when you contact us and enforce our Terms of Service when needed</li>
        </ul>
      </section>

      <section>
        <h2>We do not sell your personal data</h2>
        <p>
          {APP_SHORT_NAME} does not sell your personal information. We use data to operate and
          improve the app, not to sell it to data brokers.
        </p>
      </section>

      <section>
        <h2>Service providers and legal requests</h2>
        <p>
          We may share information with trusted service providers (for example hosting,
          authentication, email, or similar services) only as needed to run {APP_SHORT_NAME}. Those
          providers are expected to use the information only for the services they provide to us. We
          may also disclose information if we believe in good faith it is required by law or to
          protect the safety and rights of users or the public.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We take reasonable steps designed to protect your information. No online service can
          promise perfect security; if you have concerns, contact us using the email below.
        </p>
      </section>

      <section>
        <h2>Your choices and deletion</h2>
        <p>
          You may contact us to request help with your account or to ask about deleting your data.
          We will respond in line with applicable law and what we can reasonably do with our
          systems.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          {APP_SHORT_NAME} is not intended for young children. If you believe we have collected
          information from a child inappropriately, please contact us.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised version here and
          update the &quot;Last updated&quot; note at the top.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Questions about privacy:{" "}
          <a className="text-primary underline underline-offset-2" href={mailto}>
            {mail}
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
