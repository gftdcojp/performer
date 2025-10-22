# @gftdcojp/performer-data

Graph Port 抽象により Neo4j と Amazon Neptune (openCypher+SigV4) を切替可能なデータ層。

## バックエンド切替

- Neo4j (既定)
  - 環境変数: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE?`
- Neptune (openCypher + IAM SigV4)
  - 環境変数: `NEPTUNE_ENDPOINT`, `NEPTUNE_REGION`, `NEPTUNE_PORT=8182`, `NEPTUNE_IAM_AUTH=true`
  - AWS 認証: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN?`

### 例: 接続生成

```ts
import { createGraphClient } from "./graph/port";

const client = process.env.NEPTUNE_ENDPOINT
  ? createGraphClient({
      type: "neptune",
      endpoint: process.env.NEPTUNE_ENDPOINT!,
      region: process.env.NEPTUNE_REGION!,
      port: Number(process.env.NEPTUNE_PORT ?? 8182),
      useIamAuth: process.env.NEPTUNE_IAM_AUTH !== "false",
    })
  : createGraphClient({
      type: "neo4j",
      uri: process.env.NEO4J_URI!,
      username: process.env.NEO4J_USERNAME!,
      password: process.env.NEO4J_PASSWORD!,
      database: process.env.NEO4J_DATABASE,
    });
```

## 注意

- Neptune ではスキーマ/インデックス操作は No-Op。
- 日時は ISO 文字列に統一（`datetime()` は使用しない）。


