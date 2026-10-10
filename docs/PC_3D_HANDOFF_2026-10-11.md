# LIGHT MAZE PC 3D — 2026-10-11 作業記録

## 現在の到達点

完成ゲームではありません。高品質な主人公の制作・導入・実画面評価は未完了です。
今回のC#変更はUnity付属Roslynと復旧した参照DLLでコンパイルしました。
Unity Editor内の再インポート、Edit/Play Modeテスト、Windowsビルドの成功を意味しません。
Editor起動は `No valid Unity Editor license found`、終了コード198で停止しました。

## 既存資産の調査

- main: `1cb22b0`、unity-vertical-slice: `4ab390b`。
- feature/abyss-99f-overhaul: `942228e`。PR #2はマージ済み、merge commit `8d7e9a5`。
- railway/code-change-NA9OXT: `4eaa7f2`。
- 今回はUnityブランチから `codex/hero-quality-foundation` を作成。
- Unity 6000.5.11f1、URP 17.5.0、Input System 1.20.0。
- 既存Unity版には移動、回避、光弾、氷、回復、3種類の敵、HUDとモデル差し替え機構がある。
- 剣コンボ、ロックオン、18面・99階・装備・保存のUnity統合は未完了。ブラウザ実装の存在をUnityの完成と混同しない。
- Dドライブの移行バックアップでEditor本体、Windowsビルドモジュール、旧プロジェクト、GanzSe素材を発見。
- バックアップには未コミットの材質変更が存在。元データは変更せず、GanzSe素材のみ作業コピーへ復旧。
- 既存モデルは低ポリゴン。最終主人公として受け入れない。

## 実施した変更

- 主人公の死亡後の移動・回避を停止。
- Xbox系Gamepad: 左スティック移動、押下ダッシュ、右スティック視点、B回避、RT光弾、LB氷、Y回復、Start死亡時リトライ。実機未確認。
- 人物導入ツールはマテリアル単位で置換し、目・角膜・虹彩・涙・歯・舌を一括した肌置換から保護。既存LODGroupを維持。
- 音声開始と設定反映の相互再帰を修正し、再有効化の回帰検証を追加。
- Windows開発ビルドのバッチエントリを追加。不足モデルやAnimator Controllerを検出した場合は失敗させる。

## 検証

- package.jsonのtestで列挙される8本をNodeで実行。全て終了コード0。
- 初回stability-testsではPASS表示に加えてRangeErrorが出たため不合格として修正。修正後は同エラーなし。
- build.mjs、standalone/verify.mjs、standalone/verify.mjs --built: 成功。
- 現在のRuntime/EditorソースをUnity付属Roslynで再コンパイル: 成功、既存の非推奨API警告あり。
- Unity Editor実行: ライセンス不足。Play Mode、画面、Xbox実機、WQHD/60fps、Windows exe: 未検証／未作成。

## 主人公の新デザイン案

今回の依頼を優先し、従来の白髪・黒い重装備を必須としない。
23歳程度、身長180cm、約7.5頭身、肩と背中に自然な筋肉がある細身の男性。
頬・唇に弱い血色、自然な鼻梁、柔らかな目元、控えめな左右差。顎は鋭くしすぎない。
髪候補Aはダークブラウンの軽いセンターパート、Bはアッシュブラウンのサイドパート、Cは黒の短い流し前髪。
Aを暫定第一候補とし、正面・側面・背面・俯瞰のゲーム内撮影で比較する。比較画像はまだ制作していない。
白い腰丈ジャケット、濃紺のインナー、銀の前腕・肩プロテクター、黒のブーツ。
布の縫製、革の粗さ、金属の反射を分離。長い裾は左右に分け、回避時の脚の貫通を確認する。
剣は細身の直剣。通常は鋼と銀、光スキル時のみ淡い青白色の刃と粒子。
胸LIGHTは顔を白く飛ばさない明るさとし、通常昼光・日陰・氷魔法中の3条件で評価する。

## 技術判断と素材候補

現段階では既存URPを維持。既存VFX・材質・環境を壊さず主人公を検証するため。
HDRPには標準の肌のSSSと髪・目の専用表現があり、最終人物表現の有力候補。
最終判断は同じ主人公のURP/HDRP比較と1440p実測後。未検証の全面移行は行わない。
Unity内で実現可能な機能なので、UE5への全面移行を正当化する実測根拠は現在ない。

候補比較:

| 手段 | 利点 | 現在の制約 |
| --- | --- | --- |
| Character Creator + Unity Auto Setup | 人体・リグ・肌材質の導入経路がある | ソフト・素材の所有と個別ライセンス未確認、購入していない |
| Blenderでベース人体から制作 | 顔・衣装・髪を直接調整できる | 今回の環境ではBlender実行ファイル未発見、人体ベースは完成キャラではない |
| AIによる単体3D生成 | 外観の候補を短時間で比較できる可能性 | トポロジー、髪、手、Humanoidリグ、モーション変形の品質検証が必要。最終モデルは未生成 |
| 復旧したGanzSe | 既存ゲームとの接続検証に使える | 低ポリゴンで今回の最終品質要件に不適合 |
| Mixamo | リギングとモーションの候補 | Adobeログインと個別モーション選択・変形確認が必要。未ダウンロード |

調査した一次資料:

- [Unity 6パイプライン比較](https://docs.unity.com/en-us/engine/6000.0/manual/render-pipelines/choose-a-render-pipeline/pipeline)
- [Reallusion Unity Auto Setup](https://www.reallusion.com/auto-setup/unity/default.html)
- [Reallusion素材ライセンス](https://www.reallusion.com/license/content.html)
- [Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
- [Blender人体ベース配布](https://download.blender.org/demo/asset-bundles/human-base-meshes/)

GanzSeはローカルのみ。ライセンスで認められない元データ・派生モデルを公開Gitへ追加しない。
新規の有料購入、認証変更、公開リリースは行っていない。

## 再開手順

1. このPCでUnity Hubから正規のライセンスを有効化する。
2. 作業コピーのUnityProjectをUnity 6000.5.11f1で開き、パッケージ解決とモデル再生成を確認する。
3. 主人公の高品質モデルを制作／導入。四方向外観、肌・髪、歩行・走行・回避・剣撃変形を評価する。
4. 主人公の品質ゲートを通過してから剣コンボ、ロックオン、ボス・ステージクリアを実装し、既存仕様の移植へ進む。
5. `LIGHT MAZE > Build > Windows Development Build` または `-executeMethod LightMaze.EditorTools.WindowsDevelopmentBuild.Build`。
   標準出力先はUnityProject/Builds/Windows/LightMaze.exe。`LIGHT_MAZE_BUILD_OUTPUT`で変更可能。
6. 出来上がったexeでプレイテスト・1440p性能測定。ビルド成功だけで完成判定しない。

本編1〜7面、深淵のボス/安全階、99F MYTHIC保証、4枠合成、復活交換、死亡ロスト、保存仕様は変更していない。
