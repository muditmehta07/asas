import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, TimerAction
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory


def generate_launch_description():
    package_name = 'my_bot'
    pkg_share = get_package_share_directory(package_name)

    use_sim_time = LaunchConfiguration('use_sim_time')
    world        = LaunchConfiguration('world')
    launch_rviz  = LaunchConfiguration('launch_rviz')

    declare_use_sim_time = DeclareLaunchArgument(
        'use_sim_time',
        default_value='true',
        description='Use Gazebo simulation clock'
    )
    declare_world = DeclareLaunchArgument(
        'world',
        default_value=os.path.join(pkg_share, 'worlds', 'obstacle.world'),
        description='Full path to Gazebo world file'
    )
    declare_launch_rviz = DeclareLaunchArgument(
        'launch_rviz',
        default_value='true',
        description='Whether to launch RViz2'
    )

    rsp = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_share, 'launch', 'rsp.launch.py')
        ),
        launch_arguments={'use_sim_time': use_sim_time}.items()
    )

    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(get_package_share_directory('gazebo_ros'), 'launch', 'gazebo.launch.py')
        ),
        launch_arguments={'world': world}.items()
    )

    spawn_entity = TimerAction(
        period=5.0,
        actions=[
            Node(
                package='gazebo_ros',
                executable='spawn_entity.py',
                arguments=['-topic', 'robot_description', '-entity', 'my_bot'],
                output='screen'
            )
        ]
    )

    slam_params_file = os.path.join(pkg_share, 'config', 'mapper_params_online_async.yaml')

    slam_toolbox = TimerAction(
        period=8.0,   
        actions=[
            Node(
                package='slam_toolbox',
                executable='async_slam_toolbox_node',
                name='slam_toolbox',
                output='screen',
                parameters=[
                    slam_params_file,
                    {'use_sim_time': use_sim_time}
                ]
            )
        ]
    )

    rviz_config = os.path.join(pkg_share, 'config', 'slam_rviz.rviz')

    rviz = TimerAction(
        period=9.0,
        actions=[
            Node(
                package='rviz2',
                executable='rviz2',
                name='rviz2',
                arguments=['-d', rviz_config],
                parameters=[{'use_sim_time': use_sim_time}],
                output='screen',
                condition=IfCondition(launch_rviz)
            )
        ]
    )

    map_file = os.path.join('/home/mudit/major-project/map/', 'my_map.yaml')

    map_server = TimerAction(
        period=7.0,
        actions=[
            Node(
                package='nav2_map_server',
                executable='map_server',
                name='map_server',
                output='screen',
                parameters=[{'use_sim_time': use_sim_time}, 
                            {'yaml_filename': map_file}]
            )
        ]
    )

    lifecycle_manager = TimerAction(
        period=7.5,
        actions=[
            Node(
                package='nav2_lifecycle_manager',
                executable='lifecycle_manager',
                name='lifecycle_manager_map_server',
                output='screen',
                parameters=[
                    {'use_sim_time': use_sim_time},
                    {'autostart': True},
                    {'node_names': ['map_server']}
                ]
            )
        ]
    )

    return LaunchDescription([
        declare_use_sim_time,
        declare_world,
        declare_launch_rviz,
        rsp,
        gazebo,
        spawn_entity,
        map_server,
        lifecycle_manager,
        slam_toolbox,
        rviz,
    ])
