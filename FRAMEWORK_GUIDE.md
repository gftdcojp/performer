# Performer Framework 完全ガイド

BPMN + Actor + Neo4j Web Framework（Next.js 型規約 × Remix 境界 × Effect 実行）

## 📋 目次

1. [概要と特徴](#概要と特徴)
2. [アーキテクチャ概観](#アーキテクチャ概観)
3. [クイックスタート](#クイックスタート)
4. [プロジェクト構造と命名規則](#プロジェクト構造と命名規則)
5. [BPMN プロセス開発](#bpmn-プロセス開発)
6. [アクターシステム](#アクターシステム)
7. [データアクセス（Neo4j）](#データアクセスneo4j)
8. [認証・認可](#認証認可)
9. [監視・オブザーバビリティ](#監視オブザーバビリティ)
10. [デプロイメント](#デプロイメント)
11. [ベストプラクティス](#ベストプラクティス)
12. [トラブルシューティング](#トラブルシューティング)

## 🎯 概要と特徴

Performer は、ビジネスプロセス管理（BPMN）、アクターシステム、Neo4j データベースを統合したフルスタック Web フレームワークです。Next.js のファイルベースルーティング、Remix の loader/action パターン、Effect の関数型プログラミングを組み合わせた独自のアーキテクチャを提供します。

### 🚀 主な特徴

- **BPMN 制御フロー**: ビジネスプロセスを視覚的に定義・実行
- **アクターシステム**: サービスタスクの分散実行と障害耐性
- **Neo4j 統合**: グラフデータベースによる柔軟なデータ管理
- **型安全**: TypeScript + Zod によるエンドツーエンドの型安全性
- **モノレポ**: pnpm + Turborepo による効率的な開発
- **Human-in-the-Loop**: Camunda FormJS 統合によるフォーム操作

## 🏗️ アーキテクチャ概観

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
| フォーム | Camunda FormJS | Human-in-the-Loop フォーム |

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

## 🚀 クイックスタート

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

#### 1. Neo4j の設定

```bash
# Neo4j を起動
docker run -d -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5.0
```

#### 2. Auth0 の設定

```typescript
// packages/actions/src/config.ts
export const auth0Config = {
  domain: 'your-domain.auth0.com',
  clientID: 'your-client-id',
  audience: 'your-api-identifier'
}
```

#### 3. 環境変数の設定

```bash
cp .env.example .env
# .env を編集
```

## 📁 プロジェクト構造と命名規則

### ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|----------|----|
| ページ | `page.client.tsx` | `app/order/page.client.tsx` |
| サーバーローダー | `loader.server.ts` | `app/order/loader.server.ts` |
| サーバーアクション | `actions.server.ts` | `app/order/actions.server.ts` |
| BPMN プロセス | `process.flow.ts` | `app/order/process.flow.ts` |
| データモデル | `model.ts` | `app/order/model.ts` |

### ディレクトリ構造

```
app/
├── [feature]/
│   ├── page.client.tsx          # UI コンポーネント
│   ├── loader.server.ts         # データ読み込み
│   ├── actions.server.ts        # データ書き込み
│   ├── process.flow.ts          # BPMN プロセス定義
│   └── model.ts                 # データモデル
```

## 🔄 BPMN プロセス開発

### プロセス定義

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

### ユーザータスク（Human-in-the-Loop）

```typescript
// app/order/process.flow.ts
import { flow } from "@pkg/process";

export const approvalProcess = flow("ApprovalProcess", (p) => {
  p.startEvent("ApprovalRequested")
    .userTask("ManagerReview", {
      formSchema: {
        type: "default",
        components: [
          {
            type: "number",
            id: "amount",
            label: "承認金額",
            validate: { required: true }
          },
          {
            type: "select",
            id: "decision",
            label: "承認判断",
            values: [
              { label: "承認", value: "approved" },
              { label: "却下", value: "rejected" }
            ]
          },
          {
            type: "textarea",
            id: "comments",
            label: "コメント"
          }
        ]
      }
    })
    .exclusiveGateway("DecisionCheck")
      .when("approved", { expr: "${vars.decision == 'approved'}" })
        .serviceTask("ProcessApproval")
        .endEvent("Approved")
      .otherwise()
        .serviceTask("SendRejection")
        .endEvent("Rejected");
});
```

### プロセス実行

```typescript
// app/order/actions.server.ts
"use server";

import { startProcess, completeTask } from "@pkg/process";
import { withTx } from "@pkg/data/tx";

export async function startOrder(input: OrderInput) {
  return withTx(async (tx) => {
    const processInstance = await startProcess({
      processId: "OrderProcess",
      businessKey: input.businessKey,
      variables: {
        amount: input.amount,
        customerId: input.customerId
      }
    }, { tx });

    return { processInstanceId: processInstance.id };
  });
}

export async function completeApproval(input: ApprovalInput) {
  return withTx(async (tx) => {
    await completeTask({
      taskId: input.taskId,
      variables: {
        decision: input.decision,
        comments: input.comments
      }
    }, { tx });

    return { ok: true };
  });
}
```

## 🎭 アクターシステム

### アクター定義

```typescript
// packages/actor/src/order-actor.ts
import { Actor, actor } from "@pkg/actor";

interface OrderActorState {
  orderId: string;
  status: "pending" | "processing" | "completed";
}

export const orderActor = actor<OrderActorState>("OrderActor", {
  initialState: (orderId: string) => ({
    orderId,
    status: "pending"
  }),

  actions: {
    startProcessing: (state) => ({
      ...state,
      status: "processing"
    }),

    complete: (state) => ({
      ...state,
      status: "completed"
    })
  },

  effects: {
    onStartProcessing: async (state, ctx) => {
      // 外部サービス呼び出しなど
      await ctx.callExternalService("process-order", {
        orderId: state.orderId
      });
    }
  }
});
```

### アクター使用

```typescript
// app/order/actions.server.ts
import { spawnActor, sendMessage } from "@pkg/actor";

export async function processOrder(orderId: string) {
  const actorRef = await spawnActor(orderActor, orderId);

  // アクターにメッセージ送信
  await sendMessage(actorRef, "startProcessing");

  return { actorId: actorRef.id };
}
```

## 🗄️ データアクセス（Neo4j）

### モデル定義

```typescript
// app/order/model.ts
import { Model, model } from "@pkg/data";

export interface Order {
  id: string;
  businessKey: string;
  customerId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export const OrderModel = model("Order", {
  id: { type: "string", primary: true },
  businessKey: { type: "string", unique: true },
  customerId: { type: "string", required: true },
  amount: { type: "number", required: true },
  status: { type: "string", required: true },
  createdAt: { type: "date", default: () => new Date() }
});
```

### クエリ実行

```typescript
// app/order/loader.server.ts
"use server";

import { q } from "@pkg/data/effect-cypher";
import { OrderModel } from "./model";

export async function loader({ businessKey }: { businessKey: string }) {
  return q(OrderModel)
    .matchNode("o", { businessKey })
    .ret("o")
    .one();
}
```

### 複雑なクエリ

```typescript
// 関連データを含むクエリ
export async function getOrderWithCustomer(orderId: string) {
  return q(OrderModel)
    .matchNode("o", { id: orderId })
    .matchRelationship("o", "BELONGS_TO", "c", "Customer")
    .ret("o", "c")
    .one();
}

// 集計クエリ
export async function getOrderStats() {
  return q(OrderModel)
    .matchNode("o")
    .ret("count(o) as totalOrders", "sum(o.amount) as totalAmount")
    .one();
}
```

### トランザクション

```typescript
// app/order/actions.server.ts
import { withTx } from "@pkg/data/tx";

export async function createOrder(input: OrderInput) {
  return withTx(async (tx) => {
    // 注文作成
    const order = await q(OrderModel)
      .create({
        businessKey: input.businessKey,
        customerId: input.customerId,
        amount: input.amount,
        status: "pending"
      })
      .ret("o")
      .one({ tx });

    // 顧客との関連作成
    await q()
      .matchNode("o", "Order", { id: order.id })
      .matchNode("c", "Customer", { id: input.customerId })
      .createRelationship("o", "BELONGS_TO", "c")
      .run({ tx });

    return order;
  });
}
```

## 🔐 認証・認可

### Auth0 設定

```typescript
// packages/actions/src/auth.ts
import { initAuth0 } from "@auth0/nextjs-auth0";

export const auth0 = initAuth0({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!
});
```

### 認可デコレータ

```typescript
// packages/actions/src/guards.ts
import { auth0 } from "./auth";

export function authorize(permissions: string[]) {
  return async function guard() {
    const session = await auth0.getSession();

    if (!session) {
      throw new Error("Unauthorized");
    }

    // 権限チェック
    const userPermissions = session.user.permissions || [];
    const hasPermission = permissions.every(p =>
      userPermissions.includes(p)
    );

    if (!hasPermission) {
      throw new Error("Forbidden");
    }

    return { user: session.user };
  };
}
```

### アクションでの使用

```typescript
// app/order/actions.server.ts
import { authorize } from "@pkg/actions/guards";

export async function createOrder(input: OrderInput) {
  const { user } = await authorize(["order:create"]);

  // ユーザーに紐付けて注文作成
  return withTx(async (tx) => {
    const order = await q(OrderModel)
      .create({
        ...input,
        createdBy: user.id
      })
      .ret("o")
      .one({ tx });

    return order;
  });
}
```

### RBAC/ABAC ポリシー

```typescript
// packages/actions/src/policies.ts
export const orderPolicies = {
  // RBAC: ロールベース
  canCreateOrder: (user: User) =>
    user.roles.includes("order_manager") ||
    user.roles.includes("admin"),

  // ABAC: 属性ベース
  canApproveOrder: (user: User, order: Order) =>
    user.roles.includes("manager") &&
    order.amount <= user.approvalLimit,

  // 組織ベース
  canViewOrder: (user: User, order: Order) =>
    user.organizationId === order.organizationId ||
    user.roles.includes("admin")
};
```

## 📊 監視・オブザーバビリティ

### OpenTelemetry 設定

```typescript
// packages/observability/src/tracing.ts
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// 自動計装
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new Neo4jInstrumentation()
  ]
});
```

### メトリクス収集

```typescript
// packages/observability/src/metrics.ts
import { MeterProvider, Meter } from "@opentelemetry/metrics";

export const meter = new MeterProvider().getMeter("performer");

export const orderMetrics = {
  ordersCreated: meter.createCounter("orders_created_total", {
    description: "Total number of orders created"
  }),

  orderProcessingTime: meter.createHistogram("order_processing_duration", {
    description: "Time taken to process orders"
  }),

  activeProcesses: meter.createUpDownCounter("active_processes", {
    description: "Number of currently active processes"
  })
};
```

### エラーモニタリング

```typescript
// packages/observability/src/error-monitoring.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Neo4j()
  ]
});

export const captureError = (error: Error, context?: any) => {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext("additional_info", context);
    }
    Sentry.captureException(error);
  });
};
```

### トレース使用

```typescript
// app/order/actions.server.ts
import { trace } from "@pkg/observability/tracing";

export async function processOrder(input: OrderInput) {
  return trace("processOrder", async (span) => {
    span.setAttribute("order.businessKey", input.businessKey);
    span.setAttribute("order.amount", input.amount);

    try {
      const result = await createOrder(input);
      span.setAttribute("order.id", result.id);
      return result;
    } catch (error) {
      span.recordException(error);
      throw error;
    }
  });
}
```

## 🚀 デプロイメント

### Docker ビルド

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["pnpm", "start"]
```

### Kubernetes デプロイ

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: performer-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: performer
  template:
    metadata:
      labels:
        app: performer
    spec:
      containers:
      - name: performer
        image: performer:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEO4J_URI
          value: "bolt://neo4j-service:7687"
        - name: AUTH0_DOMAIN
          valueFrom:
            secretKeyRef:
              name: auth0-secrets
              key: domain
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 環境別設定

```typescript
// config/environments.ts
export const environments = {
  development: {
    neo4j: {
      uri: "bolt://localhost:7687",
      user: "neo4j",
      password: "password"
    },
    auth0: {
      domain: "dev-domain.auth0.com",
      audience: "dev-api"
    }
  },
  staging: {
    neo4j: {
      uri: process.env.NEO4J_URI!,
      user: process.env.NEO4J_USER!,
      password: process.env.NEO4J_PASSWORD!
    },
    auth0: {
      domain: process.env.AUTH0_DOMAIN!,
      audience: process.env.AUTH0_AUDIENCE!
    }
  },
  production: {
    neo4j: {
      uri: process.env.NEO4J_URI!,
      user: process.env.NEO4J_USER!,
      password: process.env.NEO4J_PASSWORD!
    },
    auth0: {
      domain: process.env.AUTH0_DOMAIN!,
      audience: process.env.AUTH0_AUDIENCE!
    }
  }
};
```

## 📋 ベストプラクティス

### 1. プロセス設計

- **単一責任**: 各プロセスは1つのビジネス機能を担当
- **適切な粒度**: プロセスを小さく保ち、再利用性を高める
- **エラーハンドリング**: 各ステップで適切なエラーハンドリングを実装

### 2. データモデリング

- **グラフ思考**: Neo4j の特性を活かした関係中心の設計
- **インデックス活用**: 頻繁に検索されるプロパティにインデックスを作成
- **スキーマ制約**: データ整合性を保つための制約を定義

### 3. アクター設計

- **メッセージ駆動**: アクター間はメッセージで通信
- **障害耐性**: アクターの障害がシステム全体に影響しない設計
- **リソース管理**: アクターのライフサイクルを適切に管理

### 4. セキュリティ

- **最小権限**: 必要な権限のみを付与
- **入力検証**: すべての入力データを検証
- **監査ログ**: 重要な操作をログに記録

### 5. パフォーマンス

- **クエリ最適化**: Cypher クエリを効率的に記述
- **キャッシュ戦略**: 適切なキャッシュ層を実装
- **非同期処理**: 重い処理は非同期で実行

## 🔧 トラブルシューティング

### 一般的な問題

#### 1. Neo4j 接続エラー

```bash
# 接続テスト
curl http://localhost:7474/

# ログ確認
docker logs neo4j-container
```

#### 2. Auth0 設定エラー

```typescript
// 設定確認
const auth0 = initAuth0({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  audience: process.env.AUTH0_AUDIENCE
});

// デバッグログ
console.log('Auth0 config:', {
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID?.substring(0, 10) + '...',
  audience: process.env.AUTH0_AUDIENCE
});
```

#### 3. BPMN プロセス実行エラー

```typescript
// プロセス状態確認
const processInstance = await getProcessInstance(processInstanceId);
console.log('Process state:', processInstance.state);

// 変数確認
console.log('Process variables:', processInstance.variables);
```

### デバッグツール

#### 開発時ログ

```typescript
// packages/observability/src/debug.ts
import { logger } from "./logger";

export const debug = {
  // プロセス実行の詳細ログ
  logProcessExecution: (processId: string, variables: any) => {
    logger.info(`Process ${processId} executed`, {
      variables,
      timestamp: new Date().toISOString()
    });
  },

  // データベースクエリログ
  logQuery: (query: string, params: any, duration: number) => {
    logger.debug(`Query executed in ${duration}ms`, {
      query,
      params,
      duration
    });
  },

  // エラートレース
  logError: (error: Error, context: any) => {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      context
    });
  }
};
```

#### テストヘルパー

```typescript
// プロセス実行テスト
export const testProcessExecution = async (processId: string, input: any) => {
  const tracer = await startProcess({
    processId,
    businessKey: `test-${Date.now()}`,
    variables: input
  });

  // プロセス完了まで待機
  await waitForProcessCompletion(tracer.id);

  return tracer;
};

// データベース状態テスト
export const testDatabaseState = async (query: string) => {
  const result = await q().raw(query).run();
  console.table(result.records);
  return result;
};
```

### パフォーマンスチューニング

#### 1. クエリ最適化

```typescript
// 非効率なクエリ
const badQuery = q(OrderModel)
  .matchNode("o")
  .matchRelationship("o", "BELONGS_TO", "c")
  .ret("o", "c")
  .many();

// 最適化されたクエリ
const goodQuery = q(OrderModel)
  .matchNode("o", { status: "active" }) // 条件を追加
  .matchRelationship("o", "BELONGS_TO", "c")
  .ret("o", "c")
  .many();
```

#### 2. インデックス作成

```cypher
// Neo4j でインデックス作成
CREATE INDEX order_business_key FOR (o:Order) ON (o.businessKey);
CREATE INDEX order_status FOR (o:Order) ON (o.status);
CREATE INDEX customer_email FOR (c:Customer) ON (c.email);
```

#### 3. キャッシュ戦略

```typescript
// Redis キャッシュ
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  get: async (key: string) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  set: async (key: string, value: any, ttl = 300) => {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  invalidate: async (pattern: string) => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

## 📚 追加リソース

- [公式ドキュメント](docs/)
- [API リファレンス](docs/api-reference.md)
- [サンプルアプリケーション](apps/examples/demo-app/)
- [コミュニティ](https://github.com/gftdcojp/performer/discussions)

---

このガイドは Performer Framework の包括的な使用方法を説明しています。実際の開発では、各パッケージの詳細な API ドキュメントを参照してください。
