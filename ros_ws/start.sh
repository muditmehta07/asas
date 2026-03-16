#!/bin/bash
set -e

# Source ROS 2 and the workspace
source /opt/ros/humble/setup.bash
source /ros_ws/install/setup.bash

echo "[ROS] Starting all services..."

# Run all 4 processes concurrently
ros2 launch my_bot nav_launch.py &
ros2 run my_bot nav_server &
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &
ros2 run web_video_server web_video_server &

echo "[ROS] All services launched. Waiting..."

# Keep container alive and exit if any process dies
wait -n
echo "[ROS] A process exited. Shutting down."
