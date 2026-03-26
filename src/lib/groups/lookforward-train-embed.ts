/**
 * When `train_commitment` column is missing (migration 027 not applied),
 * we embed train text in `sharing_commitment` after this delimiter.
 * Reads split sharing vs train so the UI stays correct.
 */
export const LOOKFORWARD_TRAIN_DELIM = "\n\n---lf-train---\n\n";

type Row = {
  sharing_commitment?: string | null;
  train_commitment?: string | null;
};

export function splitSharingAndTrain(row: Row): {
  sharing: string;
  train: string;
} {
  const explicit = String(row.train_commitment ?? "").trim();
  if (explicit) {
    return {
      sharing: String(row.sharing_commitment ?? ""),
      train: explicit,
    };
  }
  const raw = String(row.sharing_commitment ?? "");
  const i = raw.indexOf(LOOKFORWARD_TRAIN_DELIM);
  if (i >= 0) {
    return {
      sharing: raw.slice(0, i).trimEnd(),
      train: raw.slice(i + LOOKFORWARD_TRAIN_DELIM.length).trim(),
    };
  }
  return { sharing: raw, train: "" };
}

/** Merge DB row into canonical fields for UI / maps. */
export function normalizeLookforwardRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const { sharing, train } = splitSharingAndTrain({
    sharing_commitment: row.sharing_commitment as string | null | undefined,
    train_commitment: row.train_commitment as string | null | undefined,
  });
  return {
    ...row,
    sharing_commitment: sharing,
    train_commitment: train,
  };
}

export function embedTrainInSharing(sharing: string, train: string): string {
  const t = train.trim();
  if (!t) return sharing;
  return `${sharing}${LOOKFORWARD_TRAIN_DELIM}${t}`;
}

export function isTrainColumnSchemaError(message: string): boolean {
  return (
    /train_commitment/i.test(message) || /schema cache/i.test(message)
  );
}
