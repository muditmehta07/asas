import os
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, RegisterEventHandler, DeclareLaunchArgument, OpaqueFunction
from launch.event_handlers import OnProcessExit
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory


def generate_launch_description():
    package_name = 'my_bot'
    pkg_share = get_package_share_directory(package_name)
    nav2_bringup_dir = get_package_share_directory('nav2_bringup')
    nav2_params_file = os.path.join(pkg_share, 'config', 'nav2_params.yaml')

    headless_arg = DeclareLaunchArgument(
        'headless',
        default_value='false',
        description='Run without Gazebo and RViz2 (no display required)'
    )

    headless = LaunchConfiguration('headless')

    rsp = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_share, 'launch', 'rsp.launch.py')
        ),
        launch_arguments={'use_sim_time': 'true'}.items()
    )

    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(
                get_package_share_directory('gazebo_ros'),
                'launch',
                'gazebo.launch.py'
            )
        ),
        launch_arguments={
            'world': os.path.join(pkg_share, 'worlds', 'obstacle.world')
        }.items()
    )

    spawn_entity = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=['-topic', 'robot_description', '-entity', 'my_bot'],
        output='screen'
    )

    nav2 = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(nav2_bringup_dir, 'launch', 'bringup_launch.py')
        ),
        launch_arguments={
            'use_sim_time': 'true',
            'map': '/home/mudit/major-project/map/my_map.yaml',
            'params_file': nav2_params_file,
        }.items()
    )

    nav_server = Node(
        package='my_bot',
        executable='nav_server',
        name='shop_assist_nav_server',
        output='screen'
    )

    rviz_config = os.path.join(
        nav2_bringup_dir,
        'rviz',
        'nav2_default_view.rviz'
    )

    rviz = Node(
        package='rviz2',
        executable='rviz2',
        arguments=['-d', rviz_config],
        parameters=[{'use_sim_time': True}],
        output='screen'
    )

    def launch_setup(context):
        is_headless = context.launch_configurations.get('headless', 'false').lower() == 'true'

        if is_headless:
            # Headless: no Gazebo, no RViz2, no simulation time
            # Run Nav2 and nav_server directly
            nav2_headless = IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(nav2_bringup_dir, 'launch', 'bringup_launch.py')
                ),
                launch_arguments={
                    'use_sim_time': 'false',
                    'map': '/home/mudit/major-project/map/my_map.yaml',
                    'params_file': nav2_params_file,
                }.items()
            )
            nav_server_headless = Node(
                package='my_bot',
                executable='nav_server',
                name='shop_assist_nav_server',
                output='screen'
            )
            return [nav2_headless, nav_server_headless]
        else:
            nav2_after_spawn = RegisterEventHandler(
                OnProcessExit(
                    target_action=spawn_entity,
                    on_exit=[nav2, nav_server, rviz],
                )
            )
            return [gazebo, spawn_entity, nav2_after_spawn]

    return LaunchDescription([
        headless_arg,
        rsp,
        OpaqueFunction(function=launch_setup)
    ])
