-- Look Forward: third commitment field (Obey · Share · Train).
ALTER TABLE lookforward_responses
  ADD COLUMN IF NOT EXISTS train_commitment TEXT NOT NULL DEFAULT '';
