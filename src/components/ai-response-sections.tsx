"use client";

import type { AIResponseJSON } from "@/types/database";

interface AIResponseSectionsProps {
  data: AIResponseJSON | Record<string, unknown>;
  className?: string;
}

export function AIResponseSections({ data, className = "" }: AIResponseSectionsProps) {
  const response = data as AIResponseJSON;

  return (
    <div className={`space-y-4 text-sm ${className}`}>
      {response.summary && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Summary</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            {response.summary}
          </p>
        </section>
      )}
      {response.context && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Context</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            {response.context}
          </p>
        </section>
      )}
      {response.meaning && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Meaning</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            {response.meaning}
          </p>
        </section>
      )}
      {response.themes && response.themes.length > 0 && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Themes</h3>
          <p className="text-stone-700 dark:text-stone-300">
            {response.themes.join(", ")}
          </p>
        </section>
      )}
      {response.crossReferences && response.crossReferences.length > 0 && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Cross references</h3>
          <ul className="space-y-1 text-stone-700 dark:text-stone-300">
            {response.crossReferences.map((cr, i) => (
              <li key={i}>
                <span className="font-medium">{cr.reference}</span>: {cr.note}
              </li>
            ))}
          </ul>
        </section>
      )}
      {response.reflectionPrompt && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Reflection prompt</h3>
          <p className="text-stone-700 dark:text-stone-300 italic leading-relaxed">
            {response.reflectionPrompt}
          </p>
        </section>
      )}
      {response.applicationInsight && (
        <section>
          <h3 className="font-medium text-stone-600 dark:text-stone-400 mb-1">Application</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            {response.applicationInsight}
          </p>
        </section>
      )}
    </div>
  );
}
