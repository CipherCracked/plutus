## Problem to solve

The seed script must populate a `rewards` table with 4–6 reward items at specific coin costs. The catalogue defines what users can redeem their earned coins for, and the coin costs must feel proportionate to the average coin yield from the 10,000-transaction dataset. This is a product decision — the reward items, their descriptions, and their coin pricing directly shape the user's perception of the rewards program.

## Options

### Option 1: Tiered cashback rewards based on transaction value
Offer progressive cashback vouchers: ₹50 off (100 coins), ₹100 off (200 coins), ₹250 off (400 coins), ₹500 off (750 coins). Rewards are denominated in the same currency (INR) as the spending data, making the value immediately clear.

- *How it feels:* Direct, transactional — "I spent ₹5,000, earned 50 coins, now I save ₹50." Clear ROI.
- *When it makes sense:* When the audience values practical savings over gamification.

### Option 2: Mixed catalogue — vouchers + lifestyle rewards
Combine practical vouchers with aspirational lifestyle rewards: Amazon/Flipkart vouchers (200–500 coins), mobile data top-up (150 coins), OTT subscription trial (300 coins), charity donation option (100 coins), and a premium feature (e.g., ad-free analytics, 400 coins).

- *How it feels:* More engaging — "I can buy data, donate, or go ad-free." Broader appeal.
- *When it makes sense:* When you want to demonstrate a range of reward types and engage different user motivations (practical, social, premium).

### Option 3: Gamified tier badges + perks
Instead of redeemable items, offer status badges or profile customization: "Bronze Saver" (100 coins), "Silver Spender" (500 coins), "Gold Guardian" (1,000 coins). Each badge unlocks a perk (custom theme, early feature access, profile flair).

- *How it feels:* Achievement-oriented — collecting status rather than spending coins.
- *When it makes sense:* When the app has a long user lifecycle and badges encourage retention.

## Reasoning

The 10k-transaction dataset has an amount range of -₹53,652 to ₹999,999,999. If we compute the average coin yield per transaction (1 coin per ₹100, capped at 50), most small transactions earn 0–5 coins, while large transactions earn 50 (the cap). The aggregate balance across all successful transactions is likely in the thousands or tens of thousands of coins.

This means **Option 1 (cashback vouchers)** is the strongest foundation because:
- The coin costs (100–750) are proportionate to the aggregate balance
- Cashback in INR is immediately understandable for an Indian consumer audience
- Vouchers have concrete value, making the redemption feel worthwhile

**Option 2 (mixed catalogue)** is a strong enhancement — it adds personality and demonstrates a broader reward system. For the foundation, starting with 4 core rewards (all cashback/digital vouchers) is sufficient, with the option to add lifestyle rewards later.

**Option 3 (badges)** is interesting but shifts the model from "spend coins to receive value" to "collect badges for status." This changes the redemption flow fundamentally and may not satisfy the assignment's "redeem coins against a catalogue of rewards" requirement.

## Tradeoffs

- **Option 1**: Narrow but clear value proposition. Risk: feels utilitarian.
- **Option 2**: Broad appeal but requires more design (icons, descriptions per reward type). Risk: some rewards may feel filler.
- **Option 3**: Engaging for retention but doesn't satisfy "redeem coins against rewards" — badges aren't redeemable items.

## Notes

The coin cost for each reward should be set such that the average transaction's coin yield can plausibly purchase at least the lowest-tier reward. This means the lowest-cost reward should require 100–200 coins. The assignment asks for 4–6 rewards; 4 is the minimum to satisfy the requirement while keeping the catalogue tight.
