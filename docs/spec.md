# Obsidian Workout Tracker — Requirements

## Overview

ワークアウトの記録を種目ごとに正規化された構造データとして保存し、スマホから快適に入力できるObsidianプラグイン。専用のダッシュボードファイルをリッチUIとして表示し、各日のワークアウトを個別の`.md`ファイル（YAMLフロントマター）で管理する。

## Problem Statement

これまでdaily noteに自然言語でワークアウトを記録していたため、記載粒度にばらつきがあり、種目ごとのフォーマットも統一されていなかった。その結果、データの解析や振り返りが困難だった。

## Scope

- **User**: 個人利用のみ（シングルボルト、シングルユーザー）
- **Distribution**: 公開・配布は対象外
- **Platform**: モバイル（スマホのObsidian）を主な利用環境とする
- **Phase**: 最小限の動作するMVPを優先する

## Functional Requirements

### Core Features

- **[FR-01]** `dashboard.md` をカスタムビュー（`workout-dashboard`）として登録し、専用のリッチUIで表示する
- **[FR-02]** ダッシュボードに種目タイプ別のチップボードを表示し、チップタップで直接入力モーダルを開く
- **[FR-03]** 種目タイプに応じた入力UIを表示してワークアウトを記録する
- **[FR-04]** 記録したデータを `workout/YYYY-MM-DD.md`（YAMLフロントマター形式）に保存する
- **[FR-05]** ダッシュボードに直近5件のワークアウトを日付ごとにグルーピングして縦1列リストで表示する
- **[FR-06]** 種目は3つのタイプに分類し、タイプごとに異なる入力UIを提供する
- **[FR-07]** プラグイン設定画面で種目の追加・削除ができる
- **[FR-08]** ダッシュボード上の既存ワークアウト行をタップすると編集モーダルが開き、更新または削除ができる
- **[FR-09]** コマンドパレットから「ダッシュボードを開く」（`open-workout-dashboard`）でダッシュボードを開ける
- **[FR-10]** 保存・更新・削除完了時にトースト通知（Saved / Updated / Deleted）を表示する

### Exercise Types

| タイプ | 入力フィールド | 例 |
|--------|--------------|-----|
| `sets` | セットごとにreps（複数セット追加可能） | 懸垂、斜め懸垂、腹筋、スクワット |
| `emom` | reps × sets（2フィールド） | 腕立てemom、ディップス、懸垂emom |
| `cardio` | commentのみ | 有酸素（ダッシュ、水泳など） |

各種目には`comment`フィールドを持つ（任意入力）。

### Input UI

- **`sets`**: 数字パッド（numpad）でreps入力 → `+ SET`でチップ化。チップ再タップで編集/削除可能
- **`emom`**: REPS / SETS の2フィールドを数字パッドで入力（アクションキーでフォーカス切替）
- **`cardio`**: テキスト入力（任意）。クイックプリセット（Sprint / Swim / Jog / Bike / Jump rope）でワンタップ入力可能
- **共通**: `Add note`ボタンでコメント入力欄を展開（cardioは常時表示）

### Data Schema

各日のワークアウトファイル（`workout/YYYY-MM-DD.md`）のYAMLフロントマター：

```yaml
---
date: YYYY-MM-DD
exercises:
  - menu: "懸垂"
    type: sets
    sets: [12, 7]
    comment: ""
  - menu: "腕立てemom"
    type: emom
    reps: 9
    sets: 10
    comment: ""
  - menu: "有酸素"
    type: cardio
    comment: "ダッシュ"
---
```

`menu`と`comment`はダブルクォート文字列としてシリアライズされる（バックスラッシュ・改行・タブはエスケープ）。シリアライズはYAMLライブラリを使わず`FileManager.serialize()`で手動生成する。

### UI Components

- **Commands**: `open-workout-dashboard`（ダッシュボードを開く）
- **Ribbon**: なし（MVPスコープ外）
- **Views / Panels**: `dashboard.md` に紐づくカスタムビュー（`DashboardView` / `WORKOUT_VIEW_TYPE = 'workout-dashboard'`）
- **Modals**:
  - `ExerciseInputModal`（種目タイプ別の入力フォーム、新規/編集兼用）
- **Settings Tab**: 種目リストの管理（種目名・タイプの追加・削除）、ワークアウトフォルダ・ダッシュボードファイルパスの変更

### Dashboard Layout

ダッシュボードの構成：

1. **Top bar**: ダッシュボードファイルパス表示
2. **Header**: `Workout Log` タイトル + サブテキスト
3. **Chip board**: 種目タイプ別（SETS / EMOM / CARDIO）にグルーピングされたチップ群。タップで`ExerciseInputModal`を起動
4. **List**: 日付グループごとに直近5件分のワークアウトカードを表示
5. **Toast**: 保存等のフィードバック表示用（非表示が既定）

