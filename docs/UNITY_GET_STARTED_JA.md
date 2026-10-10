# LIGHT MAZEを自分のPCで開く

対象: https://github.com/Eva-231/light-maze / `codex/hero-quality-foundation`

## GitHub Desktopで取得

1. GitHub Desktopを開き、File → Clone repository → URLを選びます。
2. URLに `https://github.com/Eva-231/light-maze.git` を入力します。Local pathは自分のPCにある任意の場所（例 `C:\Users\自分の名前\Documents\GitHub\light-maze`）を選び、Cloneします。
3. 上部のCurrent branchから `codex/hero-quality-foundation` を選びます。見つからなければFetch originを押してから再確認します。すでに取得済みならFetch origin → Pull originで更新します。手元の未保存変更は破棄しないでください。
4. Repository → Show in Explorerで実際の保存場所を開きます。その中の `UnityProject` に `Assets`、`Packages`、`ProjectSettings` があることを確認します。

以前こちらが案内した `Documents\Codex\...\work` はユーザーPC側に存在する前提にできません。上記で実際に作成したローカルパスを使ってください。

## GitHubに含まれない素材を補完

GitHubにはソース・シーン・設定・.metaを保存しています。Asset Store素材の公開再配布を避けるため、GanzSeパックとそこから生成するプレイヤー・敵のPrefab、スキンメッシュ、アニメーションは除外しています。Library、Temp、LogsはUnityが作り直すので不要です。

このチャットの `LIGHT-MAZE-local-assets.zip` は、今回作業環境で確認できた既存のGanzSeパックを同じ利用者のPCへ戻すための個人用補完ZIPです。公開GitHubへ追加しないでください。

1. ZIPを任意の一時フォルダーに展開します。
2. 展開先の `UnityProject\Assets\URP GanzSe Free Modular Character Pack` と、その隣の同名 `.meta` を、取得したリポジトリの `UnityProject\Assets` にコピーします。
3. ZIPを利用できない場合は、素材を取得したUnityアカウントのMy Assetsから同パックをインポートしてください。生成派生ファイルは後述のBuild Charactersで作られます。

ZIP内には完成したリアルな主人公モデルはありません。現時点の素材は既存のスタイライズドモデルであり、希望されているリアルな主人公は未完成です。

## Unity Hubから開く

1. HubのInstallsで `6000.5.11f1` を用意します。プロジェクトの `ProjectSettings/ProjectVersion.txt` に記録された版です。Windows Build Supportも確認してください。
2. Projects → Add / Import project from diskから、取得先の `light-maze\UnityProject` を選びます。`light-maze` や `Assets` を選ばないでください。
3. 初回のパッケージ復元とインポートを待ちます。途中でバージョン更新を求められた場合は、まず記録された版を使ってください。6000.6.5f1での互換性はまだ実機確認していません。
4. Consoleに赤いエラーがないことを確認します。素材を補完した状態ならキャラクターは自動生成されます。既存の生成物を今回の剣アニメーションへ更新するには `LIGHT MAZE → Production → 6. Build Characters` を実行します。
5. `Assets/Scenes/SampleScene.unity` を開いてPlayします。

操作: WASD移動、Shift走行、Space回避、左クリック/J剣、右クリック/K光弾、Q氷、E回復。ゲームパッドはLS移動、RS視点、X剣、B回避、RT光弾、LB氷、Y回復。死亡後はR/Startで再開。

## 動作確認とWindowsビルド

1. Window → General → Test Runner → PlayMode → Run All。`LightMaze.Tests.PlayerAcceptanceTests` の5件を確認します。移動/死亡、魔法、剣の単発判定と背面除外、死亡後リトライ、表示とAnimator接続を検証します。
2. 手動Playでも顔・髪・衣装、剣の見た目と判定タイミング、カメラ、敵との戦闘を確認します。テスト成功だけで見た目の品質は保証されません。
3. Playを停止し、`LIGHT MAZE → Build → Windows Development Build` を実行します。
4. 成功時の出力は `UnityProject\Builds\Windows\LightMaze.exe` です。配布や移動には同じWindowsフォルダーの全ファイルが必要です。

## 今回の確認状態

- Unityランタイム、Editorコード、PlayModeテストコードは、保管されていたUnity DLLを使う独立C#コンパイルで成功しました。
- 実際のUnity起動は作業環境のライセンスIPC接続拒否とキャッシュアクセス拒否により停止しました。ユーザー側でライセンスが未有効という意味ではありません。
- Unity Editorでのコンパイル完了、PlayModeテスト実行、Windowsビルド成功、見た目の合格はまだ確認できていません。Windows実行ファイルを完成品として提供できる状態ではありません。
- 今回追加: シーン再ロード時の再生成、3段剣コンボの入力バッファ/ダメージ/射程/角度/遮蔽/回避と死亡時の中断、剣用の3状態と暫定スケルトンアニメーション、5件のPlayModeテスト、欠落.metaの補完。
- リアルな主人公は未完成。Falの接続アカウントは残高不足で3D生成を開始できず、課金は行っていません。
