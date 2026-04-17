CLAUDE.md — SUI Content Platform
Tổng quan
Nền tảng phi tập trung: creator đăng nội dung → fan mua NFT → NFT là chìa khóa truy cập mãi mãi. Tiền chuyển thẳng artist ↔ buyer qua smart contract. Platform không giữ tiền, không thể xóa content.

Tagline: Nội dung thuộc về creator. Quyền truy cập thuộc về người mua.

Business Logic
Artist đăng bài → set giá + max supply
Buyer mint NFT → tự trả gas + giá → SUI thẳng artist
NFT = quyền đọc content, tradeable (ai giữ NFT là đọc được kể cả resale)
Content Seal encrypt on-chain → không có NFT = không decrypt được
Revenue (Phase 3): platform fee % từ primary sale
Chi phí mainnet: Deploy ~0.05–0.1 SUI | Đăng bài ~0.002 SUI | Mint ~0.002 SUI + giá NFT

Tech Stack
Layer	Công nghệ	Ghi chú
Blockchain	SUI Mainnet	Object-centric
Smart contract	Move	4 modules
Auth	Enoki (@mysten/enoki)	Managed zkLogin, không cần backend
Encryption	Seal (@mysten/seal)	Mainnet từ Sep 2025
NFT trading	Kiosk Protocol	Phase 2
Storage	On-chain Move object	Text < vài KB
Storage (file)	Walrus	Phase 3
Frontend	Next.js + TypeScript	App Router
Hooks	@mysten/dapp-kit-react	
Client	@mysten/sui gRPC	SuiGrpcClient
State	TanStack Query	
Styling	SCSS (BEM)	Không dùng Tailwind
Không có backend cho MVP — Enoki handle toàn bộ zkLogin (salt + prover).

Architecture
Frontend (React) — no backend
├── Enoki (Google OAuth → SUI address)
├── Artist Portal: Tạo Post → Seal encrypt → Publish → Dashboard
├── Feed: Query PostCreated events (SUI GraphQL)
└── Reader: Mint NFT → Seal decrypt → Library
Move Contracts
move/
├── post.move        — Post shared object, mint_nft, PostCreated event
├── nft.move         — ContentNFT struct
├── seal_policy.move — seal_approve entry fun
└── platform.move    — PlatformConfig (fee % Phase 3)
⚠️ CRITICAL #1 — Post phải là Shared Object
// ❌ SAI
transfer::transfer(post, ctx.sender());
// ✅ ĐÚNG
transfer::share_object(post);
⚠️ CRITICAL #2 — Query feed dùng GraphQL/Events
Post là shared object → listOwnedObjects trả về rỗng. Dùng SUI GraphQL query PostCreated events.

⚠️ CRITICAL #3 — Seal Policy là entry fun riêng
// ✅ entry fun, tham số đầu là id: vector<u8>
entry fun seal_approve(id: vector<u8>, nft: &ContentNFT, post: &Post, _ctx: &TxContext) {
    assert!(nft.post_id == object::id(post), EWrongPost);
}
Structs
// post.move
public struct Post has key {
    id: UID,
    author: address,
    title: String,
    encrypted_content: vector<u8>,
    price: u64,        // MIST
    max_supply: u64,
    minted: u64,
    created_at: u64,
}
public struct PostCreated has copy, drop {
    post_id: ID, author: address, title: String,
    price: u64, max_supply: u64, created_at: u64,
}

// nft.move
public struct ContentNFT has key, store {
    id: UID, post_id: ID, post_title: String,
    author: address, edition: u64, minted_at: u64,
}
Functions
public fun create_post(title: String, encrypted_content: vector<u8>, price: u64, max_supply: u64, clock: &Clock, ctx: &mut TxContext) {
    let post = Post { id: object::new(ctx), author: ctx.sender(), title, encrypted_content, price, max_supply, minted: 0, created_at: clock::timestamp_ms(clock) };
    event::emit(PostCreated { post_id: object::id(&post), author: ctx.sender(), title: post.title, price, max_supply, created_at: post.created_at });
    transfer::share_object(post);
}

