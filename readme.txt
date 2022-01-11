docker build . -t daryl/robot-api

docker save -o target/robotapi.tar daryl/robot-api

#!/bin/sh
docker load --input robotapi.tar

docker run -d \
-v /home/devappser/App/RobotAPI/certs:/src/certs \
-v /home/devappser/App/RobotAPI/.env:/src/.env \
-p 5001:5001 \
daryl/robot-api