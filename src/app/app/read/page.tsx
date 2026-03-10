import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/scripture/books";
import { BookOpen } from "lucide-react";

export default function ReadPage() {
  const ot = BIBLE_BOOKS.filter((b) => b.testament === "OT");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-2">
        Read Scripture
      </h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">
        Choose a book to begin reading
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-2">
            <BookOpen className="size-4" />
            Old Testament
          </h2>
          <ul className="space-y-1">
            {ot.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/app/read/${book.id}/1`}
                  className="block py-1.5 px-2 -mx-2 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  {book.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-2">
            <BookOpen className="size-4" />
            New Testament
          </h2>
          <ul className="space-y-1">
            {nt.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/app/read/${book.id}/1`}
                  className="block py-1.5 px-2 -mx-2 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  {book.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
