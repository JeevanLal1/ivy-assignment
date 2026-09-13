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



### Rejected Hypotheses
- **Hypothesis**: The API key can be passed via query string.
  - *Result*: Rejected. Server responds with 401 and explicitly mandates `X-API-Key` header.
- **Hypothesis**: Collection endpoints can be retrieved with only the API key.
  - *Result*: Rejected. Server responds with 401 stating a Bearer token is required.
- **Hypothesis**: The API does not have a refresh flow and tokens last 24 hours.
  - *Result*: Rejected. Tokens expire in 15 minutes and `/auth/refresh` exists and works.
- **Hypothesis**: Pagination is 1-indexed page-based.
  - *Result*: Rejected. The server ignores `page` and uses `offset`.

### Unresolved Questions
- Exact unit transition threshold for project prices (whether `< 10` is Crores and `>= 10` is Lakhs, or based on specific fields). Full dataset analysis will establish this.
- Server-side filter effectiveness: whether `locality`, `bhk`, etc. query parameters actually filter the API response or return unfiltered results. Full dataset fetch will allow baseline comparison.

---

## 3. Tooling & Disclosures
- Built with Node.js built-in `fetch`, `node:test`, and ESM scripts.
- LLM assistance used for rapid hypothesis formulation, testing, and script scaffolding.
