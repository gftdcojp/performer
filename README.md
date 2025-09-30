# Performer

**プロセス集約型Webフレームワーク** - 単一ファイルでビジネスプロセス全体を定義・実行

Performerは、**1つのTypeScriptファイル = 1つのビジネスプロセス**という革新的なアプローチで、複雑なビジネスロジックを宣言的・集約的に管理できるWebフレームワークです。

## 🌟 特徴

### 🎯 プロセス集約アーキテクチャ
- **単一ファイル = 1ビジネスプロセス** - 型定義・ロジック・UI・状態遷移を1箇所で管理
- **宣言的プロセス定義** - コード自体が設計図となるアーキテクチャ
- **BPMN互換マッピング** - XStateの状態機械をBPMN図に変換可能

### 🔧 コアテクノロジー
- **Effect-TS** - 関数型プログラミングによる副作用管理と型安全性
- **XState Actor** - ステートマシンによる堅牢な状態管理
- **Web Components** - 標準ベースのUIコンポーネント
- **ActorDB** - イベントソーシングによるデータ永続化
- **Sagaパターン** - 分散トランザクションのオーケストレーション

### 🚀 高度な機能
- **Dynamic Process Loading** - プロセス名 + Hashによる実行時動的読み込み
- **Capabilityベース認可** - きめ細やかな権限管理
- **Sagaオーケストレーション** - 複数プロセスの協調実行と補償トランザクション
- **プロセスレジストリ** - 実行時のプロセス発見・管理
- **CLIツール群** - プロジェクト生成・ビルド・テスト

## 📦 インストール

```bash
# リポジトリをクローン
git clone https://github.com/com-junkawasaki/performer.git
cd performer

# 依存関係をインストール
pnpm install

# CLIをビルド
pnpm run build:cli

# グローバルにリンク（オプション）
npm link
```

## 🎯 クイックスタート

### 1. 新規プロジェクト作成

```bash
# Performerプロジェクトを作成
performer init my-app

cd my-app
pnpm install
pnpm run dev
```

### 2. プロセス定義

```typescript
// src/processes/user-onboarding.process.ts
export const processMetadata = {
  id: 'user-onboarding',
  name: 'User Onboarding Process',
  type: 'single' as const,
  version: '1.0.0',
  hash: 'a1b2c3d4'
};

// Effect-TSによるビジネスロジック
// XStateによる状態機械定義
// Web ComponentsによるUI定義
// すべてこの1ファイルに集約
```

### 3. 動的プロセス実行

```bash
# プロセス名 + Hashで動的読み込み
open "http://localhost:5173/?process=user-onboarding&hash=a1b2c3d4"

# Sagaプロセス実行
open "http://localhost:5173/?process=complete-user-onboarding&hash=e5f6g7h8"
```

## 🏗️ アーキテクチャ

### プロセス集約アーキテクチャ

```
src/processes/
├── user-onboarding.process.ts        # 🔄 単一プロセス
├── complete-user-onboarding.saga.ts  # 🎭 Sagaプロセス
└── order-fulfillment.process.ts      # 📦 追加プロセス...
```

各プロセスファイルは：
- **メタデータ** - ID, タイプ, バージョン, Hash
- **Effect-TSロジック** - 型安全なビジネスロジック
- **XStateマシン** - 状態遷移とBPMNマッピング
- **Web Components** - プロセス固有のUI
- **統合テスト** - プロセス全体の検証

### Unified Process Registry

```typescript
import { ProcessRegistry } from 'performer';

// プロセス名 + Hashで動的読み込み
const process = await ProcessRegistry.loadByNameAndHash('user-onboarding', 'a1b2c3d4');
process.bootstrap(container);
```

### Sagaオーケストレーション

```typescript
// 複数プロセスを協調実行
// 失敗時は補償トランザクションでロールバック
// ActorDBにSaga全体のイベントを永続化
```

## 📁 プロジェクト構造

```
performer-workspace/
├── peformer/                    # 🎭 フレームワーク本体
│   ├── src/processes/          # 📋 プロセスファイル集約
│   ├── src/rpc/                # 📡 ActorDB通信
│   ├── src/capabilities/       # 🔒 権限管理
│   └── src/index.ts            # 🔌 フレームワークAPI
│
└── demo/                       # 🎯 デモアプリケーション
    ├── app/main.ts             # 🚀 プロセス動的読み込み
    ├── index.html
    └── package.json
```

