#!/usr/bin/env bash

create_env_file() {
    touch .env
    echo "NEXTAUTH_URL=${NEXTAUTH_URL}" >> .env
    echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" >> .env
    echo "NEXT_PUBLIC_ELD_API_URL=${NEXT_PUBLIC_ELD_API_URL}" >> .env
}
main(){
    create_env_file
}
main