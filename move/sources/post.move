module verse::post {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use verse::nft::{Self, ContentNFT};

    // ─── Error codes ──────────────────────────────────────────────────────────
    const EMaxSupplyReached: u64 = 0;
    const EInsufficientPayment: u64 = 1;

    // ─── Media type constants ────────────────────────────────────────────────
    // 0 = text-only, 1 = audio, 2 = video, 3 = image
    const MEDIA_TEXT: u8 = 0;

    // ─── Structs ──────────────────────────────────────────────────────────────

    /// Shared object — any buyer can mutate the `minted` counter.
    public struct Post has key {
        id: UID,
        author: address,
        title: String,
        encrypted_content: vector<u8>,
        media_type: u8,                 // 0=text, 1=audio, 2=video, 3=image
        media_blob_id: String,           // Walrus blob ID (empty if text-only)
        encryption_key: vector<u8>,      // Seal-encrypted AES key for media
        price: u64,
        max_supply: u64,
        minted: u64,
        created_at: u64,
    }

    /// Emitted when a Post is created — feed queries this event via GraphQL.
    public struct PostCreated has copy, drop {
        post_id: ID,
        author: address,
        title: String,
        price: u64,
        max_supply: u64,
        media_type: u8,
        created_at: u64,
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public fun author(post: &Post): address { post.author }
    public fun title(post: &Post): String { post.title }
    public fun encrypted_content(post: &Post): vector<u8> { post.encrypted_content }
    public fun media_type(post: &Post): u8 { post.media_type }
    public fun media_blob_id(post: &Post): String { post.media_blob_id }
    public fun encryption_key(post: &Post): vector<u8> { post.encryption_key }
    public fun price(post: &Post): u64 { post.price }
    public fun max_supply(post: &Post): u64 { post.max_supply }
    public fun minted(post: &Post): u64 { post.minted }
    public fun created_at(post: &Post): u64 { post.created_at }

    // ─── Entry functions ──────────────────────────────────────────────────────

    /// Artist publishes a new text-only post (backward compatible).
    public fun create_post(
        title: String,
        encrypted_content: vector<u8>,
        price: u64,
        max_supply: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        create_post_with_media(
            title,
            encrypted_content,
            MEDIA_TEXT,
            std::string::utf8(b""),
            vector::empty<u8>(),
            price,
            max_supply,
            clock,
            ctx,
        );
    }

    /// Artist publishes a post with optional media (audio/video/image via Walrus).
    public fun create_post_with_media(
        title: String,
        encrypted_content: vector<u8>,
        media_type: u8,
        media_blob_id: String,
        encryption_key: vector<u8>,
        price: u64,
        max_supply: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let post = Post {
            id: object::new(ctx),
            author: ctx.sender(),
            title,
            encrypted_content,
            media_type,
            media_blob_id,
            encryption_key,
            price,
            max_supply,
            minted: 0,
            created_at: clock::timestamp_ms(clock),
        };

        event::emit(PostCreated {
            post_id: object::id(&post),
            author: ctx.sender(),
            title: post.title,
            price,
            max_supply,
            media_type,
            created_at: post.created_at,
        });

        transfer::share_object(post);
    }

    /// Buyer mints a ContentNFT. Payment goes directly to artist.
    public fun mint_nft(
        post: &mut Post,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ContentNFT {
        assert!(post.minted < post.max_supply, EMaxSupplyReached);
        assert!(coin::value(&payment) >= post.price, EInsufficientPayment);

        transfer::public_transfer(payment, post.author);

        post.minted = post.minted + 1;

        nft::create(
            object::id(post),
            post.title,
            post.author,
            post.minted,
            clock::timestamp_ms(clock),
            ctx,
        )
    }
}
