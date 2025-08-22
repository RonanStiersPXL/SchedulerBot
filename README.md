# Guide to Dockerize

docker login

docker build -t docker_username/schedulerbot .

docker push docker_username/schedulerbot:latest

# On server

sudo mkdir -p /opt/scheduler-bot

# copy your .env to the server

# scp .env user@server:/opt/scheduler-bot/.env

sudo chown root:root /opt/scheduler-bot/.env
sudo chmod 600 /opt/scheduler-bot/.env

docker pull docker_username/schedulerbot:latest

docker run -d \
 --name scheduler-bot \
 --env-file /opt/scheduler-bot/.env \
 --restart unless-stopped \
 docker_username/schedulerbot:latest

# or add a docker compose for easier use

cd /opt/scheduler-bot

services:
bot:
image: docker_username/scheduler-bot:latest
container_name: scheduler-bot
env_file: - .env
restart: unless-stopped

cd /opt/scheduler-bot
docker compose pull
docker compose up -d
