# Ivy Homes — Software Engineering Internship

A full-stack property application and API audit for Ivy Homes (September 2026).

---

## 1. Setup and How to Run

### Prerequisites
- Node.js >= 20 (tested on v24.16.0)
- npm

### Installation & Environment Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a local `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Populate `.env` with your assigned credentials:
   - `BASE_URL=https://solve.ivy.homes`
   - `API_KEY=IVY26-XXXXXXXXXXXX`
   - `DEMO_EMAIL=demo1@ivy.homes`
   - `DEMO_PASSWORD=<password-from-email>`
   - `ASSIGNED_CITY=Pune`
   - `ASSIGNED_LOCALITY=Magarpatta`

### Scripts
- Run unit tests:
  ```bash
  npm test
  ```
- Run controlled API probe:
  ```bash
  npm run probe
  ```
- Fetch complete datasets (Phase 2):
  ```bash
  npm run fetch
  ```
- Run data analysis and generate answers (Phase 3):
  ```bash
  npm run analyze
  ```

---

## 2. Investigation Log

### Observations
1. **Endpoint `/health`**:
   - Status: `200 OK`.
   - Response: `{"status": "ok", "server_time": "...", "timezone": "Asia/Kolkata", "reference_date": "2026-09-10T00:00:00+05:30"}`.
   - Server clock explicitly includes the `+05:30` IST offset.
2. **Authentication Requirements**:
   - Supplying `?api_key=...` query parameter returns `401 Unauthorized` with detail: `"send your key in the X-API-Key request header, not as a query parameter"`.
   - All collection and data endpoints require **both** `X-API-Key` header and `Authorization: Bearer <access_token>`.
3. **Session Lifecycle & Tokens (`POST /auth/login`, `POST /auth/refresh`)**:
   - Response returns `{ "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 900, "refresh_url": "/auth/refresh", "user": { "email": "..." } }`.
   - Token validity is 900 seconds (15 minutes), not 24 hours (86400 seconds).
   - Calling `POST /auth/refresh` with `{ "refresh_token": "..." }` successfully returns a new `access_token` and resets `expires_in` to 900s.
4. **Pagination Semantics**:
   - Documented `page` query parameter is quietly ignored (requesting `page=1` and `page=2` returns the exact same records).
   - Paging operates strictly via `offset` and `limit`.
   - Server limit is capped at 50 records per page (requesting `limit=100` or `limit=200` returns 50).
   - Response metadata schema is `{ limit, offset, count, total, has_more, results }`.
   - Total records reported: 3643 listings, 1390 rentals, 422 projects (Pune).
5. **Endpoints Layout**:
   - Documented `GET /v1/listing/{id}` 404s; the actual working endpoint is `GET /v1/listings/{id}` (plural).
   - Documented `GET /v1/listings/{id}/similar` returns 404.
   - Documented `GET /v1/favourites` returns 404; the actual working endpoint is `GET /v1/saved`.
   - Documented `GET /v1/analytics/summary` returns 404.
6. **Data Formats & Units**:
   - Listings timestamps in `posted_at` lack timezone/offset (e.g. `'2026-04-30T14:57:00'`), whereas rentals have UTC `'Z'` suffix.
   - Projects `price_min` and `price_max` are not in rupees (sample `P30001` has `price_min: 80`, `price_max: 3.22`, indicating Lakhs/Crores).

### Confirmed Discrepancies (Findings)
1. **API Key Transport**
   - **Endpoint**: `*`
   - **Category**: `auth`
   - **Documented**: "Append it as a query parameter: `GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX`"
   - **Actual**: API rejects query parameter with `401` and requires `X-API-Key` HTTP header.
   - **How found**: Probing `GET /v1/listings?api_key=...` vs `X-API-Key` header.
   - **Impact**: All API queries fail if key is passed via URL query parameter.
2. **Mandatory Bearer Token for Listings**
   - **Endpoint**: `/v1/listings`
   - **Category**: `auth`
   - **Documented**: Implied listings can be read with just API key.
   - **Actual**: Returns `401 {"detail": "missing bearer token - log in at POST /auth/login first"}` without valid Bearer token.
   - **How found**: Probing `/v1/listings` with `X-API-Key` header only.
   - **Impact**: Data cannot be accessed without logging in first.
3. **Login Token Property and Expiry**
   - **Endpoint**: `/auth/login`
   - **Category**: `auth`
   - **Documented**: Returns field `"token"`, valid for 24 hours (`expires_in: 86400`). "There is no refresh flow."
   - **Actual**: Returns `"access_token"`, `"refresh_token"`, `"refresh_url": "/auth/refresh"`, and expires in 15 minutes (`expires_in: 900`).
   - **How found**: Inspected `POST /auth/login` response body.
   - **Impact**: Clients must read `access_token` and renew via `POST /auth/refresh` before 15 minutes expire.
4. **Listing Detail Path**
   - **Endpoint**: `/v1/listing/{id}`
   - **Category**: `missing_endpoint`
   - **Documented**: `GET /v1/listing/{listing_id}` (singular).
   - **Actual**: Singular path returns `404 {"detail": "Not Found"}`. Actual path is `GET /v1/listings/{listing_id}` (plural).
   - **How found**: Tested both paths with sample listing `DWE-3002501`.
   - **Impact**: Detail pages fail if singular path is used.
