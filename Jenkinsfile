#!groovy

def err_msg = ""
def repo_name = "jenkins-pipeline-sample"
def git_url = "git@sample.github.com:comefigo/${repo_name}.git"
def dev_branch = "dev"
def release_branch = "master"

node {
    try {
        // ソースの取得
        stage("get resource") {
            // カレントディレクトにgitリポジトリが存在するか否かの確認
            if(fileExists("./${repo_name}") && fileExists("./${repo_name}/.git")) {
                // フェッチ
                def FETCH_RESULT = sh(script: "cd ./${repo_name} && git fetch --all", returnStatus: true) == 0
                if(!FETCH_RESULT) {
                    // throw error
                    error "fetchに失敗しました"
                }
                // gitがある場合はpull
                def PULL_RESULT = sh(script: "cd ./${repo_name} && git pull --all", returnStatus: true) == 0
                if(!PULL_RESULT) {
                    error "pullに失敗しました"
                }
                // ブランチの切替
                def CHECKOUT_RESULT = sh(script: "cd ./${repo_name} && git checkout ${dev_branch}", returnStatus: true) == 0
                if(!CHECKOUT_RESULT) {
                    // throw error
                    error "checkoutに失敗しました"
                }
            } else {
                // gitがない場合はclone
                def CLONE_RESULT = sh(script: "git clone ${git_url} ${repo_name}", returnStatus: true) == 0
                if(!CLONE_RESULT) {
                    error "cloneに失敗しました"
                }
            }
        }
        
        // npmライブラリのインストール
        stage("install libs") {
            withEnv(["PATH+NODE=${JENKINS_HOME}/.nvm/versions/node/v6.9.5/bin/"]) {
                def NPM_RESULT = sh(script: "cd ./${repo_name} && npm install", returnStatus: true) == 0
                if(!NPM_RESULT) {
                    error "npm installに失敗しました"
                }
            }
        }
        
        // コードのテスト
        stage("testing code") {
            withEnv(["PATH+NODE=${JENKINS_HOME}/.nvm/versions/node/v6.9.5/bin/"]) {
                def TEST_RESULT = sh(script: "cd ./${repo_name} && npm test", returnStatus: true) == 0
                if(!TEST_RESULT) {
                    error "testに失敗しました"
                }
            }
        }

        // コードマージ
        stage("merge code") {
            // ブランチの切替
            def CHECKOUT_RESULT = sh(script: "cd ./${repo_name} && git checkout ${release_branch}", returnStatus: true) == 0
            if(!CHECKOUT_RESULT) {
                error "checkoutに失敗しました"
            }

            // マージ
            def MERGE_RESULT = sh(script: "cd ./${repo_name} && git merge ${dev_branch}", returnStatus: true) == 0
            if(!MERGE_RESULT) {
                error "マージに失敗しました"
            }

            // リモートへプッシュ
            def PUSH_RESULT = sh(script: "cd ./${repo_name} && git push origin ${release_branch}:${release_branch}", returnStatus: true) == 0
            if(!PUSH_RESULT) {
                error "プッシュに失敗しました"
            }
        }

    } catch (err) {
        err_msg = "${err}"
        currentBuild.result = "FAILURE"
    } finally {
        if(currentBuild.result != "FAILURE") {
            currentBuild.result = "SUCCESS"
        }
        notigication(err_msg)
    }
}

// 実行結果のSlack通知
def notigication(msg) {
    def slack_channel = "#jenkins"
    def slack_domain = ""
    def slack_token = ""
    def slack_color = "good"
    def slack_icon = ""
    def detail_link = "(<${env.BUILD_URL}|Open>)"
    // ビルドエラー時にメッセージの装飾を行う
    if(currentBuild.result == "FAILURE") {
        slack_color = "danger"
    }
    def slack_msg = "job ${env.JOB_NAME}[No.${env.BUILD_NUMBER}] was builded ${currentBuild.result}. ${detail_link} \n\n ${msg}"
    slackSend channel: "${slack_channel}", color: "${slack_color}", message: "${slack_msg}", teamDomain: "${slack_domain}", token: "${slack_token}"
}