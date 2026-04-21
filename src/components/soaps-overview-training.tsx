/**
 * In-app SOAPS overview / training copy for the SOAPS hub (Learn section).
 * Mirrors discipleship training flow: opening → framework → steps → why it works → challenge.
 */
export function SoapsOverviewTraining() {
  return (
    <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <h2 className="font-serif text-2xl font-light text-stone-900 dark:text-stone-100">
          Introduction to SOAPS Bible Journaling
        </h2>
      </header>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Training objective
          </h3>
          <p>
            Participants will learn a simple, reproducible method for engaging Scripture daily using the SOAPS
            Bible journaling framework: Scripture, Observation, Application, Prayer, and Share.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Opening (1–2 minutes)
          </h3>
          <p className="font-medium text-foreground">Begin by asking: &quot;How do you normally spend time in the Bible?&quot;</p>
          <p>Common answers may include:</p>
          <ul className="list-inside list-disc space-y-1 pl-1 text-stone-600 dark:text-stone-400">
            <li>Reading a devotional</li>
            <li>Reading a chapter or passage</li>
            <li>Listening to a sermon or teaching</li>
          </ul>
          <p>
            Explain that while reading Scripture is important, many people struggle to know how to slow down,
            reflect on the text, and apply it to their lives. The SOAPS method is a simple tool that helps
            disciples engage Scripture personally and consistently.
          </p>
        </section>

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
          <p>Encourage participants to write one clear, practical step of obedience.</p>
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
          <p>This simple framework helps disciples:</p>
          <ul className="list-inside list-disc space-y-1 pl-1 text-stone-600 dark:text-stone-400">
            <li>Slow down and focus on Scripture</li>
            <li>Listen for what God is saying</li>
            <li>Apply biblical truth personally</li>
            <li>Pray in response to Scripture</li>
            <li>Multiply what they are learning by sharing</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-lg bg-muted/40 p-4 dark:bg-muted/20">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closing challenge</h3>
          <p>Encourage participants to try SOAPS journaling each day this week.</p>
          <p>
            Remind them that the goal is not to write a lot, but to consistently hear from God, obey His Word, and
            share with others.
          </p>
        </section>
      </div>
    </article>
  );
}
