# RedirectFlow Development Workflow

このプロジェクトでは、デプロイエラーを防ぐために以下の「鉄壁フロー」を適用します。

## 1. 開発ブランチ
- 全ての実装は `develop` ブランチで行います。
- `main` ブランチは本番（Vercel）専用です。

## 2. コミット・プッシュ前のチェック
1. **Local Build**: `npm run build` を実行し、TypeScriptの型エラーやビルドエラーがないか確認。
2. **Code Audit**: 別のエージェント（Claude 3.5 Sonnet 等）を呼び出し、実装内容の論理的ミスやバグがないかレビュー。

## 3. デプロイ
- `develop` でビルドが成功し、レビューをパスした後に `main` へマージし、デプロイを実行します。
