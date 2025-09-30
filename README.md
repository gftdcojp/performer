# Performer

**次世代BaaSプラットフォーム** - WebAssembly + Rivet-like リアルタイム同期 + イベントソーシング

Performerは、**Supabaseを凌駕する7つの主要コンポーネント**を備えた革新的なBaaSプラットフォームです。**Rivet に匹敵するリアルタイム同期機能**とプロセス集約型アーキテクチャを組み合わせ、現代のWebアプリケーション開発における新たなパラダイムを提供します。

## 🌟 特徴

### 🎯 プロセス集約型BaaSアーキテクチャ
- **単一ファイル = 1ビジネスプロセス** - 型定義・ロジック・UI・状態遷移を1箇所で管理
- **宣言的プロセス定義** - コード自体が設計図となるアーキテクチャ
- **イベントソーシング統合** - すべての操作がイベントとして記録・分析可能
- **WebAssemblyネイティブ** - 関数実行に高速なWASMランタイムを使用

### 🔧 7つのBaaSコンポーネント

| 機能 | Supabase相当 | Performer実装 | 特徴 |
|------|-------------|---------------|------|
| **📊 Database** | Supabase Client | Supabase-like Query API + ActorDB | イベントソーシングベース |
| **🔐 Authentication** | Supabase Auth | JWT認証 + RBAC + ActorDB Security | ゼロトラストセキュリティ |
| **📦 Storage** | Supabase Storage | ファイル管理 + URL生成 + ActorDBメタデータ | メタデータ追跡 |
| **⚡ Functions** | Supabase Edge Functions | WASMベースサーバーレス関数 | WebAssemblyネイティブ |
| **🔄 Realtime** | Supabase Realtime | **Rivet-like リアルタイム同期** | **WebSocket/SSE + イベントソーシング + CRDT** |
| **🔥 Advanced Realtime** | - | **デュアルトランスポート + スナップショット** | **アクター状態管理 + 衝突解決** |
| **📊 Analytics** | Supabase Analytics | 使用状況分析・パフォーマンス監視 | 包括的な監視 |

### 🚀 革新的な機能
- **Dynamic Process Loading** - プロセス名 + Hashによる実行時動的読み込み
- **Capabilityベース認可** - きめ細やかな権限管理 + ActorDB Security Gateway
- **Sagaオーケストレーション** - 複数プロセスの協調実行と補償トランザクション
- **プロセスレジストリ** - 実行時のプロセス発見・管理
- **リアルタイム監視** - システム全体の健全性チェックとアラート
- **イベント駆動アーキテクチャ** - ActorDBイベントストリームによる疎結合設計
- **🔥 Rivet-like リアルタイム同期** - アクター + WebSocket/SSE + CRDTによる強力な同期
- **📡 デュアルトランスポート** - WebSocket + SSEの自動選択で最大互換性
- **🔄 スナップショット & リプレイ** - O(n)→O(k)+O(Δ)の効率的な状態同期
- **⚖️ 高度な衝突解決** - CRDT + ベクタークロック + 因果整合性
- **🔒 ファイアウォール対応** - SSEによるHTTP/HTTPS専用通信

## ⚡ リアルタイム同期機能

Performerは **Rivet に匹敵する強力なリアルタイム同期機能** を提供します。イベントソーシング、WebSocket、CRDT（Conflict-free Replicated Data Types）を組み合わせた独自のアーキテクチャにより、Supabase Realtime を凌駕するパフォーマンスと信頼性を実現しています。

### 特徴

- **アクター + WebSocket/SSE イベント** - Rivet と同じ思想で設計された同期パターン
- **デュアルトランスポート** - WebSocket + SSE を状況に応じて使い分け
- **ファイアウォールフレンドリー** - SSE は HTTP/HTTPS のみを使用
- **ローカルファースト同期** - クライアントサイドでの即時反映 + サーバ同期
- **CRDT ベース衝突解決** - 複数ユーザー間の競合を自動解決
- **スナップショット最適化** - O(n) → O(k)+O(Δ) の計算量削減
- **因果整合性保証** - イベントの因果関係を維持した同期

