import type { Chapter } from "./types";

/**
 * Mock Scripture data for MVP development.
 * Replace this with a licensed Bible API adapter when available.
 * Structure: bookId -> chapter -> verses
 */
const MOCK_CHAPTERS: Record<string, Record<number, { verse: number; text: string }[]>> = {
  psalms: {
    23: [
      { verse: 1, text: "The Lord is my shepherd; I shall not want." },
      { verse: 2, text: "He makes me lie down in green pastures. He leads me beside still waters." },
      { verse: 3, text: "He restores my soul. He leads me in paths of righteousness for his name's sake." },
      { verse: 4, text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
      { verse: 5, text: "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows." },
      { verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever." },
    ],
  },
  john: {
    3: [
      { verse: 1, text: "Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews." },
      { verse: 2, text: "This man came to Jesus by night and said to him, \"Rabbi, we know that you are a teacher come from God, for no one can do these signs that you do unless God is with him.\"" },
      { verse: 3, text: "Jesus answered him, \"Truly, truly, I say to you, unless one is born again he cannot see the kingdom of God.\"" },
      { verse: 4, text: "Nicodemus said to him, \"How can a man be born when he is old? Can he enter a second time into his mother's womb and be born?\"" },
      { verse: 5, text: "Jesus answered, \"Truly, truly, I say to you, unless one is born of water and the Spirit, he cannot enter the kingdom of God.\"" },
      { verse: 6, text: "That which is born of the flesh is flesh, and that which is born of the Spirit is spirit." },
      { verse: 7, text: "Do not marvel that I said to you, 'You must be born again.'" },
      { verse: 8, text: "The wind blows where it wishes, and you hear its sound, but you do not know where it comes from or where it goes. So it is with everyone who is born of the Spirit.\"" },
      { verse: 9, text: "Nicodemus said to him, \"How can these things be?\"" },
      { verse: 10, text: "Jesus answered him, \"Are you the teacher of Israel and yet you do not understand these things?" },
      { verse: 11, text: "Truly, truly, I say to you, we speak of what we know, and bear witness to what we have seen, but you do not receive our testimony." },
      { verse: 12, text: "If I have told you earthly things and you do not believe, how can you believe if I tell you heavenly things?" },
      { verse: 13, text: "No one has ascended into heaven except he who descended from heaven, the Son of Man." },
      { verse: 14, text: "And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up," },
      { verse: 15, text: "that whoever believes in him may have eternal life." },
      { verse: 16, text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life." },
      { verse: 17, text: "For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him." },
      { verse: 18, text: "Whoever believes in him is not condemned, but whoever does not believe is condemned already, because he has not believed in the name of the only Son of God." },
      { verse: 19, text: "And this is the judgment: the light has come into the world, and people loved the darkness rather than the light because their works were evil." },
      { verse: 20, text: "For everyone who does wicked things hates the light and does not come to the light, lest his works should be exposed." },
      { verse: 21, text: "But whoever does what is true comes to the light, so that it may be clearly seen that his works have been carried out in God.\"" },
    ],
  },
  genesis: {
    1: [
      { verse: 1, text: "In the beginning, God created the heavens and the earth." },
      { verse: 2, text: "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters." },
      { verse: 3, text: "And God said, \"Let there be light,\" and there was light." },
      { verse: 4, text: "And God saw that the light was good. And God separated the light from the darkness." },
      { verse: 5, text: "And God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day." },
    ],
  },
  matthew: {
    5: [
      { verse: 1, text: "Seeing the crowds, he went up on the mountain, and when he sat down, his disciples came to him." },
      { verse: 2, text: "And he opened his mouth and taught them, saying:" },
      { verse: 3, text: "\"Blessed are the poor in spirit, for theirs is the kingdom of heaven." },
      { verse: 4, text: "Blessed are those who mourn, for they shall be comforted." },
      { verse: 5, text: "Blessed are the meek, for they shall inherit the earth." },
      { verse: 6, text: "Blessed are those who hunger and thirst for righteousness, for they shall be satisfied." },
      { verse: 7, text: "Blessed are the merciful, for they shall receive mercy." },
      { verse: 8, text: "Blessed are the pure in heart, for they shall see God." },
      { verse: 9, text: "Blessed are the peacemakers, for they shall be called sons of God." },
      { verse: 10, text: "Blessed are those who are persecuted for righteousness' sake, for theirs is the kingdom of heaven.\"" },
    ],
  },
};

/**
 * Generate placeholder verses for chapters not in mock data.
 * In production, this would come from the Bible API.
 */
function generatePlaceholderVerses(chapterNum: number, count: number = 20): { verse: number; text: string }[] {
  return Array.from({ length: Math.min(count, 30) }, (_, i) => ({
    verse: i + 1,
    text: `[Verse ${i + 1} — Connect a licensed Bible API to display full text. This is placeholder content for ${chapterNum}:${i + 1}.]`,
  }));
}

export function getMockChapter(bookId: string, bookName: string, chapterNum: number): Chapter | null {
  const bookChapters = MOCK_CHAPTERS[bookId];
  const verses = bookChapters?.[chapterNum];

  if (verses) {
    return {
      book: bookName,
      bookId,
      chapter: chapterNum,
      verses,
    };
  }

  return {
    book: bookName,
    bookId,
    chapter: chapterNum,
    verses: generatePlaceholderVerses(chapterNum),
  };
}
