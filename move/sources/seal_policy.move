module verse::seal_policy {
    use verse::nft::ContentNFT;
    use verse::post::Post;

    const EWrongPost: u64 = 0;

    /// Seal key servers dry-run this to verify the caller holds a valid NFT.
    /// Rules:
    ///   1. First param MUST be `_id: vector<u8>` — Seal internal, do not rename
    ///   2. MUST be `entry fun`, NOT `public fun`
    entry fun seal_approve(
        _id: vector<u8>,
        nft: &ContentNFT,
        post: &Post,
        _ctx: &TxContext,
    ) {
        assert!(nft.post_id() == object::id(post), EWrongPost);
    }
}
