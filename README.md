# Performer

BPMN + Actor + Neo4j Web Framework（Next.js 型規約 × Remix 境界 × Effect 実行）

## 概要

Performer は、ビジネスプロセス管理（BPMN）、アクターシステム、Neo4j データベースを統合したフルスタック Web フレームワークです。Next.js のファイルベースルーティング、Remix の loader/action パターン、Effect の関数型プログラミングを組み合わせた独自のアーキテクチャを提供します。

## 主要特徴

- **BPMN 制御フロー**: ビジネスプロセスを視覚的に定義・実行
- **アクターシステム**: サービスタスクの分散実行と障害耐性
- **Neo4j 統合**: グラフデータベースによる柔軟なデータ管理
- **型安全**: TypeScript + Zod によるエンドツーエンドの型安全性
- **モノレポ**: pnpm + Turborepo による効率的な開発

## アーキテクチャ

### 技術スタック

| 層 | 技術 | 説明 |
|----|------|------|
| ルーティング | File-based Router | Next.js スタイルの `app/**/page.client.tsx` |
| 境界管理 | Remix Actions | loader/action パターンによるサーバー/クライアント境界 |
| 実行基盤 | Effect | 関数型プログラミングとエラーハンドリング |
| プロセスエンジン | BPMN SDK | 制御フロー定義と実行 |
| アクター | Effect Actor | サービスタスクの分散実行 |
| データ | Neo4j + Neogma | 型安全な Cypher クエリ |
| UI | React + Tailwind | モダンなユーザーインターフェース |
| 認証 | Auth0 | RBAC/ABAC によるアクセス制御 |
| 監視 | OpenTelemetry + Sentry | 分散トレーシングとエラーモニタリング |

### プロジェクト構造

```
performer/
├── packages/
│   ├── router/          # Next.js スタイルのファイルベースルータ
│   ├── actions/         # Remix loader/action + Auth0 ガード
│   ├── process/         # BPMN SDK ラッパー
│   ├── actor/           # Effect ベースのアクターシステム
│   ├── data/            # Neo4j + Neogma アダプタ
│   ├── dev-server/      # Vite SSR 開発サーバー
│   ├── contracts/       # ts-rest + Zod スキーマ
│   ├── observability/   # OpenTelemetry + Sentry
│   └── cli/             # 開発ツール CLI
├── apps/
│   └── examples/demo-app/  # サンプルアプリケーション
├── tools/
│   └── turbo.json       # ビルド最適化設定
└── docs/                # ドキュメント
```

## クイックスタート

### 必要条件

- Node.js 18+
- pnpm 8+
- Neo4j 5.0+
- Auth0 アカウント

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/gftdcojp/performer.git
cd performer

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

### 設定

1. **Neo4j の設定**
   ```bash
   # Neo4j を起動
   docker run -d -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/password \
     neo4j:5.0
   ```

2. **Auth0 の設定**
   ```typescript
   // packages/actions/src/config.ts
   export const auth0Config = {
     domain: 'your-domain.auth0.com',
     clientID: 'your-client-id',
     audience: 'your-api-identifier'
   }
   ```

3. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .env を編集
   ```

## 使用方法

### BPMN プロセスの定義

```typescript
// app/order/process.flow.ts
import { flow } from "@pkg/process";

export const orderProcess = flow("OrderProcess", (p) => {
  p.startEvent("OrderReceived")
    .serviceTask("ValidateOrder")
    .exclusiveGateway("AmountCheck")
      .when("low", { expr: "${vars.amount <= 1000}" })
        .serviceTask("AutoApprove")
        .moveTo("Payment")
      .otherwise()
        .userTask("ManagerApproval")
        .moveTo("Payment")
    .serviceTask("Payment")
    .endEvent("Completed");
});
```

### サーバーサイド処理

```typescript
// app/order/loader.server.ts
"use server";

import { q } from "@pkg/data/effect-cypher";

export async function loader({ businessKey }: { businessKey: string }) {
  return q().matchNode("o", "Order", { businessKey }).ret("o").one();
}
```

### アクションの定義

```typescript
// app/order/actions.server.ts
"use server";

import { z } from "zod";
import { withTx } from "@pkg/data/tx";
import { startProcess } from "@pkg/process";
import { authorize } from "@pkg/actions/auth";

const StartOrder = z.object({
  businessKey: z.string(),
  amount: z.number().positive()
});

export async function startOrder(input: unknown) {
  const { user } = await authorize(["order:create"]);
  const args = StartOrder.parse(input);

  return withTx(async (tx) => {
    await startProcess({
      processId: "OrderProcess",
      businessKey: args.businessKey,
      variables: { amount: args.amount, userId: user.id }
    }, { tx });

    return { ok: true } as const;
  });
}
```

### UI コンポーネント

```tsx
// app/order/page.client.tsx
"use client";

import { useLoaderData } from "@pkg/router";

export default function OrderPage() {
  const data = useLoaderData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">注文処理</h1>
      {/* UI コンポーネント */}
    </div>
  );
}
```

## 開発

### 利用可能なスクリプト

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# リント
pnpm lint

# フォーマット
pnpm format
```

### パッケージの開発

各パッケージは独立して開発・テスト可能です：

```bash
# 特定のワークスペースで作業
cd packages/router
pnpm build
pnpm test
```

## デモアプリケーション

`apps/examples/demo-app/` には注文から承認・決済までの完全な BPMN プロセスを実装したデモが含まれています。

```bash
cd apps/examples/demo-app
pnpm dev
```

## ドキュメント

詳細なドキュメントは [docs/](docs/) ディレクトリを参照してください。

- [アーキテクチャ概要](docs/architecture.md)
- [BPMN プロセス開発ガイド](docs/bpmn-guide.md)
- [アクターシステム](docs/actor-system.md)
- [データアクセス](docs/data-access.md)
- [デプロイメント](docs/deployment.md)

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 謝辞

- [Next.js](https://nextjs.org/) - ファイルベースルーティングのインスピレーション
- [Remix](https://remix.run/) - loader/action パターンの参考
- [Effect](https://effect.website/) - 関数型プログラミング基盤
- [BPMN.io](https://bpmn.io/) - BPMN 処理ライブラリ
- [Neo4j](https://neo4j.com/) - グラフデータベース
