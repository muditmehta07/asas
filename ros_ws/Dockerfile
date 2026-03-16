FROM ros:humble-ros-base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core
    ros-humble-rclpy \
    ros-humble-std-msgs \
    ros-humble-geometry-msgs \
    # Nav2
    ros-humble-navigation2 \
    ros-humble-nav2-bringup \
    ros-humble-nav2-map-server \
    ros-humble-nav2-lifecycle-manager \
    ros-humble-nav2-msgs \
    # SLAM
    ros-humble-slam-toolbox \
    # Rosbridge
    ros-humble-rosbridge-suite \
    # Web video server
    ros-humble-web-video-server \
    ros-humble-async-web-server-cpp \
    # Gazebo
    ros-humble-gazebo-ros-pkgs \
    # Build tools
    python3-colcon-common-extensions \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace and build
COPY . /ros_ws/
WORKDIR /ros_ws
RUN /bin/bash -c "source /opt/ros/humble/setup.bash && colcon build --symlink-install"

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