### Dashboard Card Display

各日付グループのカード内に以下を表示する：

- date（記録日: 曜日 + ISO日付）
- 種目ごとに1行（タップで編集モーダル）
  - typeタグ（`sets` / `emom` / `cardio`）
  - 種目名
  - 詳細表示
    - `sets`: `+12 +7` のようなバッジ列 + 合計表示（`19 total`）
    - `emom`: `reps × sets` バッジ + 合計表示（`reps * sets`）
    - `cardio`: comment文字列をインラインで表示
- comment（sets / emom で入力されている場合のみ、`>`スタイルで行下にインデント表示）

#### UIイメージ

```
┌─────────────────────────────────────────────┐
│  • dashboard.md                             │
│                                             │
│  Workout Log                                │
│  Tap to add a record                        │
│                                             │
│  · SETS                                     │
│  [+ 懸垂] [+ 腹筋] [+ スクワット]            │
│  · EMOM                                     │
│  [+ 腕立てemom] [+ ディップス]               │
│  · CARDIO                                   │
│  [+ 有酸素]                                  │
│                                             │
│  TUE  2026-04-28  ─────────────────────     │
│  ┌─────────────────────────────────────┐   │
│  │ [sets] 懸垂      +12 +7    19 total │   │
│  │ [emom] 腕立てemom 9×10     90 total │   │
│  │ [cardio] 有酸素   ダッシュ           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  MON  2026-04-27  ─────────────────────     │
│  ┌─────────────────────────────────────┐   │
│  │ [sets] 腹筋     +10 +10 +10  30 total│  │
│  │ [sets] スクワット  +23      23 total │   │
│  │ > 手首が少し痛い                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  （直近5件まで表示）                        │
└─────────────────────────────────────────────┘
```

種目が未登録の場合はチップボードに案内メッセージ、ワークアウトが未記録の場合はリスト領域に空表示（🏋️ アイコン + プロンプト）を出す。

### Data Access

- **Reads**: `workout/YYYY-MM-DD.md` のYAMLフロントマター（直近5件分、`workout`フォルダ内の`.md`ファイルをファイル名降順で取得）
- **Writes**: `workout/YYYY-MM-DD.md` の新規作成・既存ファイルへの上書き（同日内のエントリは配列にappend / 編集時は対象indexを置換 / 削除時は対象indexをsplice）
- **Persistence**: 種目リスト定義・フォルダパス・ダッシュボードパスを`data.json`に保存（`plugin.loadData()` / `plugin.saveData()`）

### Dashboard File Interception

- プラグイン起動時（`onLayoutReady`）に`dashboardPath`の`.md`ファイルが存在しない場合、空のプレースホルダーファイルを作成する
- 起動完了後、`dashboardPath`が開かれたMarkdownリーフを検出してカスタムビュー（`workout-dashboard`）に差し替える
- 以降、`file-open`イベントで`dashboardPath`が開かれた際もカスタムビューに自動で差し替える
- `isInitializing`フラグで初期化中の`file-open`イベントは無視する

## Non-Functional Requirements

- **[NFR-01]** 個人利用のためi18nや多ユーザー対応は不要
- **[NFR-02]** モバイルObsidianで動作すること（タップ操作で完結するUI）
- **[NFR-03]** 標準の`.md`ファイル形式で保存するためObsidian Syncや他の同期サービスと互換性を保つ
- **[NFR-04]** MVPとして最小限の機能を優先し、複雑な処理は避ける

## Out of Scope

- 統計・グラフ表示（種目ごとのreps推移など）
- 通知・リマインダー機能
- データエクスポート（CSV/JSONダウンロード）
- リボンアイコンの追加
- daily noteへの書き込み連携
- 種目リストの並び替え・編集（追加と削除のみ）

## Decision Log

- **カンバンカード表示項目**: date・種目・回数・comment をすべて表示する
- **同日の記録**: 1日1ファイル（`workout/YYYY-MM-DD.md`）に上書き保存し、エントリは配列に追加する
- **種目プリセット**: なし。設定画面から空の状態で始め、ユーザーが追加する
- **種目選択UI**: モーダルではなくダッシュボード上のチップボードに統合し、ワンタップで入力モーダルが開けるようにする
- **編集UI**: 既存行のタップで入力モーダルを再利用（`initial` 渡して編集モード化、`onDelete`でDeleteボタン表示）
- **commentの表示位置**: cardioは詳細欄の右側にインライン表示、sets/emomは行下に`>`スタイルでインデント表示