public fun mint_nft(post: &mut Post, payment: Coin<SUI>, clock: &Clock, ctx: &mut TxContext): ContentNFT {
    assert!(post.minted < post.max_supply, EMaxSupplyReached);
    assert!(coin::value(&payment) >= post.price, EInsufficientPayment);
    transfer::public_transfer(payment, post.author);
    post.minted = post.minted + 1;
    ContentNFT { id: object::new(ctx), post_id: object::id(post), post_title: post.title, author: post.author, edition: post.minted, minted_at: clock::timestamp_ms(clock) }
}
Frontend Structure
app/
├── layout.tsx           — Root layout: Providers
├── providers.tsx        — 'use client' — Enoki + DAppKit + QueryClient
├── page.tsx             — Feed (Server Component)
├── post/[id]/page.tsx   — PostDetail
├── create/page.tsx      — CreatePost ('use client')
├── library/page.tsx     — Buyer library ('use client')
├── dashboard/page.tsx   — Artist dashboard ('use client')
└── auth/callback/page.tsx — Enoki OAuth callback

components/
├── PostCard.tsx, ContentViewer.tsx, MintButton.tsx
├── LoginButton.tsx, Navbar.tsx  — tất cả 'use client'

hooks/
├── useFeed.ts, usePost.ts, useMyNFTs.ts
├── useHasAccess.ts, useMintNFT.ts

lib/
├── sui-client.ts   — SuiGrpcClient mainnet singleton
├── seal.ts         — SealClient + encrypt/decrypt
├── transactions.ts — PTB builders
└── utils.ts        — formatSUI, shortenAddress

config.ts           — PACKAGE_ID, network = mainnet
Key Implementations
1. Providers
// app/providers.tsx
'use client';
import { EnokiFlowProvider } from '@mysten/enoki/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DAppKitProvider } from '@mysten/dapp-kit-react';

const queryClient = new QueryClient();
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EnokiFlowProvider apiKey={process.env.NEXT_PUBLIC_ENOKI_API_KEY!}>
      <QueryClientProvider client={queryClient}>
        <DAppKitProvider>{children}</DAppKitProvider>
      </QueryClientProvider>
    </EnokiFlowProvider>
  );
}
2. Auth
// auth/useAuth.ts
'use client';
import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';

export function useAuth() {
  const enokiFlow = useEnokiFlow();
  const { address, keypair } = useZkLogin();
  return {
    address, keypair,
    isLoggedIn: !!address,
    login: () => enokiFlow.authenticate({ provider: 'google' }),
    logout: () => enokiFlow.logout(),
  };
}

// app/auth/callback/page.tsx
'use client';
export default function AuthCallback() {
  const enokiFlow = useEnokiFlow();
  const router = useRouter();
  useEffect(() => { enokiFlow.handleAuthCallback().then(() => router.replace('/')); }, []);
  return <div>Đang xác thực...</div>;
}
3. Create Post (Seal encrypt)
// lib/transactions.ts
export async function buildCreatePostTx({ title, content, price, maxSupply, sealClient, packageId }) {
  const encryptedBytes = await sealClient.encrypt({
    threshold: 2, packageId,
    id: crypto.getRandomValues(new Uint8Array(32)),
    data: new TextEncoder().encode(content),
  });
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::post::create_post`,
    arguments: [
      tx.pure.string(title),
      tx.pure.vector('u8', Array.from(encryptedBytes)),
      tx.pure.u64(price), tx.pure.u64(maxSupply),
      tx.object('0x6'), // Clock
    ],
  });
  return tx;
}
4. Mint NFT
export function buildMintNFTTx({ postId, price, senderAddress, packageId }) {
  const tx = new Transaction();
  const [payment] = tx.splitCoins(tx.gas, [price]);
  const [nft] = tx.moveCall({
    target: `${packageId}::post::mint_nft`,
    arguments: [tx.object(postId), payment, tx.object('0x6')],
  });
  tx.transferObjects([nft], senderAddress);
  return tx;
}

// hooks/useMintNFT.ts
export function useMintNFT() {
  const { address, keypair } = useAuth();
  const client = useCurrentClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, price }) => {
      const tx = buildMintNFTTx({ postId, price, senderAddress: address!, packageId: PACKAGE_ID });
      tx.setSender(address!);
      const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair! });
      if (result.$kind === 'FailedTransaction') throw new Error(result.FailedTransaction.status.error?.message);
      await client.core.waitForTransaction({ result });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myNFTs'] }),
  });
}
5. Decrypt (Seal)
// lib/seal.ts — cache sessionKey 30 min
let cachedSessionKey: SessionKey | null = null;

export async function decryptPostContent({ encryptedContent, nftObjectId, postObjectId, packageId, sealClient, suiClient, signer, userAddress }) {
  if (!cachedSessionKey) {
    cachedSessionKey = await SessionKey.create({ address: userAddress, packageId, ttlMin: 30, signer, suiClient });
  }
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::seal_policy::seal_approve`,
    arguments: [tx.pure.vector('u8', []), tx.object(nftObjectId), tx.object(postObjectId)],
  });
  const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
  const decryptedBytes = await sealClient.decrypt({ data: encryptedContent, sessionKey: cachedSessionKey, txBytes });
  return new TextDecoder().decode(decryptedBytes);
}
6. Query Feed
// hooks/useFeed.ts — Post là SHARED OBJECT → GraphQL events
const graphqlClient = new SuiGraphQLClient({ url: 'https://sui-mainnet.mystenlabs.com/graphql' });

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const result = await graphqlClient.query({
        query: graphql(`query GetPosts($eventType: String!) {
          events(filter: { eventType: $eventType }, last: 20) {
            nodes { json timestamp }
          }
        }`),
        variables: { eventType: `${PACKAGE_ID}::post::PostCreated` },
      });
      return result.data?.events.nodes.map((node: any) => ({
        postId: node.json?.post_id, author: node.json?.author,
        title: node.json?.title, price: BigInt(node.json?.price ?? 0),
        maxSupply: Number(node.json?.max_supply), createdAt: node.timestamp,
      })) ?? [];
    },
    staleTime: 30_000,
  });
}

