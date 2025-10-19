# Performer

BPMN + Actor + Neo4j Web Framework（Next.js 型規約 × Remix 境界 × Effect 実行）

## 概要

Performer は、ビジネスプロセス管理（BPMN）、アクターシステム、Neo4j データベースを統合したフルスタック Web フレームワークです。Next.js のファイルベースルーティング、Remix の loader/action パターン、Effect の関数型プログラミングを組み合わせた独自のアーキテクチャを提供します。

## 主要特徴

- **BPMN 制御フロー**: ビジネスプロセスを視覚的に定義・実行
- **アクターシステム**: サービスタスクの分散実行と障害耐性
- **Neo4j 統合**: グラフデータベースによる柔軟なデータ管理
- **型安全**: TypeScript + Zod によるエンドツーエンドの型安全性
- **モジュール設計**: npm パッケージとして提供される独立したコンポーネント

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

### パッケージ構成

Performer は以下の npm パッケージを提供します：

- `@gftdcojp/performer` - 統合パッケージ（すべての機能をバンドル）
- `@gftdcojp/performer/actions` - Remix loader/action + Auth0 ガード
- `@gftdcojp/performer/actor` - Effect ベースのアクターシステム
- `@gftdcojp/performer/data` - Neo4j + Neogma アダプタ
- `@gftdcojp/performer/error-handling` - 統合エラーハンドリングシステム
- `@gftdcojp/performer/process` - BPMN SDK ラッパー
- `@gftdcojp/performer/router` - Next.js スタイルのファイルベースルータ

## クイックスタート

### 必要条件

- Node.js 18+
- npm または pnpm
- Neo4j 5.0+
- Auth0 アカウント

### インストール

```bash
# 新しいプロジェクトを作成
mkdir my-performer-app
cd my-performer-app
npm init -y

# Performer パッケージをインストール
npm install @gftdcojp/performer --registry=https://npm.pkg.github.com

# または pnpm を使用
pnpm add @gftdcojp/performer --registry=https://npm.pkg.github.com
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
   // src/config.ts
   export const auth0Config = {
     domain: 'your-domain.auth0.com',
     clientID: 'your-client-id',
     audience: 'your-api-identifier'
   }
   ```

3. **環境変数の設定**
   ```bash
   # .env ファイルを作成
   echo "NEO4J_URI=bolt://localhost:7687" > .env
   echo "NEO4J_USER=neo4j" >> .env
   echo "NEO4J_PASSWORD=password" >> .env
   echo "AUTH0_DOMAIN=your-domain.auth0.com" >> .env
   echo "AUTH0_CLIENT_ID=your-client-id" >> .env
   ```

## 使用方法

### 基本的な使用例

```typescript
// src/index.ts
import {
  createUser,
  createProcessInstance,
  generateId,
  VERSION
} from '@gftdcojp/performer';

console.log('Performer version:', VERSION);

// ユーザー作成
const user = createUser('user-123', 'user@example.com', ['admin']);
console.log('Created user:', user);

// プロセスインスタンス作成
const processInstance = createProcessInstance('order-process', 'business-123');
console.log('Created process:', processInstance);

// ID生成
const newId = generateId('order');
console.log('Generated ID:', newId);
```

### BPMN プロセスの定義

```typescript
// src/processes/orderProcess.ts
import { ProcessBuilder } from "@gftdcojp/performer";

export const orderProcess = new ProcessBuilder("OrderProcess", "Order Processing")
  .startEvent("OrderReceived")
  .userTask("ReviewOrder", "Review Order Details")
  .exclusiveGateway("ApprovalCheck")
    .condition("amount <= 1000", "AutoApprove")
    .otherwise("ManagerApproval")
  .serviceTask("ProcessPayment")
  .endEvent("Completed")
  .build();
```

### データベース操作

```typescript
// src/database/setup.ts
import {
  createNeo4jConnection,
  createTransactionManager,
  createSchemaManager
} from '@gftdcojp/performer';

// Neo4j 接続設定
const connection = createNeo4jConnection({
  uri: process.env.NEO4J_URI!,
  username: process.env.NEO4J_USER!,
  password: process.env.NEO4J_PASSWORD!
});

// トランザクションマネージャー
const txManager = createTransactionManager(connection);

// スキーママネージャー
const schemaManager = createSchemaManager(connection);

// スキーマ作成
await schemaManager.createConstraints();
```

### アクターシステム

```typescript
// src/actors/orderActor.ts
import {
  EffectActorSystem,
  createBPMNBridge,
  ServiceTaskActor
} from '@gftdcojp/performer';

// アクターシステム作成
const system = new EffectActorSystem();

// BPMN ブリッジ作成
const bridge = createBPMNBridge(system);

// サービスタスク実行
await bridge.executeServiceTask(
  'order-123',
  'validate-payment',
  async () => {
    // 決済検証ロジック
    return { status: 'approved' };
  }
);
```

### エラーハンドリング

