/// Platform configuration — Phase 3 (fee on primary sales).
/// Skeleton only for Phase 1 — fee_bps = 0.
module verse::platform {
    public struct PlatformConfig has key {
        id: UID,
        admin: address,
        fee_bps: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(PlatformConfig {
            id: object::new(ctx),
            admin: ctx.sender(),
            fee_bps: 0,
        });
    }

    public fun fee_bps(cfg: &PlatformConfig): u64 { cfg.fee_bps }
    public fun admin(cfg: &PlatformConfig): address { cfg.admin }
}