// ContentNFT = address-owned → listOwnedObjects
export function useMyNFTs() {
  const { address } = useAuth();
  const client = useCurrentClient();
  return useQuery({
    queryKey: ['myNFTs', address],
    queryFn: () => client.core.listOwnedObjects({
      owner: address!,
      filter: { StructType: `${PACKAGE_ID}::nft::ContentNFT` },
      include: { json: true },
    }),
    enabled: !!address,
  });
}
Conventions & Rules
Next.js
app/layout.tsx và app/page.tsx = Server Components
Bất kỳ component dùng hooks/Enoki/SUI → PHẢI có 'use client'
OAuth callback: app/auth/callback/page.tsx
localhost port: 3000
SUI / Blockchain
Tất cả số tiền: MIST (BigInt). 1 SUI = 1_000_000_000 MIST
Convert hiển thị: (Number(mist) / 1e9).toFixed(4)
Luôn check result.$kind === 'FailedTransaction' sau execute
Luôn gọi waitForTransaction({ result }) trước khi query lại
Post = shared object → GraphQL events
ContentNFT = address-owned → listOwnedObjects
Clock object ID: 0x6 (cố định mọi network)
Network: mainnet
Enoki / Seal
keypair từ useZkLogin() để sign — không tự manage
tx.setSender(address) trước khi sign
seal_approve phải là entry fun, tham số đầu LUÔN là id: vector<u8>
onlyTransactionKind: true khi build txBytes cho decrypt
Cache SessionKey (TTL 30 min)
Lỗi hay gặp
// ❌ Query ngay sau tx — data cũ
// ✅ Đợi index
await client.core.waitForTransaction({ result: txResult });
queryClient.invalidateQueries({ queryKey: ['feed'] });

// ❌ Số thập phân trong tx
tx.splitCoins(tx.gas, [0.01]);
// ✅ MIST BigInt
tx.splitCoins(tx.gas, [10_000_000n]);

// ❌ listOwnedObjects cho Post (shared object) → rỗng
// ✅ GraphQL events

// ❌ transfer::transfer(post, ctx.sender())
// ✅ transfer::share_object(post)

// ❌ Quên setSender
// ✅ tx.setSender(address); trước khi signAndExecuteTransaction
Environment Variables
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_SUI_GRAPHQL_URL=https://sui-mainnet.mystenlabs.com/graphql
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_ENOKI_API_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_SEAL_PACKAGE_ID=0x...
Deploy Checklist
# 1. Sui CLI
curl -sSf https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
suiup install sui@mainnet

# 2. Next.js
npx create-next-app@latest verse --typescript --app --tailwind=false --eslint
cd verse

# 3. Dependencies
pnpm add @mysten/sui @mysten/enoki @mysten/seal @mysten/dapp-kit-react
pnpm add @tanstack/react-query sass

