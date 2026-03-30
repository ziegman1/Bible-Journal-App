import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getPrivacyPolicyUrl,
  getSupportContactHref,
  isSupportEmailConfigured,
  LEGAL_DOCUMENTS_LAST_UPDATED,
  LEGAL_DOC_PLACEHOLDERS,
  PLACEHOLDER_LEGAL_ENTITY,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_SHORT_NAME} (${APP_MARKETING_NAME}) collects, uses, and protects your information.`,
};

const P = LEGAL_DOC_PLACEHOLDERS.privacy;

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={LEGAL_DOCUMENTS_LAST_UPDATED}
    >
      <p className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-950 dark:text-amber-100">
        <strong>Template notice.</strong> Replace all{" "}
        <code className="text-[0.8em]">TODO — Legal:</code> lines and{" "}
        <code className="text-[0.8em]">PLACEHOLDER_LEGAL_ENTITY</code> in{" "}
        <code className="text-[0.8em]">src/lib/site-config.ts</code> with
        accurate, counsel-reviewed text before you rely on this policy. This document is not legal
        advice.
      </p>

      <section>
        <h2>Who we are</h2>
        <p>
          {APP_SHORT_NAME} (“we,” “us”) operates the web application{" "}
          <strong>{APP_MARKETING_NAME}</strong> (the “Service”). The operator is described as{" "}
          <strong>{PLACEHOLDER_LEGAL_ENTITY}</strong>.{" "}
          {isSupportEmailConfigured() ? (
            <>
              Contact:{" "}
              <a
                className="text-primary underline underline-offset-2"
                href={getSupportContactHref()}
              >
                our support inbox
              </a>
              .
            </>
          ) : (
            <>
              For contact options, see{" "}
              <a className="text-primary underline underline-offset-2" href="#legal-contact">
                Contact
              </a>{" "}
              below.
            </>
          )}{" "}
          The public URL of this policy is <strong>{getPrivacyPolicyUrl()}</strong>.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> such as email address, display name, and authentication
            credentials processed by our auth provider — {P.authProviderDetail}
          </li>
          <li>
            <strong>Content you provide:</strong> journal entries, reflections, reading activity,
            prayer logs, group participation, and other materials you submit inside the Service.
          </li>
          <li>
            <strong>Technical &amp; usage data:</strong> device/browser type, approximate location
            derived from IP (if collected by our host or analytics), timestamps, pages viewed,
            diagnostic logs, and error reports — {P.technicalInfrastructure}
          </li>
          <li>
            <strong>Communications:</strong> messages you send to support and (if applicable)
            transactional emails we send you.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>Provide, secure, and improve the Service and its features</li>
          <li>Authenticate accounts and maintain sessions</li>
          <li>Store and sync your user-generated content</li>
          <li>Operate groups, invites, and collaboration features you choose to use</li>
          <li>Respond to support requests and enforce our Terms of Service</li>
          <li>Comply with law or protect rights and safety, as required</li>
          <li>{P.additionalPurposes}</li>
        </ul>
      </section>

      <section>
        <h2>Cookies, local storage, and similar technologies</h2>
        <p>
          The Service may use cookies, browser local storage, or similar mechanisms to keep you
          signed in and to remember preferences. Session cookies from our authentication provider are
          typically essential for the Service to function. {P.cookieDetails}
        </p>
      </section>

      <section>
        <h2>Third parties and processors</h2>
        <p>We rely on vendors to run the Service, including (update to match your stack):</p>
        <ul>
          <li>
            <strong>Hosting &amp; application:</strong> {P.hostingVendor}
          </li>
          <li>
            <strong>Database &amp; authentication:</strong> {P.databaseAuthVendor}
          </li>
          <li>
            <strong>Email / transactional messages:</strong> {P.emailVendor}
          </li>
          <li>
            <strong>AI or scripture APIs (if enabled):</strong> {P.aiAndScriptureVendors}
          </li>
        </ul>
        <p>{P.vendorPrivacyLinks}</p>
      </section>

      <section>
        <h2>User-generated content</h2>
        <p>
          You control what you write in your journal and related features. Other members may see
          content you share in groups according to those features’ designs. Do not post unlawful or
          harmful material; see the Terms of Service.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          We retain information while your account is active and for a reasonable period afterward to
          resolve disputes, enforce agreements, and meet legal obligations. {P.retentionSchedule}
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We implement reasonable administrative, technical, and organizational measures to protect
          information. No method of transmission or storage is completely secure. {P.securitySummary}
        </p>
      </section>

      <section>
        <h2>Your rights and choices</h2>
        <p>
          Depending on where you live, you may have rights to access, correct, delete, export, or
          restrict processing of your personal data, and to object to certain uses. To exercise
          rights, contact us using the information in the Contact section. {P.regionalPrivacyRights}
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>{P.childAgeThreshold}</p>
        <p>
          We do not knowingly collect personal information from people who do not meet the
          eligibility requirements stated in your final policy. If you believe we have collected
          information improperly, contact us. {P.childrensPrivacyRules}
        </p>
      </section>

      <section>
        <h2>International transfers</h2>
        <p>
          If your data is processed in countries other than your own, describe safeguards (e.g.,
          Standard Contractual Clauses) here: {P.internationalTransfers}
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the new version here and
          update the “Last updated” date. {P.materialChangeNotice}
        </p>
      </section>

      <section id="legal-contact">
        <h2>Contact</h2>
        {isSupportEmailConfigured() ? (
          <p>
            Questions about this policy:{" "}
            <a
              className="text-primary underline underline-offset-2"
              href={getSupportContactHref()}
            >
              contact support
            </a>
            .
          </p>
        ) : (
          <p>
            For questions about this policy, use the contact method your organization publishes for
            this product. When a support email is configured for production, a mailto link appears in
            the site footer and in this section.
          </p>
        )}
      </section>
    </LegalPageLayout>
  );
}
