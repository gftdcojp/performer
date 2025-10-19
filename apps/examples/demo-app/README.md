# Performer Demo App

BPMN + Actor + Neo4j Web Framework のデモアプリケーション

## 概要

このデモアプリケーションは、Performer フレームワークの機能を実際に体験できる完全な BPMN プロセス管理システムです。

注文受付から承認・決済までのワークフローを視覚的に管理できます。

## 主な機能

- **注文プロセス管理**: BPMN を使用した注文ワークフロー
- **リアルタイムダッシュボード**: プロセス状態の監視
- **ユーザー認証**: Auth0 を使用したセキュアな認証
- **データ永続化**: Neo4j を使用したグラフデータベース
- **アクターモデル**: 分散処理のためのアクターシステム
- **フォーム管理**: BPMN フォームを使用した動的フォーム

## Docker でのクイックスタート

### 前提条件

- Docker
- Docker Compose

### セットアップ

```bash
# リポジトリをクローン（またはこのディレクトリに移動）
cd apps/examples/demo-app

# 環境変数を設定（オプション）
cp .env.example .env
# .env ファイルを編集して実際の値に変更

# Docker イメージをビルドして起動
make setup

# または手動で実行
docker-compose build
docker-compose up -d
```

### アクセス

- **Demo App**: http://localhost:8100
- **Neo4j Browser**: http://localhost:7474 (ユーザー: neo4j, パスワード: password)

## ローカル開発環境

### 前提条件

- Node.js 18+
- pnpm

### セットアップ

```bash
# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev

# ブラウザで開く
open http://localhost:8100
```

## 使用方法

### 注文プロセス

1. **注文作成**: ホームページから新しい注文を作成
2. **プロセス開始**: 注文が自動的に BPMN プロセスを開始
3. **承認ワークフロー**: マネージャーによる承認プロセス
4. **決済処理**: 承認後に決済処理を実行
5. **完了**: 注文が完了状態になる

### 管理機能

- **ダッシュボード**: 全プロセスの状態監視
- **プロセスインスタンス**: 個別プロセスの詳細表示
- **タスク管理**: 割り当てられたタスクの管理
- **ユーザー管理**: ユーザー権限の管理

## アーキテクチャ

```
demo-app/
├── src/
│   ├── components/     # React コンポーネント
│   ├── pages/         # ページコンポーネント
│   ├── processes/     # BPMN プロセス定義
│   └── server/        # サーバーサイド処理
├── neo4j-init/        # データベース初期化
├── docker-compose.yml # Docker Compose 設定
└── Dockerfile         # コンテナビルド設定
```

## 環境変数

| 変数 | 説明 | デフォルト値 |
|------|------|-------------|
| `NEO4J_URI` | Neo4j データベース URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j ユーザー名 | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j パスワード | `password` |
| `AUTH0_DOMAIN` | Auth0 ドメイン | `demo.auth0.com` |
| `AUTH0_CLIENT_ID` | Auth0 クライアントID | `demo-client-id` |
| `AUTH0_AUDIENCE` | Auth0 API 識別子 | `demo-api` |

## Docker コマンド

```bash
# サービスを開始
make up

# ログを表示
make logs

# サービスを停止
make down

# 完全クリーンアップ
make clean

# ヘルスチェック
make health
```

## トラブルシューティング

### 一般的な問題

**ポートが使用中**
```bash
# 使用中のポートを確認
lsof -i :8100
lsof -i :7474
lsof -i :7687

# ポートを変更する場合
echo "PORT=8101" >> .env
```

**Neo4j 接続エラー**
```bash
# Neo4j コンテナの状態を確認
docker-compose ps

# Neo4j ログを確認
docker-compose logs neo4j

# 手動で再起動
docker-compose restart neo4j
```

**メモリ不足**
```bash
# Docker Desktop のメモリを増やす
# またはコンテナのメモリ制限を調整
```

## API エンドポイント

### 注文関連

- `POST /api/orders` - 新しい注文を作成
- `GET /api/orders/:id` - 注文詳細を取得
- `PUT /api/orders/:id/approve` - 注文を承認
- `PUT /api/orders/:id/pay` - 決済を実行

### プロセス関連

- `GET /api/processes` - 全プロセスを取得
- `GET /api/processes/:id` - プロセス詳細を取得
- `POST /api/processes/:id/tasks/:taskId/complete` - タスクを完了

## 開発者向け情報

### プロジェクト構造

```
src/
├── App.tsx              # メインアプリケーション
├── main.tsx             # エントリーポイント
├── components/          # 再利用可能なコンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   └── ...
├── pages/              # ページコンポーネント
│   ├── home/           # ホームページ
│   ├── admin/          # 管理ページ
│   └── ...
├── processes/          # BPMN プロセス定義
├── server/             # サーバーサイド処理
│   ├── order/          # 注文関連処理
│   └── ...
└── index.css           # グローバルスタイル
```

### カスタマイズ

1. **プロセス定義の変更**: `src/processes/` のファイルを編集
2. **UI のカスタマイズ**: `src/components/` のコンポーネントを変更
3. **API の拡張**: `src/server/` に新しいエンドポイントを追加

## ライセンス

MIT License

## 関連リンク

- [Performer Framework](https://github.com/gftdcojp/performer)
- [BPMN.io](https://bpmn.io/)
- [Neo4j](https://neo4j.com/)
- [Auth0](https://auth0.com/)
