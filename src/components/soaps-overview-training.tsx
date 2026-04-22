/**
 * In-app SOAPS overview / training copy for the SOAPS hub (Learn section).
 * Framework, steps, why it works, and closing challenge for personal use.
 *
 * @param embedded When true, omit outer card chrome (e.g. inside `SoapsTrainingCollapsible`).
 */
export function SoapsOverviewTraining({ embedded = false }: { embedded?: boolean }) {
  const inner = (
    <>
      <header className="space-y-2 border-b border-border/60 pb-6">
        <h2 className="font-serif text-2xl font-light text-stone-900 dark:text-stone-100">
          Introduction to SOAPS Bible Journaling
        </h2>
      </header>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What is SOAPS?</h3>
          <p>SOAPS is an acronym that provides a simple structure for journaling through Scripture:</p>
          <ul className="list-inside list-disc space-y-1 pl-1 text-stone-600 dark:text-stone-400">
            <li>S – Scripture</li>
            <li>O – Observation</li>
            <li>A – Application</li>
            <li>P – Prayer</li>
            <li>S – Share</li>
          </ul>
          <p>
            This method helps believers move from simply reading the Bible to hearing God, obeying His Word, and
            sharing with others.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1: Scripture</h3>
          <p>Choose a verse or short passage that stands out during your reading.</p>
          <p>
            Write that verse down in your journal. Writing the Scripture slows us down and helps us focus on what
            God is saying through His Word.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2: Observation</h3>
          <p className="font-medium text-foreground">Ask: What do I notice about this passage?</p>
          <p>Possible observations include:</p>
          <ul className="list-inside list-disc space-y-1 pl-1 text-stone-600 dark:text-stone-400">
            <li>What does this reveal about God?</li>
            <li>What does this reveal about people?</li>
            <li>Is there a command, promise, or warning?</li>
            <li>What stands out the most?</li>
          </ul>
          <p>The goal of observation is simply to understand what the passage is saying.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3: Application</h3>
          <p className="font-medium text-foreground">Next ask: How should this change my life today?</p>
          <p>
            Application moves Scripture from information to transformation. It answers the question: What is God
            asking me to do?
          </p>
          <p>Write one clear, practical step of obedience—something you can actually do this week.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 4: Prayer</h3>
          <p>Respond to God by writing a short prayer based on what you read.</p>
          <p>
            This may include asking God for help to obey, thanking Him for what He revealed, or praying for others
            who need to hear this truth.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 5: Share</h3>
          <p>The final step encourages multiplication.</p>
          <p className="font-medium text-foreground">Ask: Who can I share this with today?</p>
          <p>
            Sharing what God is teaching you helps reinforce obedience and encourages others.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why SOAPS works</h3>
          <p>This simple framework helps you:</p>
          <ul className="list-inside list-disc space-y-1 pl-1 text-stone-600 dark:text-stone-400">
            <li>Slow down and focus on Scripture</li>
            <li>Listen for what God is saying</li>
            <li>Apply biblical truth personally</li>
            <li>Pray in response to Scripture</li>
            <li>Multiply what you are learning by sharing</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-lg bg-muted/40 p-4 dark:bg-muted/20">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closing encouragement</h3>
          <p>
            A gentle way to begin is <strong>three times a week</strong>—even a short session counts. As SOAPS feels
            more natural, you can add another day or two when you are ready, and grow toward a rhythm that fits your
            life.
          </p>
          <p>
            The goal is not to write a lot, but to keep meeting God in His Word: hear what He is saying, obey in small
            steps, and share with someone when you can.
          </p>
        </section>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-0">{inner}</div>;
  }

  return (
    <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">{inner}</article>
  );
}
