import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient
import math
import threading
import logging
import time

log = logging.getLogger(__name__)

_nav_status = {
    "state": "IDLE", 
    "rack_id": None, 
    "dock_point": None,
    "position": {"x": 0.0, "y": 0.0}
}
_lock = threading.Lock()

class NavBridge:
    def __init__(self):
        self.node = None
        self.pub = None
        self.action_client = None
        self._goal_handle = None
        self.thread = None
        self._running = False

    def init_ros(self):
        if not rclpy.ok():
            rclpy.init()
        
        self.node = Node("shop_assist_nav_client")
        self.pub = self.node.create_publisher(PoseStamped, "/goal_pose", 10)
        self.action_client = ActionClient(self.node, NavigateToPose, 'navigate_to_pose')

        self.sub = self.node.create_subscription(
            PoseWithCovarianceStamped,
            "/amcl_pose",
            self._pose_callback,
            10
        )
        
        self._running = True
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()
        
        log.info("ROS 2 NavBridge initialized with AMCL subscription.")

    def _pose_callback(self, msg):
        with _lock:
            _nav_status["position"]["x"] = msg.pose.pose.position.x
            _nav_status["position"]["y"] = msg.pose.pose.position.y

    def _spin(self):
        while rclpy.ok() and self._running:
            rclpy.spin_once(self.node, timeout_sec=0.1)

    def shutdown_ros(self):
        self._running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        if self.node:
            self.node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()
        log.info("ROS 2 NavBridge shut down.")

    def set_status(self, state: str, rack_id: str = None, dock: dict = None):
        with _lock:
            _nav_status["state"] = state
            _nav_status["rack_id"] = rack_id
            _nav_status["dock_point"] = dock

    def get_status(self) -> dict:
        with _lock:
            return dict(_nav_status)

    def publish_goal(self, dock: dict, rack_id: str):
        try:
            if not self.node:
                log.error("NavBridge not initialized. Call init_ros() first.")
                self.set_status("ERROR", rack_id, dock)
                return

            # Wait for action server
            if not self.action_client.wait_for_server(timeout_sec=5.0):
                log.error("NavigateToPose action server not available.")
                self.set_status("ERROR", rack_id, dock)
                return

            goal_msg = NavigateToPose.Goal()
            goal_msg.pose.header.frame_id = "map"
            goal_msg.pose.header.stamp = self.node.get_clock().now().to_msg()
            goal_msg.pose.pose.position.x = float(dock["x"])
            goal_msg.pose.pose.position.y = float(dock["y"])
            goal_msg.pose.pose.position.z = float(dock.get("z", 0.0))

            yaw = float(dock.get("yaw", 0.0))
            cy = math.cos(yaw * 0.5)
            sy = math.sin(yaw * 0.5)
            goal_msg.pose.pose.orientation.w = cy
            goal_msg.pose.pose.orientation.z = sy

            log.info(f"Sending action goal for {rack_id}...")
            send_goal_future = self.action_client.send_goal_async(goal_msg)
            send_goal_future.add_done_callback(self._goal_response_callback)

            self.set_status("NAVIGATING", rack_id, dock)

        except Exception as e:
            log.error(f"Nav bridge goal error: {e}")
            self.set_status("ERROR", rack_id, dock)

    def _goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            log.info("Goal rejected")
            self.set_status("IDLE")
            return

        log.info("Goal accepted")
        with _lock:
            self._goal_handle = goal_handle

    def stop(self):
        """Cancel the current navigation goal."""
        log.info("Stopping navigation...")
        if self._goal_handle:
            try:
                self._goal_handle.cancel_goal_async()
                log.info("Cancel request sent.")
            except Exception as e:
                log.error(f"Error canceling goal: {e}")
        
        self.set_status("IDLE")
        with _lock:
            self._goal_handle = None

bridge = NavBridge()

def init():
    bridge.init_ros()

def shutdown():
    bridge.shutdown_ros()

def get_status() -> dict:
    return bridge.get_status()

def stop_navigation():
    bridge.stop()
    return {"success": True, "message": "Navigation stop command sent."}

def navigate_to_dock(rack_id: str, dock_point: dict) -> dict:
    if not dock_point:
        return {"success": False, "error": "No dock point available for this rack."}

    bridge.set_status("SENDING", rack_id, dock_point)
    t = threading.Thread(target=bridge.publish_goal, args=(dock_point, rack_id), daemon=True)
    t.start()

    return {
        "success": True,
        "rack_id": rack_id,
        "dock_point": dock_point,
        "message": f"Goal sent to {rack_id}.",
    }