## 🎭 使用例

### 単一プロセス定義

```typescript
// src/processes/user-onboarding.process.ts
export const processMetadata = {
  id: 'user-onboarding',
  name: 'User Onboarding Process',
  type: 'single',
  hash: 'a1b2c3d4'
};

// Effect-TS: 型安全なAPI呼び出し
const checkUsername = Effect.gen(function*() {
  const result = yield* Effect.promise(() =>
    fetch('/api/check-username').then(r => r.json())
  );
  return result.available;
});

// XState: BPMN互換の状態機械
export const onboardingMachine = createMachine({
  id: "userOnboarding",
  states: {
    enteringUsername: { /* BPMN: User Task */ },
    checkingUsername: { /* BPMN: Service Task */ },
    success: { /* BPMN: End Event */ }
  }
});

// Web Components: プロセスUI
@customElement("username-input-step")
class UsernameInputStep extends FASTElement {
  /* UI定義 */
}
```

### Sagaプロセス定義

```typescript
// src/processes/complete-user-onboarding.saga.ts
export const processMetadata = {
  id: 'complete-user-onboarding',
  name: 'Complete User Onboarding Saga',
  type: 'saga',
  hash: 'e5f6g7h8'
};

// 4つのサブプロセスをオーケストレーション:
// 1. ユーザー作成
// 2. メール検証送信
// 3. ウェルカム通知
// 4. ウェルカムメッセージ
//
// いずれかが失敗したら補償トランザクション実行
```

## 🔄 動的プロセス読み込み

### プロセス名 + Hash指定

```typescript
// URLパラメータでプロセス指定
?process=user-onboarding&hash=a1b2c3d4

// プログラムから動的読み込み
const process = await ProcessRegistry.loadByNameAndHash('user-onboarding', 'a1b2c3d4');
```

### Hash検証とキャッシュ

- **Hash検証**: プロセス改ざんの検知
- **自動キャッシュ**: 再読み込みのパフォーマンス最適化
- **バージョン管理**: Hashによるプロセスバージョニング

## 🧪 テスト

```bash
# ActorDB統合テスト
pnpm run test:actordb

# Saga統合テスト
pnpm run test:saga

# 動的プロセス読み込みテスト
pnpm run test:dynamic

# シミュレーター起動
pnpm run simulator
```

## 🎨 BPMNマッピング

```typescript
// XStateマシンをBPMN JSONに変換
const bpmnData = process.toBpmnJson();
// {
//   id: "userOnboarding",
//   nodes: [
//     { id: "enteringUsername", type: "userTask", description: "..." },
//     { id: "checkingUsername", type: "serviceTask", description: "..." }
//   ],
//   edges: [/* シーケンスフロー */]
// }
```

## 🔗 ActorDB統合

```typescript
// 自動イベント永続化
await client.writeEvent({
  entityId: "user-123",
  eventType: "user_created",
  payload: { name: "John Doe" },
  timestamp: new Date(),
  version: 1
});

// プロジェクションクエリ
const userStats = await client.getProjection("user_statistics");
```

## 📈 パフォーマンス特性

- **ツリーシェイキング**: 未使用プロセスはバンドルから除外
- **動的読み込み**: 必要なプロセスのみ実行時読み込み
- **キャッシュ最適化**: Hashベースのキャッシュ管理
- **WASM統合**: 高性能計算のオプション

## 🤝 コントリビューション

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 ライセンス

MIT License - see LICENSE file for details

## 🔗 関連プロジェクト

- [ActorDB](https://github.com/com-junkawasaki/dekigoto) - イベントソーシングデータベース
- [Effect-TS](https://effect.website) - 関数型プログラミングライブラリ
- [XState](https://xstate.js.org) - ステートマネジメント
- [FAST](https://fast.design) - Web Componentsフレームワーク

## 🤝 コントリビューション

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 ライセンス

MIT License - see LICENSE file for details

## 🔗 関連プロジェクト

- [ActorDB](https://github.com/com-junkawasaki/dekigoto) - イベントソーシングデータベース
- [Effect-TS](https://effect.website) - 関数型プログラミングライブラリ
- [XState](https://xstate.js.org) - ステートマネジメント
- [FAST](https://fast.design) - Web Componentsフレームワーク
