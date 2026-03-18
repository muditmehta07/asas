FROM ros:humble-ros-base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ros-humble-rclpy \
    ros-humble-std-msgs \
    ros-humble-geometry-msgs \
    ros-humble-navigation2 \
    ros-humble-nav2-bringup \
    ros-humble-nav2-map-server \
    ros-humble-nav2-lifecycle-manager \
    ros-humble-nav2-msgs \
    ros-humble-slam-toolbox \
    ros-humble-rosbridge-suite \
    ros-humble-web-video-server \
    ros-humble-async-web-server-cpp \
    ros-humble-gazebo-ros-pkgs \
    ros-humble-xacro \
    ros-humble-rviz2 \
    python3-colcon-common-extensions \
    python3-pip \
    x11-utils \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir pymongo python-dotenv

COPY backend/requirements.txt /tmp/backend_requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/backend_requirements.txt

COPY backend/main.py backend/nav_bridge.py backend/search_chain.py /backend/

COPY ros_ws/ /ros_ws/
WORKDIR /ros_ws
RUN /bin/bash -c "source /opt/ros/humble/setup.bash && colcon build --symlink-install"

COPY ros_ws/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