# 4. Import ví
sui keytool import <PRIVATE_KEY> ed25519
sui client switch --address <ADDRESS>

# 5. Deploy contract (~0.05–0.1 SUI)
cd move/ && sui client publish --gas-budget 200000000 --network mainnet
# → Copy PackageID → NEXT_PUBLIC_PACKAGE_ID

# 6. Enoki: enoki.mystenlabs.com → tạo app → mainnet → Google OAuth
#    Redirect URI: http://localhost:3000/auth/callback

# 7. Google Cloud Console → OAuth 2.0 Client ID
#    Redirect: http://localhost:3000/auth/callback

# 8. pnpm install && pnpm dev
Phases
Phase 1 MVP (hiện tại): Enoki login, tạo Post, Feed, Mint NFT, Seal decrypt, PostDetail blur
Phase 2: Artist dashboard, Buyer library, Kiosk resell, Pagination
Phase 3: Walrus (audio/video/image), Platform fee, Artist profile
Phase 4: Sponsored tx (gasless), zkLogin Apple, Follow/notifications
Security Checklist (MVP)
Frontend:

CSP trong next.config.ts
KHÔNG dangerouslySetInnerHTML với user input
Sanitize title + content (strip HTML tags)
HTTPS only
Không log JWT/keypair/proof ra console
Smart Contract:

assert! supply check trước khi tăng minted
assert! payment check trước khi transfer
Test edge: mint khi minted = max_supply - 1
Emit event TRƯỚC share_object
CSP example:

// next.config.ts
headers: [{ key: 'Content-Security-Policy', value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'",
  "connect-src 'self' *.sui.io *.mystenlabs.com",
  "style-src 'self' 'unsafe-inline'",
].join('; ') }]
UI/UX Design Tokens
Direction: Dark Editorial Web3 — cam đỏ chủ đạo, tối, không neon, không gradient rẻ.
KHÔNG dùng purple (#7B6EE8) nữa. Accent là cam đỏ (#E8623A).

// _variables.scss
$bg-base:         #0a0a0f;
$bg-card:         rgba(255,255,255,0.025);
$bg-card-hover:   rgba(232,98,58,0.04);
$bg-surface:      rgba(255,255,255,0.05);

$accent:          #E8623A;    // cam đỏ — KHÔNG dùng purple
$accent-hover:    #EF7A55;
$accent-soft:     rgba(232,98,58,0.15);
$accent-border:   rgba(232,98,58,0.25);

$text-primary:    #f0ebe4;
$text-secondary:  rgba(240,235,228,0.55);
$text-muted:      rgba(240,235,228,0.35);

$border:          rgba(255,255,255,0.06);
$border-hover:    rgba(255,255,255,0.1);

$color-owned:     #5DCAA5;   // teal — đã có NFT
$color-sui:       #6FBCF0;   // xanh — SUI token

$radius-sm: 7px; $radius-md: 10px; $radius-lg: 14px; $radius-xl: 20px;
$font-base: 'Plus Jakarta Sans', system-ui, sans-serif;
Typography: h1 28px/800, h2 22px/700, h3 16px/700. Chỉ dùng weight: 400/500/600/700/800.

Locked content blur:

.content-locked { filter: blur(3px); user-select: none; pointer-events: none; }
.post-card:hover .content-locked { filter: blur(2.5px); } // tăng FOMO
Avatar: AddressAvatar component — 5x5 symmetric SVG identicon (blockchain-style), hình tròn.

Anti-patterns:

❌ #ffffff → ✅ #f0ebe4
❌ #7B6EE8 (purple) → ✅ #E8623A (cam đỏ)
❌ box-shadow: 0 10px 30px → ✅ border: 0.5px solid
❌ gradient nền → ✅ flat background
❌ neon glow → ✅ subtle border
❌ border-radius: 24px card → ✅ 14px
❌ font-weight: 300/900 → ✅ 400–800
Tài liệu tham khảo
SUI: https://docs.sui.io/guides/developer/sui-101
TS SDK: https://sdk.mystenlabs.com/typescript
Enoki: https://docs.enoki.mystenlabs.com
Seal: https://docs.sui.io/guides/developer/seal
SUI GraphQL: https://docs.sui.io/references/sui-graphql
Mainnet explorer: https://suiscan.xyz/mainnet