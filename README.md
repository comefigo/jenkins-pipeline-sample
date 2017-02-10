# 概要

　Jenkins2からPipelineが標準採用されたことにより、PipelineコードをJenkinsfileに定義することで今までUIでポチポチして定義していた各種タスクをコードベースで定義できるようになった。このことよりバージョン管理との統合もしやすくなりました。

　下記ではGithub → Jenkins（JSのテスト、ソースのマージ）→ Slackへの一連の流れを簡単なサンプルと共に解説していきたいと思います。Jenkinsでの設定はプラグイン導入とジョブ作成時以外はしません！理想としてはJenkinsインストール後何もせずに使えると一番うれしいですが・・・Dockerで頑張ればいけるものでしょうか

# 環境

　Jenkinsの導入環境はAmazon Linuxになります
　各種コマンドは必要に応じて読み替えてください

# 手順

### 1. Jenkinsの導入
  導入手順は[こちら](http://qiita.com/hitomatagi/items/4bf578b46c525fc01514)をご参照ください

### 2. Jenkinsの各初期設定
  Adminのセキュリティ設定と初期プラグインのインストール等

### 3. プラグインの導入  
 - Build Authorization Token Root（認証なしで外部からビルドをキックする）
 - Slack Notification（Slackにメッセージング）  
 ※上記のプラグインは自力で頑張れば、導入不要になりますので、必要に応じて導入してください

### 4. Jenkinsユーザに切替
  JenkinsのジョブはJenkinsユーザによって実行されるため、  
  Nodejsの導入、ssh keyの生成などをJenkinsユーザで事前に行います
  
    ```
    # rootユーザに切替
    $ > sudo su

    # Jenkinsユーザに切り替え
    $ > su -s /bin/bash - jenkins
    ```

### 5. nvmでnodejsとnpmの導入
  導入方法は[こちら](http://qiita.com/snoguchi/items/e540709a37124afe93f3)をご参照ください

### 6. githubで使うssh keyの生成
   生成方法は[こちら](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)をご参照ください(とりあえずパスフレーズなし)  
   ssh使わずにaccess tokenで接続する場合は生成不要です(下記のconfigの作成も不要)

### 7. ssh configの作成
  GithubにはSSHで接続するため、ssh configを作成します  
  異なる鍵で複数のリポジトリにssh接続する場合はconfigファイルを設定すると便利です  
　（同じホストだけど異なる鍵でアクセスしたい時に用いる）

    ```
    # $JENKINS_HOME/.ssh (デフォルトは/var/lib/jenkins/.ssh)
    # .sshフォルダがない場合は、新規作成してください
    # フォルダとファイルの所有者がjenkinsになっていることを確認しましょう

    $ > cd ~/.ssh/
    $ > vi config
    ```

    ```ssh:config
    Host sample.github.com
      User jenkins
      Hostname github.com
      IdentityFile ~/.ssh/hogehoge_rsa

    Host sample2.github.com
      User jenkins
      Hostname github.com
      IdentityFile ~/.ssh/hogehoge2_rsa
    ```

### 8. Githubのリポジトリのデプロイキーに登録
  前述で生成したssh keyの公開鍵(hogehoge_rsa.pub)をデプロイキーに登録  
  書き込みを許可する場合は、「Allow write acces」にチェックしてください  
  この記事は書き込みを前提にしていますので、**チェック**を入れてください  
  ![2.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/a044530a-531e-b8e5-1d40-24678b41083f.jpeg)

### 9. リモートホストの登録
  Jenkinsのタスク実行時に新規ホスト(Github)と接続する際にホスト追加のyes/no選択でコケるので、あらかじめ手動で接続許可しときます  
  新規ホストの接続許可をすべて許可するやり方もありますが、セキュリティ的に問題なので今回は手動で登録します

    ```
    # configで設定したHost名でssh接続し、新規ホストを追加
    # 問題なく接続できたなら.sshフォルダ配下にknown_hostsファイルが生成されていることを確認してください

    $ > ssh -T git@sample.github.com
    ```

### 10. Jenkinsで新規ジョブの追加
  Pipelineジョブを選択し、作成してください
  ![1.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/5698c275-e361-8e4f-1f9b-bfb8b111ca8f.jpeg) 

### 11. ジョブの設定
  「リモートからビルド」にチェックし、認証トークンは適当なキーワードを設定してださい  
  GithubからWebhook時にこの認証トークンでジョブをキックします  
  ![4.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/a1a6954f-9c28-2473-85f0-42b11c282349.jpeg)
  PipelineのDefinitionで「Pipeline script from SCM」を選択し、SCMは「Git」、Repositorie URLにGithubのリポジトリを追加してください  
  ![3.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/f9cddace-b502-616b-4260-9c70848301af.jpeg)
  URLのホスト名はssh configのHOSTで設定した値にしてください  
  例）

    ```
    # ssh config

    Host sample.github.com
      User jenkins
      Hostname github.com
      IdentityFile ~/.ssh/hogehoge_rsa

    の場合は

    git@github.com:xxxxx/repo-name.git

    ↓

    git@sample.github.com:xxxxx/repo-name.git
    ```
  以下のようなエラーが表示されている場合は、ssh keyの所有権、アクセス権、ホスト名を確認してください  
  ![5.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/1e5f07aa-0525-80fc-efb0-ea2fcd234480.jpeg)

### 12. GithubのWebhookを設定
  hook先のURLには上記の認証トークンとジョブ名を付加します  
  認証トークンを「1234567890」で設定した場合は、jenkins hook urlでは「http(s)://jenkins host name/jenkins/buildByToken/build?ジョブ名&token=1234567890」になります  
  ![6.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/ed06c69a-7adf-2000-7625-96fe32f5c030.jpeg)
  ![7.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/61ddc69a-db02-79ce-5cb3-3e8a215cf0ad.jpeg)
  設定後右上の「Test service」で問題なく疎通することを確認してください  
  なお、AWSのセキュリティグループで送信元を絞っている場合は、GithubのIPを許可してあげてください  
  IP一覧は[こちら](https://api.github.com/meta)を参照ください  

### 13. pipelineコードを含むJenkinsfileをGithubにプッシュ
  Jenkinsfileはリポジトリのルートに配置してください  
  Jenkinsfileの詳細は下記で解説します  

### 14. ビルド終了後はSlackに通知
  ![8.jpg](https://qiita-image-store.s3.amazonaws.com/0/30522/e2a4d781-230d-2ce2-23eb-334f60523771.jpeg)


# Jenkinsfileサンプルコードの解説
コードはJenkinsfileを参照ください  

pipelineでshell実行してあれこれをやるようなサンプルになっています（初心者なのでこのぐらいしかできていません）  
shellの実行結果(returnStatus)で拾って実行の可否を判定しています  
returnStdoutを用いれば実行ログを取得することもできますので、もっと細かい判定などに使えると思います  
各shell実行時にカレントディレクトリがジョブのルートになるため、都度ディレクトリを移動してからコマンドを実行しています

## ステージ

pipelineの各ステージを表す

```
stage("stage 1") {

}

stage("stage 2") {

}
```

## 変数宣言

```
def hogehoge = ""
```

## 関数宣言

```
def hogehogefunction(val1, val2) {
  return true
}
```

## 変数を表示

""内に${変数}

```
def hogehoge
echo "${hogehoge}"

// オブジェクトの場合はエラーになるため、"${hogehoge}"のほうが安全と思われる
echo hogehoge
```

## try ... catch ... finally

```
  try {
    // エラーをthrow
    error "my exception"
  } catch (e) {
    // オブジェクトをテキストとして表示
    echo "${e}"
  } finally {
    // send message email or slack 
  }
```

## スクリプトの実行結果を取得

returnStatus: trueにすることでsellの実行結果を取得することできます  
成功時は0、それ以外は0以外

```
def RESULT = sh (
    script: "do something",
    returnStatus: true
) == 0

if(RESULT) {
  // do something
} else {
  // do something
}
```

## スクリプトの実行ログを取得

returnStdout: trueにすることでshellの実行ログを取得することができます

```
def STDOUT = sh (
    script: "do something",
    returnStdout: true
).trim()

echo "${STDOUT}"
```

## ビルドの成功/失敗

ビルドプロセス内の自作の判定結果に応じてビルドの成否を明示的に設定するときに
currentBuild.resultに値を設定する
resultがFAILUREでもステージの処理は継続します  

```
if(hoge) {
  // 成功時
  currentBuild.result = "SUCCESS"
} else {
  // 失敗時
  currentBuild.result = "FAILURE"
}
```

## 環境変数を有効化

withEnvで一時的に環境変数を有効化することができます

```
withEnv(["PATH+NODE=${JENKINS_HOME}/.nvm/versions/node/v6.9.5/bin/"]) {
  // do something with node
}
```

## ファイルの有無の確認
fileExistsでファイルまたはフォルダの存在を確認できる

```
if(fileExists("hogehoge")) {
  echo "hogehoge exist!!!"
}
```

## Slackで使える文字の装飾

https://api.slack.com/docs/message-formatting


## 各種リファレンス（重要）

これを見るまでは何ができるのか、どういった関数を呼べるのかがわからなかったが、  
この存在を知ってからはリファレンスを見ながらあれこれと試せるようになったので、皆さんも是非活用してみてください  
導入しているプラグインのリファレンスも載っているのでかなり役に立ちます

![1.png](https://qiita-image-store.s3.amazonaws.com/0/30522/c815a4a4-0bbf-20a2-611d-72396dbc84e7.png)

