// Jenkins pipeline for frontend (Node + npm)
pipeline {
  agent { docker { image 'node:18-bullseye' args '-u root:root' } }
  options {
    timestamps()
    ansiColor('xterm')
    buildDiscarder(logRotator(daysToKeepStr: '14', numToKeepStr: '50'))
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install') {
      steps {
        dir('frontend') { sh 'npm ci' }
      }
    }
    stage('Lint & Test') {
      steps {
        dir('frontend') {
          sh 'npm run lint || true'
          sh 'npm test --silent || true'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'frontend/coverage/**/*.xml'
        }
      }
    }
    stage('Security Scan') {
      steps {
        dir('frontend') {
          echo 'Running npm audit (non-fatal)'
          sh 'npm audit --audit-level=moderate || true'
          // optional: run snyk if SNYK_TOKEN provided and snyk installed
          script {
            if (env.SNYK_TOKEN) {
              sh 'npm i -g snyk || true'
              withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
                sh 'snyk auth ${SNYK_TOKEN} || true'
                sh 'snyk test || true'
              }
            }
          }
        }
      }
    }
    stage('Build') {
      steps { dir('frontend') { sh 'npm run build' } }
    }
    stage('Archive') {
      steps { archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true }
    }
  }
  post {
    success {
      script {
        echo 'Frontend build succeeded'
        if (env.SLACK_WEBHOOK) {
          sh "curl -s -X POST -H 'Content-type: application/json' --data '{\"text\":\"[CI] Frontend build SUCCESS: ${env.JOB_NAME}#${env.BUILD_NUMBER} (${env.BRANCH_NAME ?: env.GIT_BRANCH})\"}' ${env.SLACK_WEBHOOK} || true"
        }
        if (env.MAIL_RECIPIENTS) {
          mail to: env.MAIL_RECIPIENTS, subject: "[CI] Frontend build SUCCESS: ${env.JOB_NAME}", body: "Build ${env.BUILD_URL} finished successfully."
        }
      }
    }
    failure {
      script {
        echo 'Frontend build failed'
        if (env.SLACK_WEBHOOK) {
          sh "curl -s -X POST -H 'Content-type: application/json' --data '{\"text\":\"[CI] Frontend build FAILED: ${env.JOB_NAME}#${env.BUILD_NUMBER} (${env.BRANCH_NAME ?: env.GIT_BRANCH})\"}' ${env.SLACK_WEBHOOK} || true"
        }
        if (env.MAIL_RECIPIENTS) {
          mail to: env.MAIL_RECIPIENTS, subject: "[CI] Frontend build FAILED: ${env.JOB_NAME}", body: "Build ${env.BUILD_URL} failed. Check console for details."
        }
      }
    }
    always {
      cleanWs()
    }
  }
}
