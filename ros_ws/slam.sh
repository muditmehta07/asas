#!/bin/bash
source install/setup.bash
ros2 launch slam_toolbox localization_launch.py map_file:=/home/mudit/major-project/ros_ws/my_map.yaml params_file:=/home/mudit/major-project/ros_ws/slam_localization.yaml use_sim_time:=true base_frame:=base_link odom_frame:=odom
