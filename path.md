开发任务
ORIN Phase 1 

Backend, Smart Contracts & IoT Brief for Meng Guiwang (Kyle)

Here’s your brief.

What ORIN is:
An ambient AI system that recognises guests across physical spaces and automatically adjusts their environment to their saved preferences. Hotel, home, car into one identity, every space responds to you.

Your role: Smart contracts + Backend + IoT bridge

The Architecture:
Guest arrives→ Identity recognised (email or wallet)→ Firebase pulls preferences→ Node backend calls Hue API + Nest API→ Room adjusts automatically→ AI agent responds
(ps this is what i imagine it to be like but I’m not a technical person so you can make changes) 

Three things to build:

1. On-chain Guest Identity (Anchor Program) Guest profile stored as PDA on Solana , Fields: name, email hash, preferences, stay history, loyalty points, Readable by frontend and AI agent,Updatable after each stay, Account Abstraction wallet invisible to non crypto guests ( we have to figure a work around for this because i was thinking we could launch as a dapp on solana mobile and also be on AppStore and google play store) 

2. Node/TS Backend API
 Connect Solana identity layer to Firebase, Endpoints: create guest, get guest, update preferences, log stay,Bridge to IoT device APIs (Philips Hue + Google Nest),Handle email parsing extract guest identity from booking confirmation email. 

3. IoT Bridge, Connect Node backend to Philips Hue API control lights. Connect Node backend to Google Nest API control temperature. MQTT protocol for real time device communication. Simulate device responses until hardware arrives

For Phase 1 demo minimum viable:

1. Guest identity stored on-chain 

2. Backend API connects chain to frontend 

3. Room adjusts when guest arrives 

Full vision context:
Phase 1 is hotel rooms but ORIN scales to home and car same identity layer, same backend, different IoT devices so build Phase 1 with that scale in mind.

Timeline: Backend + smart contracts working in 3 weeks. Full IoT bridge in 5 weeks. 

Hackathon demo ready by May latest.

---

### 🚀 ORIN Phase 1 开发详细清单 (Tech Roadmap)

#### **1. 智能合约层 (Solana / Anchor)**
* **状态：** 基础架构已完成，待部署测试。
* **目标：** 构建去中心化的“客房/用户身份”存储层。
* **待办事项：**
    * [x] 定义 `GuestIdentity` 账户结构（PDA 模式）。
    * [ ] 实现 `initialize_guest` 指令（由后端或钱包调用）。
    * [ ] 实现 `update_preferences` 指令（更新温度、灯光颜色、香氛等偏好）。
    * [ ] **进阶：** 实现基于 `email_hash` 的权限校验逻辑，确保只有经过验证的来源可以更新关键数据。
* **本地编写建议：** 让 AI 专注于 `anchor_lang` 的空间计算（Space Calculation），确保 PDA 的 Seed 设计足够扩展。

#### **2. 后端中间件层 (Node.js / TypeScript)**
* **状态：** 逻辑架构已规划，需开始撸代码。
* **目标：** 解决链上数据与物理世界 API 之间的“实时性”矛盾。
* **待办事项：**
    * [ ] **Solana Listener：** 使用 `onAccountChange` 监听特定的程序账户变更。
    * [ ] **Firebase Sync：** 实时将链上偏好同步到 Firebase Real-time Database（为了满足 IoT 低延迟需求）。
    * [ ] **Email Parser：** 集成简单 LLM API，将预订邮件解析为哈希值，匹配链上 Identity。
    * [ ] **Auth：** 配合前端实现 Dynamic/Privy 的账号抽象接入逻辑。

#### **3. IoT 模拟与控制层 (Bridge)**
* **状态：** 待开发。
* **目标：** 无硬件状态下的功能演示（MVP）。
* **待办事项：**
    * [ ] **Mock API：** 创建模拟 Philips Hue (灯光) 和 Google Nest (空调) 响应的 Webhook 端点。
    * [ ] **MQTT 集成：** 搭建基础的 MQTT Broker，实现后端指令到设备的实时推送逻辑。
    * [ ] **Environment Sync：** 编写逻辑：当 Firebase 状态变为 `is_checked_in: true`，触发灯光和温度调整逻辑。

---

### 💻 核心代码汇总 (用于本地初始化)

你可以直接将以下内容分别创建为文件

#### **文件 1: `programs/orin_identity/src/lib.rs` (Anchor 合约)**
```rust
use anchor_lang::prelude::*;

declare_id!("Your_Program_ID_Here"); // 请在此处替换你的 Program ID

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
        guest_profile.preferences = "{}".to_string(); // 初始化空 JSON
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
```

#### **文件 2: `backend/src/listener.ts` (后端监听逻辑原型)**
```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import * as admin from 'firebase-admin';

// 初始化 Solana 连接
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 监听 GuestIdentity 账户变更
export const startSolanaListener = (programId: PublicKey) => {
    connection.onProgramAccountChange(
        programId,
        (updatedAccountInfo) => {
            console.log("On-chain data changed! Syncing to Firebase...");
            // 解析数据并推送到 Firebase Real-time DB
            // 逻辑：解析 Buffer -> 获取 preferences JSON -> admin.database().ref('/rooms/').update(...)
        },
        'confirmed'
    );
};
```

---

### 📝 对本地 Antigravity 的编写指令：
你可以把这段指令直接发给它：

> “这是 **ORIN Labs** 的 Phase 1 开发架构。
> 1. 完成anchor项目初始化，结构
直接在 orin-core 下建三个文件夹，这会让协作变得极其丝滑：

    /programs: 放你的 Anchor 合约代码。

    /backend: 放你的 Node.js 监听逻辑和 Firebase 同步。

    /frontend: 留给 Defi Doctor，他进场后直接在这个目录下开工。


> 2. 请基于以上 `lib.rs` 完善 Anchor 合约的错误处理（Errors）和访问控制（Access Control）。
> 3. 请在 `backend` 目录下完善 Node.js 环境，集成 Firebase Admin SDK，并实现将 Solana 账户数据解析为 JSON 并存储到 Firebase 的具体逻辑。
> 4. 请设计一个模拟 Philips Hue 灯光的 MQTT Topic 结构，以便后续进行设备联调。”

