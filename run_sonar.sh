#!/bin/bash
docker run \
  --rm \
  --network moltbot_sonarnet \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.projectKey=molt \
  -Dsonar.host.url=http://sonarqube:9000 \
  -Dsonar.token=sqp_7730fc4afe7618c2919c3f691eedb6479ed5b292
