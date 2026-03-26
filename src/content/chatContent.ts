/**
 * Single source of truth for CHAT informational copy (app + public invite pages).
 * Do not duplicate these strings elsewhere.
 */

export const CHAT_CONTENT = {
  pageTitle: "CHAT groups",
  pageOverview:
    "What a CHAT group is, how meetings flow, and how to grow in accountability together.",

  growthInvite: {
    emailSubject: "You're invited to start a CHAT Group",
    /** Short paragraph used in the growth invite email body */
    frameworkBlurb:
      "CHAT is a simple discipleship and accountability framework designed to help people grow intentionally with others through consistent spiritual conversation, encouragement, and action.",
  },

  accountabilityGuideCard: {
    title: "Accountability questions and evangelistic prayers",
    description:
      "Weekly questions for your meeting, plus prayer prompts for those who need Christ.",
    buttonLabel: "Open accountability guide",
  },

  sections: [
    {
      id: "what-is",
      heading: "What is a CHAT group?",
      blocks: [
        {
          kind: "p" as const,
          text: "{{CHAT_STRONG}} is an acronym for:",
        },
        {
          kind: "acronym" as const,
          items: [
            { letter: "C", phrase: "Check your progress" },
            { letter: "H", phrase: "Hear the Word" },
            { letter: "A", phrase: "Act on it" },
            { letter: "T", phrase: "Tell others" },
          ],
        },
        {
          kind: "p" as const,
          text:
            "A CHAT group is made up of two or three people, all of the same gender, who meet weekly for 60–90 minutes for personal accountability for their spiritual growth and development. It is recommended the group not grow past three but rather multiply into two groups of two once the fourth participant has proven faithful to the process.",
        },
        {
          kind: "p" as const,
          text:
            "A CHAT group is a simple way to release the most essential elements of a vital spiritual walk to people who need Jesus to change their lives from the inside out. This tool empowers the ordinary Christian to accomplish the extraordinary work of reproducing spiritual disciples who can in turn reproduce others. There is no curriculum, workbook or training involved. There is no leader needed in the group. A CHAT group is the simplest form of spiritual community and provides ongoing accountability to learn, obey, and pass on spiritual truth. It incorporates the values of living a balanced spiritual life which results in the development and reproduction of disciples.",
        },
        {
          kind: "p" as const,
          text:
            "There are only two suggested qualifications for starting or joining a CHAT group:",
        },
        {
          kind: "ol" as const,
          anchorId: "chat-who-its-for",
          items: [
            "A desperate need for Jesus Christ (Luke 5:29–32).",
            "Faithfulness in the process itself (2 Timothy 2:2).",
          ],
        },
      ],
    },
    {
      id: "groups-and-others",
      heading: "CHAT groups and others",
      blocks: [
        {
          kind: "p" as const,
          text:
            "Remember that accountability to Scripture involves not only applying it to one’s own life, but also blessing others by passing on to them what you are learning. Always consider if there is someone outside the CHAT you should be sharing spiritual truth with and make this part of the accountability process.",
        },
        {
          kind: "p" as const,
          text:
            "Be specific when developing an application plan. Think through when, how, and with whom you will put what you are learning into practice. Make sure to follow up with checking on progress in succeeding weeks.",
        },
      ],
    },
    {
      id: "format",
      heading: "Format of a CHAT group",
      blocks: [
        {
          kind: "subsection" as const,
          title: "Check your progress — Fellowship",
          paragraphs: [
            "We are motivated by sharing struggles in mutual accountability. Start the time together by going over the {{ACCOUNTABILITY}} with one another (45–60 minutes).",
          ],
        },
        {
          kind: "subsection" as const,
          title: "Hear the Word — Discipleship",
          paragraphs: [
            "We grow spiritually as we read Scripture in context and in community. Continue the time by discussing what the Lord has impressed on you from your weekly Scripture reading. Your group should read 25–30 chapters per week (for example, read the book of 1 Samuel or read the book of Ephesians five times). Many people find it helpful to read aloud. If you prefer to listen to Scripture, you can download The World English Bible, a public domain audio version, for free at {{AUDIOTREASURE}}. If someone doesn’t finish the reading in a given week then the entire group takes the same assignment for the following week.",
          ],
        },
        {
          kind: "subsection" as const,
          title: "Act on it — Ministry",
          paragraphs: [
            "We serve as we apply the truths of Scripture to living in love towards others day by day. Live out what the Lord impressed on you in the reading to apply it to your life and pass the truths on to others (5–10 minutes).",
          ],
        },
        {
          kind: "subsection" as const,
          title: "Tell others — Evangelism",
          paragraphs: [
            "We pray for those who need the Lord and reach out to them as we have opportunity. Close in a time of prayer. Pray for one another. Part of this time should be praying for the lost friends, family, and acquaintances for whom the group has been praying throughout the week (5–10 minutes).",
          ],
        },
        {
          kind: "subsection" as const,
          title: "Worship",
          paragraphs: [
            "We acknowledge God in prayer and through our obedience. In your time of prayer, do not forget to praise and thank the Lord for who He is and what He is doing in and through you as a group and as individuals. Remember too, your obedience (“Act on it”) to the Lord is in itself worship! (5 minutes)",
          ],
        },
      ],
    },
    {
      id: "accountability",
      heading: "Thoughts on accountability",
      blocks: [
        {
          kind: "p" as const,
          text:
            "CHAT groups involve the sharing of an extremely personal nature. It is imperative that you come to a clear agreement on the confidentiality of whatever is shared in the group. Discuss the limits of confidentiality (for example, how things will be handled if information is revealed which involves the safety of someone or illegal activities).",
        },
        {
          kind: "p" as const,
          text: "Consider using 2 Timothy 3:16 as an outline for application to your life:",
        },
        {
          kind: "blockquote" as const,
          quote:
            "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.",
          citation: "— 2 Timothy 3:16–17 (NIV)",
        },
        {
          kind: "applicationBullets" as const,
          items: [
            { term: "Teaching", rest: "— what we should know" },
            { term: "Rebuking", rest: "— what we should avoid or stop doing" },
            { term: "Correcting", rest: "— what we should do differently" },
            { term: "Training in righteousness", rest: "— what we should begin or continue doing" },
          ],
        },
      ],
    },
  ],

  publicInvite: {
    /** Jump links — labels describe themes; targets are anchors in shared sections (no extra copy). */
    sectionNav: [
      { href: "#what-is", label: "What CHAT is" },
      { href: "#groups-and-others", label: "Why it matters" },
      { href: "#format", label: "How it works" },
      { href: "#chat-who-its-for", label: "Who it’s for" },
    ],
    invalidTokenTitle: "This invite link isn’t available",
    invalidTokenBody:
      "The link may be incorrect or no longer valid. If a friend sent you this link, ask them to send a new invitation.",
    accountabilityLinkLabel: "Accountability Questions",
    audiotreasureLabel: "audiotreasure.com",
    audiotreasureUrl: "https://www.audiotreasure.com/webindex.htm",
    ctaAfterLoginPath: "/app/chat",
    accountabilityAfterLoginPath: "/app/chat/accountability-questions",
  },
} as const;

export type ChatContentSection = (typeof CHAT_CONTENT.sections)[number];
