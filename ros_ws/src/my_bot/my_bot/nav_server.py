#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from geometry_msgs.msg import PoseStamped

from my_bot.rack_client import RackClient, dock_point_to_pose_stamped

class NavServer(Node):
    def __init__(self):
        super().__init__('shop_assist_nav_server')

        self.rack_client = RackClient()
        self.get_logger().info("Connected to MongoDB -> supermarket_sim.racks")

        self.sub = self.create_subscription(String, '/navigate_to_rack', self.nav_callback, 10)
        self.goal_pub = self.create_publisher(PoseStamped, '/goal_pose', 10)

        self.get_logger().info("NavServer ready. Listening on /navigate_to_rack")

    def nav_callback(self, msg: String):
        rack_id = msg.data.strip()
        self.get_logger().info(f"Received nav request for: {rack_id}")

        dock = self.rack_client.get_dock_point(rack_id)
        if not dock:
            self.get_logger().error(f"Rack {rack_id} not found or has no dock_point")
            return

        goal_msg = dock_point_to_pose_stamped(dock, frame_id="map")
        goal_msg.header.stamp = self.get_clock().now().to_msg()
        self.goal_pub.publish(goal_msg)
        self.get_logger().info(f"Published /goal_pose for {rack_id}")

def main(args=None):
    rclpy.init(args=args)
    node = NavServer()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.rack_client.close()
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()