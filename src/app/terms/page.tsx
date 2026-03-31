import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getPublicSupportEmail,
  getPublicSupportMailtoHref,
  getTermsOfServiceUrl,
  LEGAL_DOCUMENTS_LAST_UPDATED,
  PUBLIC_APP_WEBSITE,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing use of ${APP_MARKETING_NAME}.`,
};

export default function TermsOfServicePage() {
  const mail = getPublicSupportEmail();
  const mailto = getPublicSupportMailtoHref();

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LEGAL_DOCUMENTS_LAST_UPDATED}>
      <section>
        <h2>Agreement</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) apply to <strong>{APP_SHORT_NAME}</strong> (
          <strong>{APP_MARKETING_NAME}</strong>), available at{" "}
          <a
            className="text-primary underline underline-offset-2"
            href={PUBLIC_APP_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PUBLIC_APP_WEBSITE.replace(/^https:\/\//, "")}
          </a>
          . By creating an account or using the service, you agree to use it responsibly and to
          these Terms. The current Terms are at <strong>{getTermsOfServiceUrl()}</strong>. If you
          do not agree, please do not use the service.
        </p>
      </section>

      <section>
        <h2>Your responsibility</h2>
        <ul>
          <li>
            You are responsible for what you write, upload, or share in the app, including journal
            entries, prayers, share logs, and group participation.
          </li>
          <li>
            You are responsible for keeping your login credentials secure and for activity under
            your account. Tell us promptly at{" "}
            <a className="text-primary underline underline-offset-2" href={mailto}>
              {mail}
            </a>{" "}
            if you suspect unauthorized access.
          </li>
        </ul>
      </section>

      <section>
        <h2>The service &quot;as is&quot;</h2>
        <p>
          {APP_SHORT_NAME} is provided <strong>as is</strong> and <strong>as available</strong>. We
          do not guarantee specific spiritual outcomes, uninterrupted access, or that the app will
          meet every expectation. The app offers tools for discipleship and reflection; it is not a
          substitute for professional pastoral care, medical advice, or legal advice.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to misuse the service—for example:</p>
        <ul>
          <li>Breaking the law or violating others&apos; rights</li>
          <li>Harassing others or attempting to harm the service or its users</li>
          <li>Trying to break in, overload, or scrape the service beyond normal personal use</li>
        </ul>
      </section>

      <section>
        <h2>Enforcement</h2>
        <p>
          We may suspend or remove accounts that violate these Terms, misuse {APP_SHORT_NAME}, or
          create risk for the community, subject to applicable law.
        </p>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          The app relies on vendors (such as hosting and authentication). Their own terms and
          privacy policies apply to how they process data on their side.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for indirect or consequential
          damages arising from your use of {APP_SHORT_NAME}. Our total liability for claims related
          to the service is limited to the greater of (a) amounts you paid us for the service in the
          12 months before the claim, or (b) fifty U.S. dollars (USD), except where the law does not
          allow that limit.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these Terms. We will post the new version here and update the date above.
          Continuing to use the service after changes means you accept the updated Terms where the
          law allows.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a className="text-primary underline underline-offset-2" href={mailto}>
            {mail}
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
