import type { ReactNode } from "react";
import Link from "next/link";
import { CHAT_CONTENT } from "@/content/chatContent";
import { cn } from "@/lib/utils";

const sectionClass =
  "space-y-3 text-stone-700 dark:text-stone-300 text-[0.95rem] leading-relaxed";
const h2Class =
  "text-xl font-serif font-light text-stone-900 dark:text-stone-100 mt-10 mb-3 scroll-mt-20";
const h3Class =
  "text-base font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2";

type Variant = "app" | "public";

function splitWithPlaceholders(
  text: string,
  variant: Variant
): ReactNode[] {
  const accountabilityHref =
    variant === "app"
      ? "/app/chat/accountability-questions"
      : `/signup?redirectTo=${encodeURIComponent(CHAT_CONTENT.publicInvite.accountabilityAfterLoginPath)}`;
  const audiotreasureUrl = CHAT_CONTENT.publicInvite.audiotreasureUrl;
  const audiotreasureLabel = CHAT_CONTENT.publicInvite.audiotreasureLabel;

  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const nextAcc = rest.indexOf("{{ACCOUNTABILITY}}");
    const nextAudio = rest.indexOf("{{AUDIOTREASURE}}");
    const nextStrong = rest.indexOf("{{CHAT_STRONG}}");
    const candidates = [nextAcc, nextAudio, nextStrong].filter((i) => i >= 0);
    const min = candidates.length ? Math.min(...candidates) : -1;
    if (min < 0) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }
    if (min > 0) {
      parts.push(<span key={key++}>{rest.slice(0, min)}</span>);
    }
    if (rest.startsWith("{{ACCOUNTABILITY}}", min)) {
      parts.push(
        <Link
          key={key++}
          href={accountabilityHref}
          className="font-medium text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          {CHAT_CONTENT.publicInvite.accountabilityLinkLabel}
        </Link>
      );
      rest = rest.slice(min + "{{ACCOUNTABILITY}}".length);
    } else if (rest.startsWith("{{AUDIOTREASURE}}", min)) {
      parts.push(
        <a
          key={key++}
          href={audiotreasureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-900 underline underline-offset-2 dark:text-stone-100"
        >
          {audiotreasureLabel}
        </a>
      );
      rest = rest.slice(min + "{{AUDIOTREASURE}}".length);
    } else if (rest.startsWith("{{CHAT_STRONG}}", min)) {
      parts.push(
        <strong key={key++} className="text-stone-900 dark:text-stone-100">
          CHAT
        </strong>
      );
      rest = rest.slice(min + "{{CHAT_STRONG}}".length);
    } else {
      rest = rest.slice(min + 1);
    }
  }
  return parts;
}

type Props = {
  variant: Variant;
  className?: string;
};

export function ChatInformationalSections({ variant, className }: Props) {
  return (
    <div className={cn(className)}>
      {CHAT_CONTENT.sections.map((section) => (
        <section key={section.id} id={section.id} className={sectionClass}>
          <h2 className={h2Class}>{section.heading}</h2>
          {section.blocks.map((block, i) => {
            const k = `${section.id}-${i}`;
            if (block.kind === "p") {
              return (
                <p key={k}>{splitWithPlaceholders(block.text, variant)}</p>
              );
            }
            if (block.kind === "acronym") {
              return (
                <ul key={k} className="list-disc space-y-1 pl-6">
                  {block.items.map((row) => (
                    <li key={row.letter}>
                      <strong>{row.letter}</strong>
                      {row.phrase.startsWith(row.letter)
                        ? row.phrase.slice(row.letter.length)
                        : row.phrase}
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.kind === "ol") {
              const list = (
                <ol className="list-decimal space-y-2 pl-6">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              );
              if ("anchorId" in block && block.anchorId) {
                return (
                  <div key={k} id={block.anchorId} className="scroll-mt-20">
                    {list}
                  </div>
                );
              }
              return <div key={k}>{list}</div>;
            }
            if (block.kind === "subsection") {
              return (
                <div key={k}>
                  <h3 className={h3Class}>{block.title}</h3>
                  {block.paragraphs.map((para, j) => (
                    <p key={j}>{splitWithPlaceholders(para, variant)}</p>
                  ))}
                </div>
              );
            }
            if (block.kind === "blockquote") {
              return (
                <blockquote
                  key={k}
                  className="border-l-4 border-amber-200 pl-4 text-stone-600 italic dark:border-amber-900/60 dark:text-stone-400"
                >
                  {block.quote}
                  <footer className="mt-2 not-italic text-sm text-stone-500 dark:text-stone-500">
                    {block.citation}
                  </footer>
                </blockquote>
              );
            }
            if (block.kind === "applicationBullets") {
              return (
                <ul key={k} className="list-disc space-y-1 pl-6">
                  {block.items.map((row) => (
                    <li key={row.term}>
                      <strong>{row.term}</strong> {row.rest}
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </section>
      ))}
    </div>
  );
}
