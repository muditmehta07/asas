#!/bin/bash
set -e

# Make ~/major-project resolve correctly inside the container
ln -sf /home/mudit/major-project /root/major-project

# Source ROS 2 and the workspace
source /opt/ros/humble/setup.bash
source /ros_ws/install/setup.bash

echo "[ROS] Starting all services..."

ros2 launch my_bot nav_launch.py &
ros2 run my_bot nav_server &
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &
ros2 run web_video_server web_video_server &

echo "[ROS] All services launched. Waiting..."

wait -n
echo "[ROS] A process exited. Shutting down."
