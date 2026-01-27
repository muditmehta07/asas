# Robot Dashboard Setup

This dashboard connects to your ROS 2 robot using `rosbridge` and `web_video_server`.

## 1. Prerequisites
You need to install the web connectivity packages for ROS 2:

```bash
sudo apt update
sudo apt install ros-humble-rosbridge-suite ros-humble-web-video-server
```

## 2. Running everything

You will need **4 terminals** to run the full stack.

### Terminal 1: Simulation / Robot
Launch your robot (Gazebo simulation or real robot).
```bash
cd ~/major-project/ros_ws
source install/setup.bash
# Determine your launch file, for example:
ros2 launch my_bot launch_sim.launch.py
```

### Terminal 2: ROS Bridge
This allows the webpage to talk to ROS.
```bash
source /opt/ros/humble/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

### Terminal 3: Web Video Server
This streams the camera topics to the web.
```bash
source /opt/ros/humble/setup.bash
ros2 run web_video_server web_video_server
```

### Terminal 4: Web Dashboard
Start the React application.
```bash
cd ~/major-project/ros-ui-react
npm run dev
```

## Troubleshooting
- **No Camera Feed?** 
  - Check if the topic `/camera/image_raw` exists using `ros2 topic list`.
  - If your camera topic is different, update `src/App.jsx` with the correct topic name.
- **ROS Disconnected?**
  - Ensure `rosbridge_server` is running on port 9090.
  - Check the browser console (F12) for WebSocket errors.
