docker build . -t robot-api

docker save -o target/robotapi.tar robot-api
docker save robot-api | gzip > target/robot-api.tar.gz

#!/bin/sh
docker load --input robotapi.tar

docker run -d \
-v /home/devappser/App/RobotAPI/certs:/src/certs \
-v /home/devappser/App/RobotAPI/.env:/src/.env \
-p 5001:5001 \
daryl/robot-api