5. **Similar Listings Endpoint Missing**
   - **Endpoint**: `/v1/listings/{id}/similar`
   - **Category**: `missing_endpoint`
   - **Documented**: `GET /v1/listings/{listing_id}/similar` returns up to ten comparable listings.
   - **Actual**: Returns `404 {"detail": "Not Found"}`.
   - **How found**: Called endpoint with sample listing `DWE-3002501`.
   - **Impact**: Similar listings widget cannot rely on backend endpoint.
6. **Saved Listings Path**
   - **Endpoint**: `/v1/favourites`
   - **Category**: `missing_endpoint`
   - **Documented**: `GET /v1/favourites`, `POST /v1/favourites`, `DELETE /v1/favourites/{id}`.
   - **Actual**: `/v1/favourites` returns `404 {"detail": "Not Found"}`. The actual endpoint is `/v1/saved`.
   - **How found**: Path scan of candidate endpoints with active Bearer token.
   - **Impact**: Favourites fail if using `/v1/favourites`.
7. **Analytics Summary Endpoint Missing**
   - **Endpoint**: `/v1/analytics/summary`
   - **Category**: `missing_endpoint`
   - **Documented**: Pre-computed aggregates for the city at `GET /v1/analytics/summary`.
   - **Actual**: Returns `404 {"detail": "Not Found"}`.
   - **How found**: Probing `GET /v1/analytics/summary`.
   - **Impact**: Insights dashboard must compute aggregates from full dataset.
8. **Pagination Parameter & Limit Cap**
   - **Endpoint**: `/v1/listings`
   - **Category**: `pagination`
   - **Documented**: Pagination uses `page` (default 1) and `limit` (max 200).
   - **Actual**: `page` parameter is ignored. Pagination uses `offset`. Max `limit` is capped at 50 records.
   - **How found**: Probed with `page=1` vs `page=2` (identical records) and `offset=0` vs `offset=2` (advancing records), and tested `limit=100`, `limit=200` (both returned 50).
   - **Impact**: Retrieval code must use `offset` and cannot request pages larger than 50.
9. **Project Price Units**
   - **Endpoint**: `/v1/projects`
   - **Category**: `units`
   - **Documented**: "price_min and price_max are in rupees."
   - **Actual**: Values are in Lakhs and Crores (e.g. `price_min: 80` [Lakhs], `price_max: 3.22` [Crores] on `P30001`).
   - **How found**: Inspected project records from `/v1/projects`.
   - **Impact**: Project price calculations require unit normalization.
10. **Timestamp Formatting & Timezone**
    - **Endpoint**: `/v1/listings`
    - **Category**: `timestamps`
    - **Documented**: "ISO 8601, UTC, Z suffix, everywhere in the API."
    - **Actual**: Listing timestamps lack `Z` or timezone offsets (e.g. `2026-04-30T14:57:00`).
    - **How found**: Inspected `posted_at` fields across listings.
    - **Impact**: Naive parsing might assume local browser timezone instead of IST.
11. **Server Metadata `total` Undercounts Retrievable Records**
    - **Endpoint**: `/v1/listings`, `/v1/rentals`, `/v1/projects`
    - **Category**: `completeness`
    - **Documented**: "total is the exact number of records matching your filters. To fetch every record, read total, divide by your limit, and request that many pages."
    - **Actual**: The `total` metadata field under-reports actual retrievable records across all three collections:
      - Listings: reported `total=3643`, but actual retrievable is `3800` (+157 records).
      - Rentals: reported `total=1390`, but actual retrievable is `1450` (+60 records).
      - Projects: reported `total=422`, but actual retrievable is `440` (+18 records).
    - **How found**: Full retrieval paging until `has_more === false` and verified boundary offsets.
    - **Impact**: Stopping retrieval when `offset >= total` truncates valid dataset records. Clients must paginate until `has_more === false`.




12. **MagicHomes Area Units in Square Meters**
    - **Endpoint**: `/v1/listings`
    - **Category**: `units`
    - **Documented**: "carpet_area and super_built_up_area are in square feet."
    - **Actual**: On `website === 'magichomes'`, records with `carpet_area < 300` (306 listings) are encoded in square meters (`val * 10.7639` sqft), matching identical cross-portal duplicate listings within 0-16 sqft.
    - **How found**: Cross-portal identical property matching between MagicHomes and other portals.
    - **Impact**: Calculating price per sqft without conversion inflates metrics by ~10.76x on those records.
13. **Rental Deposit Unit Inconsistency**
    - **Endpoint**: `/v1/rentals`
    - **Category**: `units`
    - **Documented**: "deposit is in rupees."
    - **Actual**: Values `<= 10` (307 records) represent month multipliers (`deposit * monthly_rent`), whereas values `> 10` are absolute INR amounts.
    - **How found**: Bimodal distribution and clustering of values 1-10 vs 30,000-500,000.
    - **Impact**: Summing deposits directly mixes multipliers with currency amounts.
