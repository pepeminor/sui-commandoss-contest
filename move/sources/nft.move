module verse::nft {
    use std::string::String;

    /// NFT granting access to a specific Post's content.
    /// Address-owned — holder can decrypt content via Seal.
    public struct ContentNFT has key, store {
        id: UID,
        post_id: ID,
        post_title: String,
        author: address,
        edition: u64,
        minted_at: u64,
    }

    // ─── Read accessors ───────────────────────────────────────────────────────

    public fun post_id(nft: &ContentNFT): ID { nft.post_id }
    public fun edition(nft: &ContentNFT): u64 { nft.edition }
    public fun author(nft: &ContentNFT): address { nft.author }
    public fun post_title(nft: &ContentNFT): String { nft.post_title }
    public fun minted_at(nft: &ContentNFT): u64 { nft.minted_at }

    // ─── Internal constructor (only callable from same package) ──────────────

    public(package) fun create(
        post_id: ID,
        post_title: String,
        author: address,
        edition: u64,
        minted_at: u64,
        ctx: &mut TxContext,
    ): ContentNFT {
        ContentNFT {
            id: object::new(ctx),
            post_id,
            post_title,
            author,
            edition,
            minted_at,
        }
    }
}
