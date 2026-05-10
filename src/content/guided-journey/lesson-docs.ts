/**
 * Guided Journey — approved teaching copy (in-app source of truth).
 *
 * If your team maintains canonical documents elsewhere, paste the **exact** approved
 * wording here and keep headings / summaries aligned with the product flow.
 */
import type { LinearDiscipleshipStepKey } from "@/lib/app-experience-mode/linear-discipleship-path";

export type LessonDocSection = { heading: string; paragraphs: string[] };

export type LessonDoc = {
  key: Extract<
    LinearDiscipleshipStepKey,
    "lesson_self_feeding" | "lesson_spiritual_breathing" | "lesson_dual_accountability"
  >;
  /** Short name for the confirmation prompt. */
  principlePromptName: string;
  /** Optional opening line(s) before the teaching sections. */
  introduction?: string;
  sections: LessonDocSection[];
  /** “At a glance” recap — required for each lesson. */
  summary: LessonDocSection;
};

/** Canonical Self-Feeding lesson (Guided Journey). Finalized, fully refined teaching script. */
export const SELF_FEEDING = {
  title: "Self-Feeding in the Word",
  sections: [
    {
      heading: "God Invites You to Meet With Him",
      body: `At the center of the Christian life is a simple but powerful reality: God desires to speak to you. Not just through someone else, and not only through sermons or teachings, but personally—through His Word.

From the very beginning, His design has always been that His people would not simply receive from Him occasionally, but walk with Him daily. That means your relationship with Him was never meant to be secondhand. You were created to know Him, to hear His voice, and to respond to Him personally as you open His Word.`,
    },
    {
      heading: "How We’ve Learned to Depend on Others",
      body: `For many of us, whether we realize it or not, we’ve been shaped to go somewhere to be fed spiritually.

We go to church to be fed.  
We listen to sermons to be fed.  
We read books or devotionals so that someone else can help us understand.

And while all of these can be helpful, over time they begin to shape how we think. We start to assume that understanding Scripture belongs to those who are more trained, more knowledgeable, or more experienced than we are.

So instead of opening the Word ourselves with expectation, we often wait to be fed. We look to someone else to explain it, to interpret it, and to tell us what it means.

Without realizing it, we become dependent.

But that was never God’s intention.`,
    },
    {
      heading: "God’s Word Was Given for You to Engage",
      body: `When God gave His Word, He did not give it only to a select group of professionals. He gave it to His people.

In Joshua 1:8, God says:

“This Book of the Law shall not depart from your mouth, but you shall meditate on it day and night… for then you will make your way prosperous, and then you will have good success.”

This reflects a pattern for how God’s people are meant to live—not occasionally being fed, but continually engaging with Him.

Throughout Scripture, this invitation is repeated:

“To let the word of Christ dwell in you richly…” (Colossians 3:16)

“To be transformed by the renewal of your mind…” (Romans 12:2)

“To be doers of the word, and not hearers only…” (James 1:22)

The expectation is not that a few will understand while the rest listen. The expectation is that every follower of Jesus will learn to come to the Word personally, hear from God directly, and respond in obedience.`,
    },
    {
      heading: "Why Many People Feel Stuck Spiritually",
      body: `For many of us, our experience with the Bible has followed a familiar pattern: we listen, we learn, and then we move on.

We are taught.  
We are fed.  
But we do not always engage.

Over time, something subtle begins to happen. We become familiar with truth, but not always formed by it. We hear what God is saying, but we don’t consistently respond. We understand more, but our lives don’t always change.

This is where many people begin to feel stuck.

It’s not because they lack access to truth. It’s because they have not learned how to move beyond simply being fed into personally engaging with God. There is a missing step between hearing and transformation—and that step is responding.`,
    },
    {
      heading: "Learning to Feed Yourself",
      body: `At some point in every disciple’s journey, something has to shift. We begin to realize, “I don’t just want to be fed—I want to walk with God myself.”

This is where self-feeding begins.

It is learning to come to Scripture with expectation, believing that God will meet you there. Instead of relying on others to consistently feed you, you begin to engage the Word personally. You slow down. You pay attention. You begin asking, “What is God saying here? What is He revealing? What is He inviting me to do?”

And when something becomes clear, you don’t move on—you respond.

This is the turning point.

You are no longer waiting to be fed. You are learning to meet with God yourself, hear His voice, and follow where He leads.

The Word is no longer something you primarily receive from others. It becomes something you live from.`,
    },
    {
      heading: "A Simple Way to Begin: SOAPS",
      body: `One of the simplest and most practical ways to begin living this out is through a tool called SOAPS. This tool is not the goal—it is simply a guide that helps you move from depending on others to consistently engaging God for yourself.

As you open Scripture, you begin by noticing what stands out to you. Instead of rushing past it, you pause and allow that moment to become personal. You reflect on what God is saying and begin to let His Word speak directly into your life.

From there, you ask how this truth should shape your actions, your thinking, or your relationships today. You respond to God in prayer, turning what you’ve read into a real conversation with Him. And then, rather than keeping it to yourself, you share what God is doing in your life with someone else.

This is how self-feeding begins to take shape—not as a one-time moment, but as a consistent rhythm where you meet with God, hear from Him, respond in obedience, and allow what He is doing in you to flow into others.`,
    },
    {
      heading: "Where Transformation Happens",
      body: `Many people stop at understanding, but transformation happens when we move into obedience.

When you begin to act on what God shows you, something changes. Your faith deepens. Your awareness of His voice becomes clearer. Your life begins to reflect what you are learning.

And over time, something else begins to happen. What God is doing in you naturally begins to overflow into the lives of others—not because you are trying harder, but because you are no longer just receiving—you are walking with God.`,
    },
    {
      heading: "The Life This Leads To",
      body: `A person who learns to engage God in His Word personally becomes someone who walks closely with Him, responds more quickly in obedience, and grows steadily over time.

Their life begins to influence others, not because they have all the answers, but because they are consistently meeting with God, hearing from Him, and responding to Him.

This is how disciples grow.  
And this is how disciples multiply.`,
    },
    {
      heading: "You're Not Meant to Walk This Alone",
      body: `What God does in you through his Word was never meant to stay private. He shapes us so that others can taste his kindness, clarity, and hope—and often he uses the very people already around you.

As you keep meeting him in Scripture, begin to notice who comes to mind: who might be encouraged if you invited them closer to Jesus, not with pressure, but with warmth and consistency? You don’t need to have it all figured out yet. For now, simply hold two or three names before the Lord and ask him who he might be calling you to walk with in this season.`,
    },
  ],
  summary:
    "Self-feeding in the Word is learning to move from depending on others to be fed spiritually to personally meeting with God in Scripture, hearing His voice, responding in obedience, and allowing what He is doing in your life to flow into the lives of others.",
} as const;