### 基本的な使い方

```typescript
import { createRealtimeService, setRealtimeService } from 'performer'

// WebSocket + SSE 両方を使用（デフォルト）
const realtimeService = await createRealtimeService(actorDBClient, {
  wsUrl: 'ws://localhost:8080',
  sseServer: sseServer, // SSEサーバーインスタンス
  transport: 'both' // 'websocket' | 'sse' | 'both'
})

// または個別に使用
// WebSocketのみ
const wsService = await createRealtimeService(actorDBClient, {
  wsUrl: 'ws://localhost:8080',
  transport: 'websocket'
})

// SSEのみ
const sseService = await createRealtimeService(actorDBClient, {
  sseServer: sseServer,
  transport: 'sse'
})

// アクターシステムにリアルタイムサービスを設定
setRealtimeService(realtimeService)

// チャンネル購読
const subscriptionId = await realtimeService.subscribeChannel({
  channelId: 'room-1',
  actorId: 'chat-room-1',
  filters: { eventTypes: ['message_sent', 'user_joined'] }
})

// イベントブロードキャスト（両方のトランスポートに送信）
await realtimeService.broadcastEvent({
  id: 'msg-123',
  type: 'message_sent',
  payload: { userId: 'alice', content: 'Hello!' },
  actorId: 'chat-room-1',
  version: 1,
  timestamp: new Date()
})

// 状態同期
const snapshot = await realtimeService.syncActor('chat-room-1', 0)
```

### 高度な機能

```typescript
// スナップショット管理
const snapshot = await realtimeService.createSnapshot('my-actor')
const latestSnapshot = await realtimeService.getSnapshot('my-actor')

// 衝突解決
const resolvedEvent = await realtimeService.resolveConflict(
  conflictingEvents,
  'last_write_wins' // or 'causal_order', 'merge'
)

// カスタムCRDTマージ関数
const crdtService = createCRDTStateManager(eventStore)
const mergedState = await crdtService.mergeCRDTStates(states, customMergeFunction)
```

### デモ実行

```bash
# リアルタイムチャットデモを開始（WebSocket + SSE）
pnpm run demo:chat

# ブラウザでアクセス
# http://localhost:3000 - トランスポート選択画面
# http://localhost:3000/ws.html - WebSocket チャット
# http://localhost:3000/sse.html - SSE チャット
```

### トランスポート比較

| 機能 | WebSocket | SSE |
|------|-----------|-----|
| 双方向通信 | ✅ | ❌ (サーバー→クライアントのみ) |
| プロトコル | WS/WSS | HTTP/HTTPS |
| ファイアウォール | ⚠️ ブロックされる場合あり | ✅ 通常許可 |
| ブラウザ対応 | ✅ モダンブラウザ | ✅ 広い互換性 |
| 自動再接続 | ❌ 手動実装 | ✅ 自動 |
| バイナリデータ | ✅ | ❌ (テキストのみ) |
| 同時接続数 | 高 | 高 |

デモでは、**複数タブ間でリアルタイムチャット** が体験できます。各タブは別ユーザーとして接続され、メッセージ送信時にすべてのクライアント（WebSocket/SSE両方）に即座に反映されます。

**WebSocket** は双方向通信に適し、**SSE** はファイアウォールに強い一方通行通信に適しています。

## 🛠️ CLI コマンド

Performerは包括的なCLIツールを提供し、プロジェクトの生成からリアルタイム機能までをサポートします。

### プロジェクト管理
```bash
# 新しいプロジェクトを初期化
performer init my-project

# プロジェクトをビルド
performer build

# 開発サーバーを起動
performer serve

# テストを実行
performer test
```

### コード生成
```bash
# ビジネスドメインを生成
performer generate:domain UserManagement

# アクターを生成
performer generate:actor ChatActor

# UIコンポーネントを生成
performer generate:ui ChatComponent

# WASMモジュールを生成
performer generate:wasm PerformanceCompute

# リアルタイム機能を生成
performer generate:realtime ChatRoom
```

