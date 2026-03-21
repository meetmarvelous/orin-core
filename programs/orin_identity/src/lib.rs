use anchor_lang::prelude::*;

declare_id!("FqtrHgdYTph1DSP9jDYD7xrKPrjSjCTtnw6fyKMmboYk"); // Using the generated ID

#[program]
pub mod orin_identity {
    use super::*;

    pub fn initialize_guest(ctx: Context<InitializeGuest>, email_hash: [u8; 32], name: String) -> Result<()> {
        let guest_profile = &mut ctx.accounts.guest_profile;
        guest_profile.owner = *ctx.accounts.user.key;
        guest_profile.email_hash = email_hash;
        guest_profile.name = name;
        guest_profile.loyalty_points = 0;
        guest_profile.stay_count = 0;
        guest_profile.preferences = "{}".to_string(); // Initialize empty JSON
        Ok(())
    }

    pub fn update_preferences(ctx: Context<UpdatePreferences>, new_prefs: String) -> Result<()> {
        let guest_profile = &mut ctx.accounts.guest_profile;
        guest_profile.preferences = new_prefs;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(email_hash: [u8; 32])]
pub struct InitializeGuest<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + 32 + 32 + 4 + 100 + 500 + 8 + 4, 
        seeds = [b"guest", email_hash.as_ref()], 
        bump
    )]
    pub guest_profile: Account<'info, GuestIdentity>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePreferences<'info> {
    #[account(mut, has_one = owner)]
    pub guest_profile: Account<'info, GuestIdentity>,
    pub owner: Signer<'info>,
}

#[account]
pub struct GuestIdentity {
    pub owner: Pubkey,
    pub email_hash: [u8; 32],
    pub name: String,
    pub preferences: String, 
    pub loyalty_points: u64,
    pub stay_count: u32,
}
