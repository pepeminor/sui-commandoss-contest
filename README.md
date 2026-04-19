# Verse — Decentralized Content Marketplace on SUI

A decentralized content platform where creators publish encrypted content on-chain and fans buy NFTs to unlock permanent access. Payments go directly from buyer to creator via smart contract — the platform never holds funds and cannot delete content.

**Live demo:** [sui-marketplace-nu.vercel.app](https://sui-marketplace-nu.vercel.app)

## How It Works

1. **Creator** publishes content (text, audio) → encrypted with [Seal](https://docs.sui.io/guides/developer/seal) and stored on-chain / [Walrus](https://docs.walrus.site)
2. **Fan** mints an NFT → pays the price in SUI directly to the creator's wallet
3. **NFT holder** can decrypt and access the content forever — even after resale, the new holder gets access

No backend. No middleman. Content ownership enforced by the blockchain.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | [SUI Testnet](https://docs.sui.io) |
| Smart Contracts | [Move](https://docs.sui.io/concepts/sui-move-concepts) (4 modules) |
| Auth | [Enoki](https://docs.enoki.mystenlabs.com) (zkLogin via Google OAuth) |
| Encryption | [Seal](https://docs.sui.io/guides/developer/seal) (on-chain access control) |
| File Storage | [Walrus](https://docs.walrus.site) (decentralized blob storage) |
| Frontend | [Next.js 16](https://nextjs.org) + TypeScript |
| Styling | SCSS (BEM convention) |
| State | [TanStack Query](https://tanstack.com/query) |
| i18n | English + Vietnamese |

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Feed (discover content)
│   ├── create/             # Publish new content
│   ├── post/[id]/          # Post detail + decrypt
│   ├── library/            # Buyer's purchased content
│   ├── dashboard/          # Creator's analytics
│   └── auth/callback/      # OAuth callback
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (SUI client, Seal, Walrus, crypto)
├── i18n/                   # Translations (en.json, vi.json)
├── styles/                 # SCSS stylesheets (BEM)
├── move/                   # Move smart contracts
│   └── sources/
│       ├── post.move       # Post shared object + mint_nft
│       ├── nft.move        # ContentNFT struct
│       ├── seal_policy.move # Seal decrypt authorization
│       └── platform.move   # Platform config (fees)
└── __tests__/              # Unit tests (Vitest)
```

## Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm
- **SUI CLI** — [install guide](https://docs.sui.io/guides/developer/getting-started/sui-install)

```bash
curl -sSf https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
suiup install sui@testnet
```

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd sui-marketplace
pnpm install
```

### 2. Deploy the Move smart contracts

```bash
cd move
sui client publish --gas-budget 200000000 --network testnet
```

Copy the **Package ID** from the output — you'll need it for the environment variables.

### 3. Set up external services

**Enoki (zkLogin):**
1. Go to [enoki.mystenlabs.com](https://enoki.mystenlabs.com)
2. Create an app → select **testnet**
3. Set up Google OAuth provider
4. Set redirect URI to `http://localhost:3000/auth/callback`
5. Copy the API key

**Google Cloud Console (OAuth):**
1. Create an OAuth 2.0 Client ID
2. Add `http://localhost:3000/auth/callback` as authorized redirect URI
3. Copy the Client ID

**Supabase (comments):**
1. Create a project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
# SUI Network
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_GRPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_SUI_GRAPHQL_URL=https://graphql.testnet.sui.io/graphql

# Smart Contracts (from step 2)
NEXT_PUBLIC_PACKAGE_ID=
NEXT_PUBLIC_SEAL_PACKAGE_ID=

# Auth — Enoki + Google OAuth (from step 3)
NEXT_PUBLIC_ENOKI_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Supabase — comments (from step 3)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |

## Smart Contract Overview

The Move contracts live in `move/sources/` and handle all on-chain logic:

- **post.move** — Creates `Post` shared objects with encrypted content, emits `PostCreated` events for feed indexing, and handles NFT minting with direct SUI payment to the author
- **nft.move** — Defines `ContentNFT` with edition tracking, tied to a specific post
- **seal_policy.move** — Entry function for Seal decryption authorization (verifies NFT ownership before allowing decryption)
- **platform.move** — Platform configuration for future fee collection

Key design decisions:
- Posts are **shared objects** (not owned) — queried via GraphQL events, not `listOwnedObjects`
- All amounts are in **MIST** (1 SUI = 1,000,000,000 MIST)
- Payment transfers happen atomically within the `mint_nft` function

## Audio Streaming

Audio content uses a custom encrypted streaming pipeline:

1. **Upload:** WAV files are transcoded to WebM/Opus, then encrypted with chunked AES-GCM and uploaded to Walrus
2. **Playback:** Seal decrypts the AES key → Walrus streams encrypted chunks → client decrypts on-the-fly → audio plays after buffering ~20 seconds

This enables near-instant playback for large audio files without downloading the entire file first.

## Deployment

The app deploys to Vercel directly from the local machine:

```bash
npx vercel --prod
```

Make sure all `NEXT_PUBLIC_*` environment variables are configured in your Vercel project settings.

## License

MIT
