import Link from "next/link";
import { SoapsInviteFriendPanel } from "@/components/soaps/soaps-invite-friend-panel";
import { buttonVariants } from "@/components/ui/button-variants";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";
import { TRY_PUBLIC_PATHS } from "@/lib/try/paths";
import { cn } from "@/lib/utils";

export default function SoapsInvitePage() {
  const base = getPublicSiteBaseUrl().replace(/\/$/, "");
  const inviteUrl = `${base}${TRY_PUBLIC_PATHS.soaps}`;

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6 pb-16">
      <div className="space-y-3">
        <h1 className="text-2xl font-serif font-light text-foreground">Invite someone to try SOAPS</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Share a link they can open right away—no account needed for their first SOAPS. Use email, text, or copy the
          invite link. If they want to save entries and keep going, they can create a free account afterward.
        </p>
      </div>

      <SoapsInviteFriendPanel inviteUrl={inviteUrl} />

      <Link href="/app/soaps" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
        ← Back to SOAPS
      </Link>
    </div>
  );
}
