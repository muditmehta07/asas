FROM ros:humble-ros-base

ENV DEBIAN_FRONTEND=noninteractive

# Install uv from official binary image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Use BuildKit cache mounts for apt archives and lists
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
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
    libgl1-mesa-dri \
    libgl1-mesa-glx \
    libglib2.0-0 \
    mesa-utils

COPY backend/requirements.txt /tmp/backend_requirements.txt
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache-dir -r /tmp/backend_requirements.txt pymongo python-dotenv

COPY backend/main.py backend/nav_bridge.py backend/search_chain.py /backend/
COPY ros_ws/ /ros_ws/

WORKDIR /ros_ws
SHELL ["/bin/bash", "-c"]
RUN source /opt/ros/humble/setup.bash && colcon build --symlink-install

COPY ros_ws/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]