```typescript
// src/errorHandling/setup.ts
import {
  createErrorFactory,
  globalRecoveryManager
} from '@gftdcojp/performer';

// エラーファクトリー作成
const errorFactory = createErrorFactory('my-app');

// リカバリー戦略登録
globalRecoveryManager.registerStrategy('NETWORK_ERROR', {
  name: 'retry-network',
  description: 'Network error retry strategy',
  execute: async (error) => {
    // リトライロジック
    return true;
  }
});

// エラー生成
const error = errorFactory.networkError('api-call', new Error('Connection failed'));
```

### 認証とアクション

```typescript
// src/actions/auth.ts
import { createActions } from '@gftdcojp/performer';

// Auth0 設定
const auth0Config = {
  domain: 'your-domain.auth0.com',
  clientID: 'your-client-id',
  audience: 'your-api-identifier'
};

// アクションビルダー作成
export const actions = createActions(auth0Config);

// ロールベースのアクション定義
export const secureActions = actions.roles('admin', 'manager');
```

### ルーティング

```typescript
// src/router/setup.ts
import { FileRouter, SSRPipeline } from '@gftdcojp/performer';

// ルーター設定
const routerConfig = {
  basePath: '/app',
  appDir: './src/pages'
};

// ファイルルーター作成
const router = new FileRouter(routerConfig);

// SSR パイプライン作成
const ssrPipeline = new SSRPipeline(router);

// ページレンダリング
const result = await ssrPipeline.render('/orders/123');
```

## API リファレンス

### 主要なエクスポート

```typescript
import {
  // バージョン情報
  VERSION,
  FRAMEWORK_NAME,

  // 基本型
  User,
  ProcessInstance,

  // ファクトリ関数
  createUser,
  createProcessInstance,
  generateId,
  isCompleted,
  isRunning,

  // Neo4j データベース
  createNeo4jConnection,
  createTransactionManager,
  createProcessInstanceRepository,
  createSchemaManager,

  // アクターシステム
  EffectActorSystem,
  createBPMNBridge,
  ServiceTaskActor,

  // BPMN プロセス
  ProcessBuilder,

  // エラーハンドリング
  createErrorFactory,
  globalRecoveryManager,

  // 認証・アクション
  createActions,

  // ルーティング
  FileRouter,
  SSRPipeline
} from '@gftdcojp/performer';
```

## プロジェクトテンプレート

新しい Performer プロジェクトを素早く始めるためのテンプレート：

```bash
# テンプレートを使用（準備中）
npx create-performer-app my-app
cd my-app
npm install
npm run dev
```

## トラブルシューティング

### 一般的な問題

**GitHub Packages への認証エラー**
```bash
# PAT を設定
npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN
```

**Neo4j 接続エラー**
```bash
# 接続情報を確認
docker ps | grep neo4j
curl http://localhost:7474
```

**BPMN プロセス実行エラー**
```typescript
// エラーハンドリングを有効化
import { createErrorFactory } from '@gftdcojp/performer';
const errorFactory = createErrorFactory('my-app');
```

## ドキュメント

詳細なドキュメントは以下の場所で参照できます：

- [GitHub リポジトリ](https://github.com/gftdcojp/performer)
- [API リファレンス](https://github.com/gftdcojp/performer#readme)
- [サンプルコード](https://github.com/gftdcojp/performer/tree/main/apps/examples)

## 貢献

Performer の開発にご協力いただける場合：

1. [GitHub Issues](https://github.com/gftdcojp/performer/issues) でバグ報告や機能リクエスト
2. [GitHub Discussions](https://github.com/gftdcojp/performer/discussions) で質問や議論
3. ソースコードの改善提案は Pull Request へ

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/gftdcojp/performer.git
cd performer

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev

# パッケージのビルド
pnpm build
```

## バージョン履歴

### v1.0.0 (Latest)
- 🎉 初回リリース
- BPMN プロセスエンジン統合
- Neo4j データベースアダプタ
- Effect ベースのアクターシステム
- Auth0 認証統合
- TypeScript 型安全 API

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 謝辞

Performer は以下の優れたオープンソースプロジェクトの上に構築されています：

- [Next.js](https://nextjs.org/) - ファイルベースルーティングのインスピレーション
- [Remix](https://remix.run/) - loader/action パターンの参考
- [Effect](https://effect.website/) - 関数型プログラミング基盤
- [BPMN.io](https://bpmn.io/) - BPMN 処理ライブラリ
- [Neo4j](https://neo4j.com/) - グラフデータベース
- [Auth0](https://auth0.com/) - 認証・認可サービス

---

<div align="center">

**Performer** - BPMN + Actor + Neo4j Web Framework

[📦 npm](https://npm.pkg.github.com/@gftdcojp/performer) • [📚 Docs](https://github.com/gftdcojp/performer#readme) • [🐛 Issues](https://github.com/gftdcojp/performer/issues)

</div>
