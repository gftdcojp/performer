// Merkle DAG: /capabilities/checker
// Capability（権限）チェックの責務を持つサービス

import { Effect, Context, Layer } from "effect";
import { PermissionDeniedError } from "../processes/user-onboarding.process";

// --- Capabilityの定義 ---
export type Capability = "canCheckUsername" | "canCreateAccount";

// --- Capabilityサービスのインターフェース ---
export interface CapabilityService {
  hasCapability: (capability: Capability) => Effect.Effect<never, PermissionDeniedError, void>;
}
export const CapabilityService = Context.GenericTag<CapabilityService>("CapabilityService");

// --- 実装1: TypeScriptによる実装 ---
const userSession = { roles: ["guest", "user"] }; // 本来はJWTなどから取得

export const CapabilityServiceLive = Layer.succeed(
  CapabilityService,
  CapabilityService.of({
    hasCapability: (capability) => {
      console.log(`[TS Checker] Checking capability: ${capability}`);

      // ここに複雑な権限チェックロジックを書く
      // 例: RBAC (Role-Based Access Control) や ABAC (Attribute-Based Access Control)
      const hasPermission = userSession.roles.includes("user");

      if (hasPermission) {
        // 権限があれば成功するEffectを返す (void)
        return Effect.succeed(void 0);
      } else {
        // 権限がなければ失敗するEffectを返す
        return Effect.fail(new PermissionDeniedError(capability));
      }
    }
  })
);

// --- 実装2: WASMを呼び出す実装 ---
// 将来的にWASMで実装する場合のプレースホルダー
// WASMモジュールがロードされたら、以下のように実装を置き換えられる
/*
let wasm_check_capability: (roles: string[], capability: string) => boolean;

async function loadWasm() {
  const wasmModule = await WebAssembly.instantiateStreaming(
    fetch('/capabilities/checker.wasm')
  );
  wasm_check_capability = wasmModule.instance.exports.check_capability as any;
}

// アプリケーション起動時にWASMをロード
loadWasm().catch(console.error);

export const CapabilityServiceWasmLive = Layer.succeed(
  CapabilityService,
  CapabilityService.of({
    hasCapability: (capability) =>
      Effect.sync(() => {
        console.log(`[WASM Checker] Checking capability: ${capability}`);

        // WASMモジュールに権限チェックを委譲する
        const rolesJson = JSON.stringify(userSession.roles);
        const hasPermission = wasm_check_capability(rolesJson, capability);

        if (hasPermission) {
          return Effect.succeed(void 0);
        } else {
          return Effect.fail(new PermissionDeniedError(capability));
        }
      }).pipe(Effect.flatten)
  })
);
*/

// --- テスト用のモック実装 ---
export const CapabilityServiceMock = Layer.succeed(
  CapabilityService,
  CapabilityService.of({
    hasCapability: (capability) => {
      console.log(`[Mock Checker] Always allowing capability: ${capability}`);
      // テスト時は常に権限を許可
      return Effect.succeed(void 0);
    }
  })
);