export const LESSON_SELF_FEEDING: LessonDoc = {
  key: "lesson_self_feeding",
  principlePromptName: SELF_FEEDING.title,
  sections: SELF_FEEDING.sections.map((s) => ({
    heading: s.heading,
    paragraphs: [s.body],
  })),
  summary: {
    heading: "Summary",
    paragraphs: [SELF_FEEDING.summary],
  },
};

/** Canonical Spiritual Breathing lesson (Guided Journey). Wording preserved from product source. */
export const SPIRITUAL_BREATHING = {
  title: "Spiritual Breathing",
  sections: [
    {
      heading: "Life With God Is Meant to Be Lived",
      body: `Following Jesus is not about mastering a system or having all the right answers. At its core, it is about learning how to walk with God in a real and ongoing relationship. That relationship is not complicated, but it is active. It involves listening to Him and responding to Him.

Over time, this becomes more than something you try to do occasionally. It becomes a rhythm—a way of living that is steady and life-giving. Just like breathing sustains your physical life, this rhythm of listening and responding begins to sustain your spiritual life.`,
    },
    {
      heading: "A Simple Picture",
      body: `One of the simplest ways to understand this is through the picture of breathing. Your body is constantly taking in air and releasing it, and without that rhythm, you cannot live.

In the same way, your life with God follows a similar pattern. You “breathe in” when you hear from Him, and you “breathe out” when you respond in obedience. When both are present, your spiritual life is healthy and growing. But when one is missing, something begins to feel off.`,
    },
    {
      heading: "Breathing In: Hearing From God",
      body: `God is not distant, and He is not silent. He is always speaking, and He desires to be known by you. As you've already begun to see, one of the primary ways He speaks is through His Word. But He also speaks through prayer, through other believers, and even through the circumstances of your life.

Learning to hear from God is not about achieving perfection. It is about becoming attentive. As you slow down and give your attention to Him, you begin to notice what He is highlighting, what He is stirring in your heart, and how He is leading you.`,
    },
    {
      heading: "Breathing Out: Obeying God",
      body: `Hearing from God is only part of the relationship. Growth begins to take place when you respond to what He shows you. This response is what it means to “breathe out.”

Sometimes obedience is simple and internal, like adjusting your thinking or choosing a different attitude. Other times it is more visible, like taking a step of faith, encouraging someone, or sharing something God has shown you. In every case, what God gives you is meant to move through you, not stop with you.

When you respond, your relationship with Him becomes active rather than passive.`,
    },
    {
      heading: "Learning to Recognize His Voice",
      body: `Jesus described His followers as people who hear His voice and follow Him. That kind of familiarity does not happen instantly—it grows over time through experience.

As you continue to listen and respond, you begin to recognize how God speaks to you. Often it comes through a sense of clarity, a quiet conviction, or a prompting that stays with you. The more you act on what you sense Him saying, the more confident you become in recognizing His voice.`,
    },
    {
      heading: "Learning to Discern",
      body: `As you grow in hearing from God, you also learn how to discern what is truly from Him. God will never contradict His Word, and what He says will reflect His character. His voice brings clarity and direction, even if you do not yet see the full picture.

Over time, you begin to recognize that His leading produces peace rather than confusion, and conviction rather than condemnation. This discernment develops as you continue to walk with Him, listen carefully, and respond faithfully.`,
    },
    {
      heading: "The Life This Leads To",
      body: `As this rhythm of hearing and responding becomes part of your life, something begins to change. You grow in confidence as you learn to recognize God's voice, and you find yourself responding more quickly to what He shows you. You begin to notice where He is already at work, and you naturally step into those moments.

This is more than spiritual growth—it is life with God. It is a way of living where you are continually listening, responding, and allowing what God is doing in you to extend into the lives of others.`,
    },
  ],
  summary:
    "Spiritual breathing is a daily rhythm of hearing from God, responding in obedience, and allowing what He is doing in your life to flow into others.",
} as const;