### リアルタイム機能
```bash
# チャットデモサーバー起動（WebSocket + SSE）
pnpm run demo:chat

# WebSocketクライアントのみ起動
pnpm run demo:chat:ws

# SSEクライアントのみ起動
pnpm run demo:chat:sse
```

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

### 1. Performer BaaSクライアントの初期化

```bash
# Performerプロジェクトを作成
performer init my-app

cd my-app
pnpm install
pnpm run dev
```

### 2. Supabase-like BaaS API使用

```typescript
import { quickStartPerformer } from 'performer-client';

// Performer BaaSクライアントを初期化
const { performer } = quickStartPerformer('http://localhost:9090', 'your-token');

// 認証
const { data: authData, error } = await performer.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// データベースクエリ (Supabase-like)
const users = await performer
  .from('user_profiles')
  .select('name,email')
  .eq('active', true)
  .limit(10);

// ファイルストレージ
const { data: uploadData } = await performer.storage
  .from('avatars')
  .upload('user-123.jpg', file, { contentType: 'image/jpeg' });

// WASM関数デプロイ・実行
const { data: funcData } = await performer.functions.deploy(
  'hello-world',
  wasmBytes,
  {
    description: 'Hello World WASM function',
    triggers: [{ type: 'http', config: { method: 'GET', path: '/api/hello' } }]
  }
);

// リアルタイム購読
const channel = performer.realtime.channel('room-1');
channel
  .on('broadcast', (payload) => {
    console.log('Broadcast received:', payload.payload);
  })
  .subscribe();

// 分析・監視
await performer.analytics.recordMetric('api_requests', 150, 'count', { endpoint: '/api/users' });
const { data: health } = await performer.analytics.getSystemHealth();
```

### 3. プロセス定義 (オプション)

```typescript
// src/processes/user-onboarding.process.ts
export const processMetadata = {
  id: 'user-onboarding',
  name: 'User Onboarding Process',
  type: 'single' as const,
  version: '1.0.0',
  hash: 'a1b2c3d4'
};

// Effect-TS + Effect Actor + Web Components + ActorDB統合
// すべてこの1ファイルに集約
```

## 🏗️ アーキテクチャ

### プロセス集約型BaaSアーキテクチャ

```
src/
├── rpc/
│   ├── performer-client.ts          # 🎯 Supabase-like BaaSクライアント
│   ├── actordb-client.ts            # 📡 ActorDB通信
│   └── index.ts                     # 🔌 APIエクスポート
├── processes/                       # 🔄 プロセス集約ファイル
│   ├── user-onboarding.process.ts   # 📋 ビジネスプロセス定義
│   └── complete-user-onboarding.saga.ts # 🎭 Sagaオーケストレーション
├── capabilities/                    # 🔒 権限管理
├── domain/                         # 💼 ビジネスロジック
├── ui/                            # 🎨 Web Components
└── wasm/                          # ⚡ WebAssembly関数
```

### PerformerClient: Supabase-like BaaS API

```typescript
import { PerformerClient } from 'performer-client';

// 6つのBaaSコンポーネントを統一的に提供
const client = PerformerClient.fromActorDB(actorDBClient);

// Database: Supabase-likeクエリAPI
const users = await client
  .from('user_profiles')
  .select('name,email')
  .eq('active', true)
  .limit(10);

// Auth: JWT認証 + RBAC
const { data: user } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Storage: ファイル管理 + メタデータ追跡
const { data: uploadData } = await client.storage
  .from('avatars')
  .upload('user-123.jpg', file);

// Functions: WebAssemblyベースのサーバーレス関数
const { data: funcData } = await client.functions.deploy(
  'hello-world', wasmBytes, { triggers: [...] }
);

// Realtime: WebSocketベースのリアルタイム通信
const channel = client.realtime.channel('room-1');

// Analytics: 使用状況分析・パフォーマンス監視
await client.analytics.recordMetric('api_requests', 150, 'count');
const { data: health } = await client.analytics.getSystemHealth();
```

### イベントソーシング統合

