import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getSupportContactHref,
  getTermsOfServiceUrl,
  LEGAL_DOCUMENTS_LAST_UPDATED,
  LEGAL_DOC_PLACEHOLDERS,
  PLACEHOLDER_LEGAL_ENTITY,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing use of ${APP_SHORT_NAME} (${APP_MARKETING_NAME}).`,
};

const T = LEGAL_DOC_PLACEHOLDERS.terms;

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated={LEGAL_DOCUMENTS_LAST_UPDATED}
    >
      <p className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-950 dark:text-amber-100">
        <strong>Template notice.</strong> Replace all{" "}
        <code className="text-[0.8em]">TODO — Legal:</code> lines and{" "}
        <code className="text-[0.8em]">PLACEHOLDER_LEGAL_ENTITY</code> in{" "}
        <code className="text-[0.8em]">src/lib/site-config.ts</code> with accurate,
        counsel-reviewed terms before you rely on this document. This is not legal advice.
      </p>

      <section>
        <h2>Agreement to terms</h2>
        <p>
          These Terms of Service (“Terms”) govern your access to and use of{" "}
          <strong>{APP_MARKETING_NAME}</strong>, operated as <strong>{APP_SHORT_NAME}</strong> by{" "}
          <strong>{PLACEHOLDER_LEGAL_ENTITY}</strong> (“we,” “us”). By creating an account or using
          the Service, you agree to these Terms. The current Terms are available at{" "}
          <strong>{getTermsOfServiceUrl()}</strong>. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>Eligibility</h2>
        <p>
          You represent that you meet the minimum age and capacity requirements in{" "}
          <strong>{T.eligibilityJurisdiction}</strong> and that you are not barred from using the
          Service under applicable law.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          You are responsible for safeguarding your credentials and for activity under your account.
          Notify us promptly at{" "}
          <a className="text-primary underline underline-offset-2" href={getSupportContactHref()}>
            support
          </a>{" "}
          of unauthorized use. We may suspend or terminate accounts that violate these Terms or harm
          the Service or other users.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate any law or third-party rights</li>
          <li>Harass, abuse, defraud, or impersonate others</li>
          <li>Upload malware or attempt to disrupt or probe our systems</li>
          <li>
            Scrape, overload, or automate access in a way that impairs the Service (except as we
            expressly allow)
          </li>
          <li>
            Reverse engineer or attempt to extract source code except where prohibited law does not
            allow this restriction
          </li>
          <li>
            Use the Service to build a competing product using our proprietary materials without
            permission
          </li>
        </ul>
        <p>{T.extraAcceptableUse}</p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The Service, including its branding, design, and original software, is owned by us and our
          licensors. Public-domain or licensed scripture text may appear for reading; third-party
          rights in such text remain with their owners or licensors as applicable.{" "}
          {T.scriptureLicensing}
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You retain ownership of content you create. To operate the Service, you grant us a
          non-exclusive license to host, store, process, display, and transmit your content solely
          to provide and improve the Service for you, per features you use (including sync and group
          sharing). {T.aiTraining}
        </p>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          The Service may integrate third-party providers (hosting, auth, email, etc.). Their terms
          and privacy policies apply to their processing. {T.thirdPartyList}
        </p>
      </section>

      <section>
        <h2>Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW,
          WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE SERVICE OFFERS SPIRITUAL PRACTICE TOOLS AND
          DISCIPLESHIP FEATURES; IT IS NOT A SUBSTITUTE FOR PROFESSIONAL PASTORAL, MEDICAL, OR
          LEGAL ADVICE. {T.disclaimerJurisdiction}
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR
          GOODWILL. OUR AGGREGATE LIABILITY ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT
          EXCEED THE GREATER OF <strong>{T.liabilityCapFees}</strong> OR{" "}
          <strong>{T.liabilityMinimumSafeHarbor}</strong>, EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY
          LAW (E.G., GROSS NEGLIGENCE OR WILLFUL MISCONDUCT, WHERE APPLICABLE).
        </p>
      </section>

      <section>
        <h2>Indemnity</h2>
        <p>
          You will defend and indemnify us against claims arising from your content or your misuse of
          the Service, to the extent permitted by <strong>{T.indemnityJurisdiction}</strong>.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access for breach,
          risk, or operational reasons. {T.dataExportOnTermination}
        </p>
      </section>

      <section>
        <h2>Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws of <strong>{T.governingLawRegion}</strong>, without
          regard to conflict-of-law rules. Disputes will be resolved in{" "}
          <strong>{T.disputeResolution}</strong>. Consumers in certain regions may have non-waivable
          rights — {T.euConsumerDisputes}
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may modify these Terms. We will post updates here and note the “Last updated” date.
          Continued use after changes constitutes acceptance where law allows, subject to{" "}
          {T.materialTermsChangeNotice}
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a className="text-primary underline underline-offset-2" href={getSupportContactHref()}>
            Contact support
          </a>{" "}
          for questions about these Terms (or see the Privacy Policy contact section if no mailbox is
          configured yet).
        </p>
      </section>
    </LegalPageLayout>
  );
}