export const LESSON_SPIRITUAL_BREATHING: LessonDoc = {
  key: "lesson_spiritual_breathing",
  principlePromptName: SPIRITUAL_BREATHING.title,
  sections: SPIRITUAL_BREATHING.sections.map((s) => ({
    heading: s.heading,
    paragraphs: [s.body],
  })),
  summary: {
    heading: "Summary",
    paragraphs: [SPIRITUAL_BREATHING.summary],
  },
};

/** Canonical Dual Accountability lesson (Guided Journey). Wording preserved from product source. */
export const DUAL_ACCOUNTABILITY = {
  title: "Dual Accountability",
  sections: [
    {
      heading: "Every Time God Speaks",
      body: `As you continue to grow in hearing from God, something begins to increase in your life. You gain more understanding, more clarity, and more direction as you spend time in His Word and respond to His leading. Over time, you begin to recognize His voice more clearly and see more of what He is doing.

But with that increase comes something we do not always consider—responsibility. Every time God speaks to you, whether through Scripture, prayer, or a prompting in your heart, you are not simply receiving information. You are being entrusted with something. And that means you are not only accountable to receive what God gives you, but also to respond to it.`,
    },
    {
      heading: "What Dual Accountability Means",
      body: `This is what we mean by dual accountability. When God gives you something—truth, insight, direction, or conviction—you are responsible to do two things with it. You are responsible to obey what He shows you, and you are responsible to share it with others.

This is what Jesus calls faithfulness. Faithfulness is not measured by how much you know or how much you have heard. It is measured by what you do with what you have been given. It is seen in a life that responds to God in obedience and allows what He is doing to extend beyond itself.`,
    },
    {
      heading: "What Jesus Meant",
      body: `Jesus made this clear when He said, "To those who have, more will be given, but from those who do not have, even what they have will be taken away." At first, that statement can seem confusing, but when you look at the context, the meaning becomes clear.

Again and again, Jesus tells stories where something is given and people respond differently. Some act on what they receive. They invest it, steward it, and allow it to grow. Others do nothing. They ignore it, bury it, or set it aside.

The difference is not in what they were given, but in what they did with it. And the outcome is always the same. Faithfulness leads to increase. Unfaithfulness leads to loss.`,
    },
    {
      heading: "A Picture of Faithfulness",
      body: `One way to understand this is to picture a three-legged stool. A stool is only stable when all three legs are present and balanced. If one leg is missing, or even weakened, the entire structure becomes unstable.

In the same way, your spiritual life rests on three connected realities. You receive from God, you respond in obedience, and you share what He is doing with others. When all three are present, there is stability, growth, and multiplication. But when one is missing, something begins to break down.`,
    },
    {
      heading: "When Something Is Off",
      body: `If you receive truth but do not act on it, your life begins to fill with knowledge that produces little change. Over time, what you have heard loses its impact because it is not being lived out. 

If you obey what God shows you but keep it to yourself, growth may still happen in your life, but it remains contained. What God is doing in you does not extend into others, and what could multiply instead stays limited.

And if you share truth without living it, there is a disconnect between your words and your life. The message may be right, but it lacks the weight and authenticity that comes from obedience. In each case, something essential is missing, and the result is a life that is out of alignment with what God intends.`,
    },
    {
      heading: "When It All Comes Together",
      body: `But when these three realities come together—when you receive from God, respond in obedience, and share with others—something powerful begins to happen. What God gives you does not stop with you. It begins to move through you and into the lives of others.

This is what faithfulness looks like. It is a life that is open to God, responsive to His leading, and willing to pass on what has been received. And as this becomes your pattern, you begin to see something multiply that you could never produce on your own.`,
    },
    {
      heading: "Why This Matters",
      body: `God is not primarily looking for people who know more. He is looking for people who are faithful with what they know. When you are faithful in this way, God entrusts you with more. You begin to experience deeper understanding, greater clarity, and a growing sense of responsibility as He continues to work in and through you.

Over time, your life begins to reflect a pattern. You hear from God, you respond in obedience, and you share what He is doing. And as that pattern continues, the impact of your life begins to extend far beyond what you could accomplish on your own.`,
    },
    {
      heading: "Connecting the Dots",
      body: `This is where everything comes together. You have already begun to learn how to engage God personally in His Word, and you are beginning to live in a rhythm of hearing from Him and responding. Now you begin to see that what God gives you carries responsibility.

You are not just receiving for yourself. You are receiving so that you can respond and so that what God is doing in you can move into others. This is how a disciple grows, and this is how a disciple multiplies.`,
    },
  ],
  summary:
    "Dual accountability means that when God gives you something, you are responsible to respond in obedience and to share it with others. This is what Jesus calls faithfulness, and it is how growth and multiplication happen.",
} as const;

export const LESSON_DUAL_ACCOUNTABILITY: LessonDoc = {
  key: "lesson_dual_accountability",
  principlePromptName: DUAL_ACCOUNTABILITY.title,
  sections: DUAL_ACCOUNTABILITY.sections.map((s) => ({
    heading: s.heading,
    paragraphs: [s.body],
  })),
  summary: {
    heading: "Summary",
    paragraphs: [DUAL_ACCOUNTABILITY.summary],
  },
};

const LESSONS: Partial<Record<LinearDiscipleshipStepKey, LessonDoc>> = {
  lesson_self_feeding: LESSON_SELF_FEEDING,
  lesson_spiritual_breathing: LESSON_SPIRITUAL_BREATHING,
  lesson_dual_accountability: LESSON_DUAL_ACCOUNTABILITY,
};

export function getLessonDocForStep(key: LinearDiscipleshipStepKey): LessonDoc | null {
  return LESSONS[key] ?? null;
}