```typescript
// すべての操作がイベントとして記録
await actorDB.writeEvent({
  entityId: "user-123",
  eventType: "user_created",
  payload: { name: "John Doe", email: "john@example.com" },
  timestamp: new Date(),
  version: 1
});

// イベントからプロジェクションを構築
const userStats = await actorDB.getProjection("user_statistics");

// イベントストリームによるリアルタイム処理
actorDB.subscribeToEvents("user-*", (event) => {
  console.log('Real-time event:', event);
});
```

### プロセス集約アーキテクチャ (オプション)

各プロセスファイルは：
- **メタデータ** - ID, タイプ, バージョン, Hash
- **Effect-TSロジック** - 型安全なビジネスロジック
- **Effect Actor** - アクターシステムと状態管理
- **Web Components** - プロセス固有のUI
- **ActorDB統合** - イベントソーシングによる永続化
- **統合テスト** - プロセス全体の検証

## 📁 プロジェクト構造

```
performer-workspace/
├── performer/                  # 🎭 BaaSプラットフォーム本体
│   ├── src/rpc/
│   │   ├── performer-client.ts # 🎯 Supabase-like BaaSクライアント
│   │   ├── actordb-client.ts   # 📡 ActorDB通信
│   │   └── index.ts            # 🔌 APIエクスポート
│   ├── src/processes/          # 📋 プロセス集約ファイル (オプション)
│   ├── src/capabilities/       # 🔒 権限管理 + Security Gateway
│   ├── src/wasm/               # ⚡ WebAssembly関数ランタイム
│   └── src/index.ts            # 🔌 フレームワークAPI
│
├── demo/                       # 🎯 BaaSデモアプリケーション
│   ├── app/main.ts             # 🚀 BaaSクライアント使用例
│   ├── index.html
│   └── package.json
│
└── test/                       # 🧪 包括的なテストスイート
    ├── performer-client-test.ts # 🎯 BaaSクライアントテスト
    ├── actordb-integration-test.ts # 📡 ActorDB統合テスト
    └── actordb-simulator.ts    # 🎭 テストシミュレーター
```

## 🎭 使用例

### Performer BaaSクライアントの使用

