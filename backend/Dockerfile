# ─────────────────────────────────────────────────────────────
# Base: ROS 2 Humble (Ubuntu 22.04) — provides rclpy & nav2_msgs
# ─────────────────────────────────────────────────────────────
FROM ros:humble-ros-base

# Avoid interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# ── System deps ───────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip \
    python3-dev \
    # ROS 2 Nav2 messages & action interfaces
    ros-humble-nav2-msgs \
    ros-humble-nav2-common \
    ros-humble-action-msgs \
    ros-humble-geometry-msgs \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────
WORKDIR /app

# ── Python deps (installed before copying source for layer cache)
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# ── App source ────────────────────────────────────────────────
COPY main.py nav_bridge.py search_chain.py ./

# ── Entrypoint ────────────────────────────────────────────────
# Source the ROS 2 setup so rclpy is on the Python path, then start uvicorn.
# Note: --reload is great for dev but remove it for production.
CMD ["/bin/bash", "-c", \
     "source /opt/ros/humble/setup.bash && \
      uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
