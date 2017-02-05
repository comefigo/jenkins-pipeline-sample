#!groovy

def err_msg = ""

node {
    try {

    } catch (err) {
        err_msg = "${err}"
        currentBuild.result = "FAILURE"
    } finaly {
        if(currentBuild.result != "FAILURE") {
            currentBuild.result = "SUCCESS"
        }
        notigication(err_msg)
    }
}

// 実行結果のSlack通知
def notigication(msg) {
    def slack_channel = "#jenkins"
    def slack_domain = "your-slack-domain"
    def slack_token = "your-slack-jenkins-token"
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