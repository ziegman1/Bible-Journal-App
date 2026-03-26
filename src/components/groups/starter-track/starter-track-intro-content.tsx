import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STARTER_TRACK_VISION_VERSES } from "@/lib/groups/starter-track/starter-track-v1-config";

export function StarterTrackIntroContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simple meeting format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <p>
            A 3/3rds group divides time into three parts:{" "}
            <strong>Look Back</strong>, <strong>Look Up</strong>, and{" "}
            <strong>Look Forward</strong>. Each part is about one third of your
            time together.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Look Back (about ⅓ of your time)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">Care</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Share a meal, refreshment, a story from the week, or an answer to prayer.</li>
              <li>How has everyone’s walk with God been?</li>
              <li>If someone is struggling, pray and stay after to care for them.</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">
              Check-up <span className="text-amber-700 dark:text-amber-300">(never skip)</span>
            </h3>
            <p>
              In the <strong>first</strong> Starter Track meeting there is no prior week
              to review, so the app shows a short teaching on obedience and mutual
              accountability instead. Starting in <strong>week 2</strong>, Check-up lists
              what each person committed last week (obey · share) from Look Forward so you
              can follow up together.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>How have you obeyed what you’ve learned?</li>
              <li>Who have you trained in what you’ve learned?</li>
              <li>With whom have you shared your story or God’s story?</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">
              Vision <span className="text-amber-700 dark:text-amber-300">(never skip)</span>
            </h3>
            <p>
              <strong>Before</strong> you begin the Starter Track, your group writes a{" "}
              <strong>group vision statement</strong> on the Starter Track hub—rooted in
              God&apos;s Word and focused on multiplication (making disciples who make
              disciples). Use the suggested passages below as you shape that statement
              together.
            </p>
            <p>
              <strong>Each week</strong> during the Starter Track, in the Vision portion
              of Look Back, you&apos;ll <strong>read that same vision statement out loud
              together</strong> as a recurring reminder of why your group exists. You can
              still add brief personal encouragement about multiplication when you meet
              (optional notes in the app).
            </p>
            <p className="font-medium text-stone-800 dark:text-stone-200">
              Suggested verses for shaping your group vision statement:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {STARTER_TRACK_VISION_VERSES.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Look Up (about ⅓ of your time)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <p>Pray briefly. Read and discuss this week’s passage. Ask God to teach you.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>What did you like about this passage?</li>
            <li>What did you find difficult?</li>
          </ol>
          <p>Read the passage again.</p>
          <ol className="list-decimal pl-5 space-y-2" start={3}>
            <li>What does this passage teach about people?</li>
            <li>What does this passage teach about God?</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Look Forward (about ⅓ of your time)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">
              Obey · Train · Share{" "}
              <span className="text-amber-700 dark:text-amber-300">(never skip)</span>
            </h3>
            <p>
              Pray for the Spirit to guide answers, then make commitments and write
              them down.
            </p>
            <ol className="list-decimal pl-5 space-y-1" start={5}>
              <li>How will you obey this passage?</li>
              <li>Who will you train with this passage?</li>
              <li>With whom will you share your story or God’s story?</li>
            </ol>
          </section>
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">
              Practice <span className="text-amber-700 dark:text-amber-300">(never skip)</span>
            </h3>
            <p>In twos or threes, practice what you committed to in questions 5–7.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Role-play a hard conversation or temptation</li>
              <li>Practice teaching today’s passage</li>
              <li>Practice sharing the gospel</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">Talk with God</h3>
            <p>
              In small groups, pray for every member by name. Ask God to prepare
              hearts of people who will hear about Jesus and to strengthen you to
              obey your commitments.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
