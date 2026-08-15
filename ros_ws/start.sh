#!/bin/bash
set -e

# Source ROS 2 and workspace
source /opt/ros/humble/setup.bash
source /ros_ws/install/setup.bash

# Trap SIGTERM and SIGINT for clean container shutdown
cleanup() {
    echo "[ROS] Shutting down all background processes..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

echo "[ROS] Starting all services..."

# Display check for GUI vs Headless execution
if [ -n "$DISPLAY" ] && xdpyinfo >/dev/null 2>&1; then
    echo "[ROS] Display found - launching with Gazebo and RViz2..."
    ros2 launch my_bot nav_launch.py &
else
    echo "[ROS] No display found - launching headless (no Gazebo/RViz2)..."
    ros2 launch my_bot nav_launch.py headless:=true &
fi

ros2 run my_bot nav_server &
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &
ros2 run web_video_server web_video_server &

# Start FastAPI backend
echo "[ROS] Starting FastAPI backend..."
cd /backend && uvicorn main:app --host 0.0.0.0 --port 8000 &

# Background publisher with topic availability check instead of fixed sleep
(
    echo "[ROS] Waiting for /amcl_pose publisher or /initialpose subscriber..."
    # Wait until the /initialpose topic exists in the ROS graph
    until ros2 topic list 2>/dev/null | grep -q '/initialpose'; do
        sleep 2
    done
    
    sleep 3  # Short grace period for node subscription
    echo "[ROS] Publishing initial pose..."
    python3 - << 'PYEOF'
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseWithCovarianceStamped

rclpy.init()
node = Node('initial_pose_publisher')
pub = node.create_publisher(PoseWithCovarianceStamped, '/initialpose', 10)

import time
time.sleep(1)

msg = PoseWithCovarianceStamped()
msg.header.frame_id = 'map'
msg.header.stamp = node.get_clock().now().to_msg()
msg.pose.pose.position.x = 0.0
msg.pose.pose.position.y = 0.0
msg.pose.pose.orientation.w = 1.0
msg.pose.covariance[0] = 0.25
msg.pose.covariance[7] = 0.25
msg.pose.covariance[35] = 0.06853

for _ in range(5):
    pub.publish(msg)
    time.sleep(0.5)

node.destroy_node()
rclpy.shutdown()
print('[ROS] Initial pose published successfully.')
PYEOF
) &

echo "[ROS] All services launched. Waiting..."
wait -n