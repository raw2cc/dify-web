#!/bin/bash



# if you are using windows, you may need to convert the file to unix format
# you can use the Ubuntu terminal to convert this file to unix format
# otherwise, you may get the error after running the docker container

# sudo apt-get install dos2unix
# dos2unix entrypoint.sh


set -e

export NEXT_PUBLIC_DEPLOY_ENV=${DEPLOY_ENV}
export NEXT_PUBLIC_PUBLIC_PATH=${NEXT_PUBLIC_PUBLIC_PATH}
export NEXT_PUBLIC_EDITION=${EDITION}
export NEXT_PUBLIC_API_PREFIX=${CONSOLE_API_URL}/ai-portal/proxy/console/api
export NEXT_PUBLIC_PUBLIC_API_PREFIX=${APP_API_URL}/api

export NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN}
export NEXT_PUBLIC_SITE_ABOUT=${SITE_ABOUT}
export NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}

export NEXT_PUBLIC_TEXT_GENERATION_TIMEOUT_MS=${TEXT_GENERATION_TIMEOUT_MS}
export NEXT_PUBLIC_CSP_WHITELIST=${CSP_WHITELIST}
export NEXT_PUBLIC_TOP_K_MAX_VALUE=${TOP_K_MAX_VALUE}
export NEXT_PUBLIC_INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH=${INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH}

export NEXT_PUBLIC_AUTH_WAY=${AUTH_WAY}
export NEXT_PUBLIC_PUBLIC_PATH=${NEXT_PUBLIC_PATH}

# Replace /_next/static with NEXT_PUBLIC_PUBLIC_PATH in all HTML files
find /app -name "*.html" -type f -exec sed -i "s|/_next/static|${NEXT_PUBLIC_PUBLIC_PATH}/_next/static|g" {} \;
find /app -name "*.js" -type f -exec sed -i "s|/_next/static|${NEXT_PUBLIC_PUBLIC_PATH}/_next/static|g" {} \;

pm2 start ./pm2.json --no-daemon