```typescript
import { quickStartPerformer } from 'performer-client';

// BaaSプラットフォームを初期化
const { performer } = quickStartPerformer('http://localhost:9090', 'your-token');

// 1. Authentication - JWT + RBAC認証
const { data: authData, error } = await performer.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: { data: { name: 'John Doe' } }
});

const { data: signInData } = await performer.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// 2. Database - Supabase-likeクエリAPI
const users = await performer
  .from('user_profiles')
  .select('name,email,created_at')
  .eq('active', true)
  .order('created_at', { ascending: false })
  .limit(10);

// フィルタリングと集計
const stats = await performer
  .from('user_profiles')
  .select('count', { count: 'exact' })
  .eq('active', true);

// 3. Storage - ファイル管理 + メタデータ追跡
const { data: uploadData } = await performer.storage
  .from('avatars')
  .upload('user-123.jpg', file, {
    contentType: 'image/jpeg',
    cacheControl: '3600'
  });

// パブリックURL生成
const { data: publicUrl } = performer.storage
  .from('avatars')
  .getPublicUrl('user-123.jpg');

// 署名付きURL生成
const { data: signedUrl } = await performer.storage
  .from('avatars')
  .createSignedUrl('user-123.jpg', 3600); // 1時間有効

// 4. Functions - WebAssemblyベースのサーバーレス関数
const wasmBytes = await fetch('/path/to/function.wasm').then(r => r.arrayBuffer());

const { data: funcData } = await performer.functions.deploy(
  'hello-world',
  new Uint8Array(wasmBytes),
  {
    description: 'Hello World WASM function',
    version: '1.0.0',
    triggers: [
      { type: 'http', config: { method: 'GET', path: '/api/hello' } },
      { type: 'event', config: { eventType: 'user_created' } }
    ],
    permissions: ['read:user_profiles']
  }
);

// 関数実行
const { data: result } = await performer.functions.invoke('hello-world', {
  message: 'Hello from Performer!',
  userId: signInData.user.id
});

// 5. Realtime - WebSocketベースのリアルタイム通信
const channel = performer.realtime.channel('room-1');

// データベース変更の購読
channel
  .on('postgres_changes', (payload) => {
    if (payload.eventType === 'INSERT' && payload.table === 'messages') {
      console.log('New message:', payload.new);
    }
  })
  .subscribe();

// ブロードキャストメッセージの送受信
channel
  .on('broadcast', (payload) => {
    console.log('Broadcast received:', payload.payload);
  });

// メッセージ送信
channel.send('message', {
  text: 'Hello, everyone!',
  userId: signInData.user.id,
  timestamp: new Date().toISOString()
});

// プレゼンス追跡
channel.track({
  user_id: signInData.user.id,
  online_at: new Date().toISOString(),
  status: 'active'
});

// 6. Analytics - 使用状況分析・パフォーマンス監視
// カスタムメトリクス記録
await performer.analytics.recordMetric(
  'api_requests',
  150,
  'count',
  { endpoint: '/api/users', method: 'GET' },
  { responseTime: 45.2 }
);

// パフォーマンスメトリクス記録
await performer.analytics.recordPerformanceMetric(
  'database',
  'query_time',
  45.2,
  'ms',
  45200, // 実行時間 (μs)
  { table: 'user_profiles', operation: 'select' }
);

// ユーザーアクティビティ追跡
await performer.analytics.recordUserActivity(
  signInData.user.id,
  'session-123',
  'login',
  1200, // ログイン時間 (ms)
  { ip: '192.168.1.1', userAgent: 'Chrome/91.0' }
);

// 使用状況統計取得
const { data: usageStats } = await performer.analytics.getUsageStats(
  new Date(Date.now() - 86400000).toISOString(), // 24時間前
  new Date().toISOString()
);

// システム健全性チェック
const { data: health } = await performer.analytics.getSystemHealth();
console.log('System status:', health.status); // 'healthy' | 'warning' | 'critical'

// アラートルール作成
await performer.analytics.createAlertRule({
  name: 'High CPU Usage',
  condition: {
    metric: 'cpu_usage',
    operator: 'gt',
    threshold: 80
  },
  severity: 'warning',
  enabled: true,
  cooldownPeriod: 5 // 5分間クールダウン
});
```

### プロセス集約アプローチ (オプション)

```typescript
// src/processes/user-onboarding.process.ts
export const processMetadata = {
  id: 'user-onboarding',
  name: 'User Onboarding Process',
  type: 'single',
  hash: 'a1b2c3d4'
};

// プロセスファイルにビジネスロジックを集約
// Effect-TS + Effect Actor + Web Components + ActorDB統合
// すべてこの1ファイルで完結
```

## 🧪 テスト

```bash
# BaaSクライアントテスト (6つのコンポーネントすべて)
pnpm run test:performer-client

# ActorDB統合テスト
pnpm run test:actordb

# Saga統合テスト (オプション)
pnpm run test:saga

# 動的プロセス読み込みテスト (オプション)
pnpm run test:dynamic

# シミュレーター起動
pnpm run simulator

# 全テスト実行
pnpm run test:all
```

### PerformerClientテスト結果

```bash
🧪 Starting PerformerClient Tests...

📝 Test 1: Basic Query ✅
🔍 Test 2: Filtering ✅
📋 Test 3: Field Selection ✅
🔢 Test 4: Ordering and Limiting ✅
🔗 Test 5: Complex Query Chaining ✅
🔐 Test 6: Authentication API ✅
📦 Test 7: Storage API ✅
⚡ Test 8: Functions API ✅
🔄 Test 9: Realtime API ✅
📊 Test 10: Analytics API ✅

✅ All PerformerClient tests passed!
```

### テストカバレッジ

- **Database API**: Supabase-likeクエリ機能 (QueryBuilder)
- **Authentication**: JWT + RBAC認証システム
- **Storage**: ファイルアップロード・管理・URL生成
- **Functions**: WebAssembly関数デプロイ・実行
- **Realtime**: WebSocketベースのリアルタイム通信
- **Analytics**: 使用状況分析・パフォーマンス監視

## 📈 パフォーマンス特性

