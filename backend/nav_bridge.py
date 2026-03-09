import os
import sys
import math
import threading
import logging

log = logging.getLogger(__name__)

_nav_status = {"state": "IDLE", "rack_id": None, "dock_point": None}
_lock = threading.Lock()


def get_status() -> dict:
    with _lock:
        return dict(_nav_status)


def _set_status(state: str, rack_id: str = None, dock: dict = None):
    with _lock:
        _nav_status["state"] = state
        _nav_status["rack_id"] = rack_id
        _nav_status["dock_point"] = dock


def _publish_goal(dock: dict, rack_id: str):
    """Publish PoseStamped to /goal_pose in a background thread."""
    try:
        import rclpy
        from rclpy.node import Node
        from geometry_msgs.msg import PoseStamped

        rclpy.init(args=None)
        node = Node("shop_assist_nav_client")
        pub  = node.create_publisher(PoseStamped, "/goal_pose", 10)

        msg = PoseStamped()
        msg.header.frame_id = "map"
        msg.header.stamp    = node.get_clock().now().to_msg()

        msg.pose.position.x = float(dock["x"])
        msg.pose.position.y = float(dock["y"])
        msg.pose.position.z = float(dock.get("z", 0.0))

        yaw = float(dock.get("yaw", 0.0))
        cy  = math.cos(yaw * 0.5)
        sy  = math.sin(yaw * 0.5)
        msg.pose.orientation.w = cy
        msg.pose.orientation.x = 0.0
        msg.pose.orientation.y = 0.0
        msg.pose.orientation.z = sy

        import time
        for _ in range(5):
            pub.publish(msg)
            time.sleep(0.1)

        _set_status("NAVIGATING", rack_id, dock)
        log.info(f"Published goal_pose for {rack_id}: x={dock['x']}, y={dock['y']}")

        node.destroy_node()
        rclpy.shutdown()

    except Exception as e:
        log.error(f"Nav bridge error: {e}")
        _set_status("ERROR", rack_id, dock)


def navigate_to_dock(rack_id: str, dock_point: dict) -> dict:
    """
    Non-blocking: fires off a background thread to publish the ROS2 goal.

    Returns immediately with status dict.
    """
    if not dock_point:
        return {"success": False, "error": "No dock point available for this rack."}

    _set_status("SENDING", rack_id, dock_point)
    t = threading.Thread(target=_publish_goal, args=(dock_point, rack_id), daemon=True)
    t.start()

    return {
        "success":    True,
        "rack_id":    rack_id,
        "dock_point": dock_point,
        "message":    f"Navigation goal sent to {rack_id}. Robot is on its way.",
    }