14. **Project `total_listings` Definition and Mismatches**
    - **Endpoint**: `/v1/projects`
    - **Category**: `data_integrity`
    - **Documented**: "total_listings reports how many listings belong to this project."
    - **Actual**: Represents live linked listings (`is_live === true`). On 95 out of 440 projects, the reported count is incorrect (41 stale zeroes, 48 over-reported phantom counts, 6 under-reported).
    - **How found**: Full join between projects and listings grouped by `project_id` and `is_live`.
    - **Impact**: Question 10 answer is exactly 95 projects with wrong listing count.

15. **Objective Physical Impossibilities (Corrupt Listings)**
    - **Endpoint**: `/v1/listings`
    - **Category**: `data_quality`
    - **Documented**: "Listings represent valid physical properties."
    - **Actual**: Exactly 28 listings describe physical impossibilities: negative price (7), floor > total_floors (7), super < carpet area (7), and swapped coordinates placing properties in the Arctic Ocean (7).
    - **How found**: Exhaustive field boundary and physical consistency audit.
    - **Impact**: Must be excluded from market metrics such as avg_price_per_sqft_2bhk.
16. **Lead-Generation Syndicate Network (Fake Listings)**
    - **Endpoint**: `/v1/listings`
    - **Category**: `fraud`
    - **Documented**: "Listings represent genuine property offers."
    - **Actual**: 205 listings belong to a coordinated 7-broker syndicate, supported by shared contact numbers, repeated fictitious identities, copied inventory, systematic price undercutting, and corroborating scam-language evidence in 110 records.
    - **How found**: Graph network analysis of contact numbers, shared broker names, price distributions, and scam language.
    - **Impact**: Must be excluded from market metrics such as avg_price_per_sqft_2bhk.

### Phase 3B Classification Methodology Summary
1. **Property Identity (Question 2)**:
   - **Methodology**: Evaluated multi-signal composite key (`cleanApartmentName(name) | locality | property_type | bedroom | floor | total_floors | facing_direction`) corroborated by normalized carpet area (within ±3% tolerance) and geographic distance (<= 200m).
   - **Result**: Exactly 520 high-confidence duplicate groups containing 1,090 records (429 cross-portal, 91 same-portal). Yields **3,230 unique physical properties** from 3,800 records.
2. **Corrupt Listings (Question 4)**:
   - **Methodology**: Restricted strictly to objective physical impossibilities: negative prices (7), floor exceeding building total (7), super built-up area less than carpet area (7), and swapped geographic coordinates placing properties outside India (7).
   - **Result**: Exactly **28 core defensible corrupt listing IDs**.
3. **Fake Listings (Question 9)**:
   - **Methodology**: Multi-signal corroboration tracking a coordinated 7-broker syndicate network sharing fictitious agency names, systematic price undercutting (~47% below market rate), owner listing replication/undercutting, and corroborating scam-language evidence in 110 records.
   - **Result**: Exactly **205 syndicate listings** (supported by shared contact numbers, repeated fictitious identities, copied inventory, systematic price undercutting, and corroborating scam-language evidence in 110 records). Isolated micro-price records (< ₹50,000 INR) were rejected from the fake set due to lack of syndicate coordination.

### Rejected Hypotheses
- **Hypothesis**: The API key can be passed via query string.
  - *Result*: Rejected. Server responds with 401 and explicitly mandates `X-API-Key` header.
- **Hypothesis**: Collection endpoints can be retrieved with only the API key.
  - *Result*: Rejected. Server responds with 401 stating a Bearer token is required.
- **Hypothesis**: The API does not have a refresh flow and tokens last 24 hours.
  - *Result*: Rejected. Tokens expire in 15 minutes and `/auth/refresh` exists and works.
- **Hypothesis**: Pagination is 1-indexed page-based.
  - *Result*: Rejected. The server ignores `page` and uses `offset`.
- **Hypothesis**: Grouping properties merely by apartment name, phone number, or coordinates is sufficient.
  - *Result*: Rejected. Causes severe over-merging across distinct floors, units, and facing directions.
- **Hypothesis**: Low price, strange descriptions, or unverified status alone indicate corrupt listings.
  - *Result*: Rejected. Corruption is strictly reserved for physical impossibilities that cannot exist.
- **Hypothesis**: High listing count alone or standard negotiation phrases indicate fake listings.
  - *Result*: Rejected. Verified legitimate property owners frequently use "Urgent sale" or "Price negotiable", and legitimate brokers maintain large portfolios without fraud.
- **Hypothesis**: Isolated micro-price listings (< ₹50,000 INR) belong to the fake listing syndicate.
  - *Result*: Rejected. The 7 micro-price listings are not linked to the 7 syndicate phones or agencies, have no duplicate owner matches, and low price alone does not prove fraudulent intent under assignment rules.

---

## 3. Tooling & Disclosures
- Built with Node.js built-in `fetch`, `node:test`, and ESM scripts.
- LLM assistance used for rapid hypothesis formulation, testing, and script scaffolding.