### WebAssemblyネイティブ実行
- **高速関数実行**: WASMランタイムによるネイティブパフォーマンス
- **セキュアサンドボックス**: 安全な関数実行環境
- **クロスプラットフォーム**: ブラウザ・サーバー両対応

### イベントソーシング最適化
- **不変データ構造**: 効率的なストレージとクエリ
- **リアルタイムストリーム**: WebSocketベースの低遅延通信
- **分散システム対応**: スケーラブルなアーキテクチャ

### 分析・監視機能
- **リアルタイムメトリクス**: システム全体の健全性監視
- **自動アラート**: 異常検知と通知
- **使用状況分析**: 包括的なデータ分析機能

### 開発者体験
- **TypeScript完全対応**: エンドツーエンドの型安全性
- **Supabase互換API**: 学習コストを最小化
- **包括的なテスト**: すべてのコンポーネントのテストカバレッジ

## 🤝 コントリビューション

Performerはオープンソースプロジェクトとして、コミュニティからの貢献を歓迎します。

### 貢献方法

1. **Issueの作成**: バグ報告や機能提案
2. **Pull Request**: コード貢献
3. **ドキュメント改善**: READMEやドキュメントの更新
4. **テスト追加**: テストカバレッジの向上

### 開発ワークフロー

```bash
# 1. リポジトリをフォーク
git clone https://github.com/your-username/performer.git
cd performer

# 2. 依存関係をインストール
pnpm install

# 3. 開発サーバーを起動
pnpm run dev

# 4. テストを実行
pnpm run test:all

# 5. CLIをビルド
pnpm run build:cli
```

### コーディングガイドライン

- **TypeScript**: 完全な型安全性
- **SOLID原則**: 依存関係の最小化と安定化
- **テスト駆動開発**: すべての機能にテストを追加
- **ドキュメント**: コードとAPIの包括的なドキュメント

## 📄 ライセンス

MIT License - see LICENSE file for details

## 🔗 関連プロジェクト

### コアテクノロジー
- [ActorDB](https://github.com/com-junkawasaki/dekigoto) - イベントソーシングデータベース
- [Effect-TS](https://effect.website) - 関数型プログラミングライブラリ
- [Effect Actor](https://github.com/gftdcojp/effect-actor) - アクターシステムと状態管理
- [WebAssembly](https://webassembly.org) - 高速関数実行ランタイム

### 比較対象
- [Supabase](https://supabase.com) - BaaSプラットフォーム
- [Firebase](https://firebase.google.com) - BaaSプラットフォーム
- [PlanetScale](https://planetscale.com) - サーバーレスデータベース

## 🎯 ロードマップ

### v0.2.0 (Current)
- ✅ **7つのBaaSコンポーネント**: Database, Auth, Storage, Functions, Realtime, Advanced Realtime, Analytics
- ✅ **Supabase互換API**: 学習コストを最小化
- ✅ **WebAssembly統合**: 高性能サーバーレス関数
- ✅ **イベントソーシング**: 堅牢なデータ永続化
- ✅ **Rivet-like リアルタイム同期**: WebSocket/SSEデュアルトランスポート + CRDT
- ✅ **スナップショット最適化**: O(n)→O(k)+O(Δ)計算量削減
- ✅ **アクター状態管理**: Effect Actor統合

### v1.1.0 (Next)
- 🔄 **マイクロサービス統合**: 分散システム対応
- 🔄 **GraphQL API**: 柔軟なデータクエリ
- 🔄 **Admin Dashboard**: 管理UIの提供
- 🔄 **CI/CD統合**: 自動デプロイパイプライン

### v2.0.0 (Future)
- 🚀 **マルチクラウド対応**: AWS, GCP, Azure統合
- 🚀 **AI/ML統合**: インテリジェントな分析機能
- 🚀 **リアルタイムコラボレーション**: 同時編集機能
- 🚀 **エッジコンピューティング**: グローバル分散実行

---

*"WebAssembly + Event Sourcing + Process Aggregation = Next-Generation BaaS"*

**Performer** - 未来のWebアプリケーション開発をリードするプラットフォーム 🚀⚡📊
