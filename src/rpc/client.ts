// Merkle DAG: /rpc/client
// RPCインターフェースの具体的な実装。ActorDBと通信する責務を持つ。

import { Effect, Layer } from "effect";
import { RpcService } from "../processes/user-onboarding.process";

// ここでActorDBのRPCクライアントを利用する
// import { ActorDBHttpClient } from './actordb-client';
// const client = new ActorDBHttpClient({ host: "localhost", port: 9090 });

/**
 * RpcServiceの「Live」な実装を提供するEffectのLayer。
 * これが本番環境で使われるRPCクライアントの実体です。
 */
export const RpcServiceLive = Layer.succeed(
  RpcService,
  RpcService.of({
    /**
     * ユーザー名が利用可能かチェックするRPCの実装。
     * Effect.tryPromiseを使い、fetchベースの非同期処理をEffectに変換します。
     */
    checkUsername: (username) =>
      Effect.tryPromise({
        try: async () => {
          // --- ここが実際のActorDBとの通信部分 ---
          // 例: ActorDBの特定のプロジェクションを叩く、など
          // const response = await client.executeQuery('check_username', { username });
          // return response as { available: boolean };

          // 以下はモック実装（実際のActorDB連携時は置き換え）
          console.log(`[RPC Client] Calling ActorDB to check username: ${username}`);
          await new Promise(resolve => setTimeout(resolve, 500)); // ネットワーク遅延のシミュレーション

          // ビジネスルール: "admin" は予約済み、"test" は無効なフォーマット
          if (username === "admin") {
            throw new Error("UsernameTakenError");
          }
          if (username.length < 3) {
            throw new Error("InvalidFormatError");
          }

          // 成功時は利用可能と返す
          return { available: true };
        },
        // ActorDBからのエラーを、ビジネスプロセスが理解できるエラー型に変換する
        catch: (error: any) => {
          if (error.message === "UsernameTakenError") {
            return { _tag: "UsernameTakenError" } as const;
          }
          if (error.message === "InvalidFormatError") {
            return { _tag: "InvalidFormatError" } as const;
          }
          // 想定外のエラーは汎用エラーとして扱う
          return { _tag: "UnknownRpcError" } as const;
        }
      }),
  })
);

/**
 * テスト用のモック実装
 * 実際のネットワーク通信を行わず、即座に成功を返す
 */
export const RpcServiceMock = Layer.succeed(
  RpcService,
  RpcService.of({
    checkUsername: (username) =>
      Effect.succeed({ available: true }),
  })
);
