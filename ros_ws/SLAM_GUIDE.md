# SLAM Implementation Guide

## Overview
This project now includes SLAM (Simultaneous Localization and Mapping) using **slam_toolbox**, which allows your robot to build a map of its environment while simultaneously tracking its position.

## What's Been Added

### 1. Configuration Files
- **`config/mapper_params_online_async.yaml`**: SLAM Toolbox configuration optimized for your robot's lidar sensor (12m range, 360° coverage)

### 2. Launch Files
- **`launch/online_async_launch.py`**: Launch file to start SLAM Toolbox

### 3. Convenience Scripts
- **`slam.sh`**: Quick script to launch SLAM
- **`rviz_slam.sh`**: Launch RViz2 with SLAM visualization

### 4. RViz Configuration
- **`.rviz2/slam_config.rviz`**: Pre-configured RViz2 setup showing:
  - Real-time map building
  - Laser scan data
  - Robot model
  - TF frames
  - SLAM pose graph

## How to Use SLAM

### Step 1: Launch the Simulation
In terminal 1:
```bash
cd /home/mudit/major-project/ros_ws
./launch.sh
```

### Step 2: Start SLAM
In terminal 2:
```bash
cd /home/mudit/major-project/ros_ws
./slam.sh
```

### Step 3: Visualize with RViz2
In terminal 3:
```bash
cd /home/mudit/major-project/ros_ws
./rviz_slam.sh
```

### Step 4: Move the Robot
In terminal 4:
```bash
cd /home/mudit/major-project/ros_ws
./keyboard_teleop.sh
```

Drive your robot around using keyboard controls. As you move, you'll see the map being built in real-time in RViz2!

## Important Topics

SLAM Toolbox publishes several useful topics:

- **`/map`**: The occupancy grid map being built
- **`/map_metadata`**: Information about the map (resolution, size, etc.)
- **`/slam_toolbox/graph_visualization`**: The pose graph showing robot trajectory
- **`/slam_toolbox/scan_visualization`**: Visualization of laser scans used for mapping

## Saving Your Map

Once you've explored the environment and built a good map, you can save it:

```bash
ros2 run nav2_map_server map_saver_cli -f my_map
```

This will create two files:
- `my_map.pgm`: The map image
- `my_map.yaml`: Map metadata

## Loading a Saved Map

To use a previously saved map for localization (instead of mapping):

1. Edit `config/mapper_params_online_async.yaml`
2. Change `mode: mapping` to `mode: localization`
3. Uncomment and set `map_file_name: /path/to/my_map` (without extension)
4. Rebuild: `colcon build --packages-select my_bot --symlink-install`

## Troubleshooting

### SLAM not working?
- Ensure your simulation is running (`./launch.sh`)
- Check that `/scan` topic is publishing: `ros2 topic echo /scan`
- Verify TF frames: `ros2 run tf2_tools view_frames`

### Map quality is poor?
- Drive slower to give SLAM more time to process
- Ensure good lidar visibility (avoid obstacles blocking the sensor)
- Try adjusting parameters in `mapper_params_online_async.yaml`

### Robot position drifts?
- This is normal for SLAM without loop closure
- Drive in loops to allow loop closure detection
- Increase `do_loop_closing` reliability in config

## Next Steps

Consider implementing:
1. **Navigation**: Use Nav2 stack for autonomous navigation with your SLAM map
2. **Path Planning**: Add waypoint following
3. **Multi-floor mapping**: Save different maps for different environments
4. **Localization**: Switch to localization mode once you have a good map

## Configuration Details

Key parameters in `mapper_params_online_async.yaml`:

- **`resolution: 0.05`**: Map cell size (5cm)
- **`max_laser_range: 12.0`**: Maximum range for mapping (matches your lidar)
- **`do_loop_closure: true`**: Enables loop closure for drift correction
- **`map_update_interval: 5.0`**: How often to publish the map (seconds)

Feel free to tune these parameters based on your specific needs!
