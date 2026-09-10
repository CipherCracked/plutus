# Ideas

## 1. Transaction mutation (add/delete/modify)
Allow users to add, delete, and modify transactions. This turns Plutus into a functional spending tracker rather than a static demo with a fixed dataset (`transactions.json`). Would require new endpoints (POST/DELETE/PUT `/api/transactions`), UI forms for entry/edit, and validation (timestamp normalization, duplicate ID checks, coin recalculation).

## 2. AI intelligence (data questions + recommendations)
Add an AI that answers questions based on user data: "What are my expenses?", "How can I reduce them?", trends, anomalies. Could use a lightweight LLM integration or structured analytics endpoint that feeds into a chat interface. Scope: read-only analysis of transactions, balance, categories — no mutation.

## 3. Encryption / data privacy
Investigate whether Supabase encrypts data at rest or if we need application-level encryption. Check: does Supabase show us decrypted data via SQL? If not, what encryption options exist (`pgcrypto`, client-side encryption)? Uncertain if this is a real gap or already handled by Supabase defaults.
