from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship, synonym
from database import Base

# 多对多关系的关联表
vip_datacenter_association = Table(
    'lvs_vip_datacenter', Base.metadata,
    Column('vip_id', Integer, ForeignKey('lvs_vip.id')),
    Column('datacenter_id', Integer, ForeignKey('lvs_datacenter.id'))
)

server_vip_association = Table(
    'lvs_servers_vip', Base.metadata,
    Column('server_id', Integer, ForeignKey('lvs_servers.id')),
    Column('vip_id', Integer, ForeignKey('lvs_vip.id'))
)

# --- 动态权限与访问架构关联表 ---
user_roles_association = Table(
    'rbac_user_roles', Base.metadata,
    Column('user_id', Integer, ForeignKey('rbac_users.id', ondelete="CASCADE")),
    Column('role_id', Integer, ForeignKey('rbac_roles.id', ondelete="CASCADE"))
)

user_groups_association = Table(
    'rbac_user_groups', Base.metadata,
    Column('user_id', Integer, ForeignKey('rbac_users.id', ondelete="CASCADE")),
    Column('group_id', Integer, ForeignKey('rbac_groups.id', ondelete="CASCADE"))
)

group_roles_association = Table(
    'rbac_group_roles', Base.metadata,
    Column('group_id', Integer, ForeignKey('rbac_groups.id', ondelete="CASCADE")),
    Column('role_id', Integer, ForeignKey('rbac_roles.id', ondelete="CASCADE"))
)

role_permissions_association = Table(
    'rbac_role_permissions', Base.metadata,
    Column('role_id', Integer, ForeignKey('rbac_roles.id', ondelete="CASCADE")),
    Column('permission_id', Integer, ForeignKey('rbac_permissions.id', ondelete="CASCADE"))
)

# --- 访问控制架构模型 ---

class RBACPermission(Base):
    __tablename__ = "rbac_permissions"
    id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String(100), unique=True, index=True, nullable=False) # e.g. "lvs:write"
    description = Column(String(255))
    
    roles = relationship("RBACRole", secondary=role_permissions_association, back_populates="permissions")

class RBACRole(Base):
    __tablename__ = "rbac_roles"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "super_admin"
    name = Column(String(100), nullable=False) # e.g. "超级管理员"
    description = Column(String(255))
    
    permissions = relationship("RBACPermission", secondary=role_permissions_association, back_populates="roles")
    groups = relationship("RBACGroup", secondary=group_roles_association, back_populates="roles")
    users = relationship("RBACUser", secondary=user_roles_association, back_populates="roles")

class RBACGroup(Base):
    __tablename__ = "rbac_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255))
    
    roles = relationship("RBACRole", secondary=group_roles_association, back_populates="groups")
    users = relationship("RBACUser", secondary=user_groups_association, back_populates="groups")

class RBACUser(Base):
    """访问者/用户验证账户基座"""
    __tablename__ = "rbac_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="VIEWER", nullable=False) # Legacy Field
    
    groups = relationship("RBACGroup", secondary=user_groups_association, back_populates="users")
    roles = relationship("RBACRole", secondary=user_roles_association, back_populates="users")

# --- 基础设施层级模型 ---
class InfraDatacenter(Base):
    """最外层：数据中心 / 园区"""
    __tablename__ = "infra_datacenter"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)
    code = Column(String(20), unique=True, index=True) # e.g. CN-BJ1
    rooms = relationship("InfraRoom", back_populates="datacenter", cascade="all, delete-orphan")

class InfraRoom(Base):
    """中层：机房"""
    __tablename__ = "infra_room"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    code = Column(String(20), index=True) # e.g. R02
    datacenter_id = Column(Integer, ForeignKey('infra_datacenter.id'))
    datacenter = relationship("InfraDatacenter", back_populates="rooms")
    cabinets = relationship("InfraCabinet", back_populates="room", cascade="all, delete-orphan")
    eips = relationship("LvsEip", back_populates="room_ref")

class InfraCabinet(Base):
    """叶子节点：机柜"""
    __tablename__ = "infra_cabinet"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    code = Column(String(20), index=True) # e.g. C01
    room_id = Column(Integer, ForeignKey('infra_room.id'))
    room = relationship("InfraRoom", back_populates="cabinets")
    
    # 一个机柜承载多台 LVS 设备
    lvs_nodes = relationship("LvsDatacenter", back_populates="cabinet_ref")
    
    # 支持公网资源划分配至此接入机柜
    eips = relationship("LvsEip", back_populates="cabinet_ref")
class LvsDatacenter(Base):
    __tablename__ = "lvs_datacenter"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), index=True)
    datacenter = Column(String(20))
    cabinet = Column(String(20))
    gid = Column(Integer)
    wip = Column(String(15), unique=True, index=True)
    lip = Column(String(15), unique=True)
    state = Column(String(15))
    notification_email = Column(String(25))
    # ... 省略部分其他字段以保持简洁架构，后续可随时根据需用扩充
    router_id = Column(String(10))
    virtual_router_id = Column(Integer)
    priority = Column(Integer)

    # Readability aliases (keep legacy column names for compatibility)
    zone_code = synonym("datacenter")
    rack_code = synonym("cabinet")
    vrrp_group_id = synonym("gid")
    public_ip = synonym("wip")
    private_ip = synonym("lip")
    ha_role = synonym("state")
    
    # 基础设施外键绑定
    infra_cabinet_id = Column(Integer, ForeignKey('infra_cabinet.id'), nullable=True)
    cabinet_ref = relationship("InfraCabinet", back_populates="lvs_nodes")

    # 关联回 VIP
    vips = relationship("LvsVip", secondary=vip_datacenter_association, back_populates="datacenters")


class LvsVip(Base):
    __tablename__ = "lvs_vip"

    id = Column(Integer, primary_key=True, index=True)
    virtual_ipaddress = Column(String(15), index=True)
    wan_ip = Column(String(15))
    port = Column(Integer)
    app = Column(String(50))
    delay_loop = Column(Integer)
    lb_algo = Column(String(5))
    lb_kind = Column(String(3))

    # Readability aliases (keep legacy column names for compatibility)
    vip_address = synonym("virtual_ipaddress")
    service_name = synonym("app")
    health_check_interval = synonym("delay_loop")
    lb_algorithm = synonym("lb_algo")
    forwarding_mode = synonym("lb_kind")

    # 与 Datacenter 的多对多关系
    datacenters = relationship("LvsDatacenter", secondary=vip_datacenter_association, back_populates="vips")
    # 与 Server 的多对多关系
    servers = relationship("LvsServers", secondary=server_vip_association, back_populates="vips")
    
    # 与 EIP 的一对多关系 (一个VIP可承载多个公网弹性IP入口)
    eips = relationship("LvsEip", back_populates="vip")

class LvsEip(Base):
    __tablename__ = "lvs_eip"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), unique=True, index=True) # 修改为长度50支持CIDR，如 /24
    asset_type = Column(String(50), default="PUBLIC_EIP") # 'PUBLIC_EIP', 'VIP_RESERVED', 'CAB_SUBNET'
    bandwidth = Column(Integer, default=100) # Mbps
    isp = Column(String(50)) # e.g., "BGP", "Telecom", "AWS"
    state = Column(String(20), default="UNASSIGNED") # UNASSIGNED, IN_USE
    target_internal_ip = Column(String(50), nullable=True) # 可以灵活映射至任意内部节点 (DR 或者 VIP)
    
    vip_id = Column(Integer, ForeignKey('lvs_vip.id'), nullable=True)
    vip = relationship("LvsVip", back_populates="eips")

    nginx_cluster_id = Column(Integer, ForeignKey('nginx_cluster.id'), nullable=True)
    nginx_cluster = relationship("NginxCluster", back_populates="eips")

    nginx_zone_id = Column(Integer, ForeignKey('nginx_zone.id'), nullable=True)
    nginx_zone = relationship("NginxZone", back_populates="eips")

    # 基础设施外键绑定 (机房/机柜分级)
    infra_room_id = Column(Integer, ForeignKey('infra_room.id'), nullable=True)
    room_ref = relationship("InfraRoom", back_populates="eips")
    
    infra_cabinet_id = Column(Integer, ForeignKey('infra_cabinet.id'), nullable=True)
    cabinet_ref = relationship("InfraCabinet", back_populates="eips")

class LvsMonitors(Base):
    __tablename__ = "lvs_monitors"

    id = Column(Integer, primary_key=True, index=True)
    monitors_name = Column(String(20))
    monitors_type = Column(String(20))
    monitors_par1 = Column(String(200))
    monitors_par2 = Column(String(200))

    # 一对多，对应 Server
    servers = relationship("LvsServers", back_populates="monitor")


class LvsServers(Base):
    __tablename__ = "lvs_servers"

    id = Column(Integer, primary_key=True, index=True)
    serverip = Column(String(15))
    serverlip = Column(String(15))
    servername = Column(String(20))
    port = Column(Integer)
    weight = Column(Integer)
    onoff = Column(String(3))

    # Readability aliases (keep legacy column names for compatibility)
    server_ip = synonym("serverip")
    server_private_ip = synonym("serverlip")
    server_name = synonym("servername")
    enabled_state = synonym("onoff")
    
    # 关联外键监控
    monitors_id = Column(Integer, ForeignKey('lvs_monitors.id'))
    monitor = relationship("LvsMonitors", back_populates="servers")

    # 与 Vip 的关系
    vips = relationship("LvsVip", secondary=server_vip_association, back_populates="servers")

# --- Nginx 七层应用网关模型 ---
class NginxCluster(Base):
    """Nginx 管理节点集群"""
    __tablename__ = "nginx_cluster"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)          # e.g., "Web-Ingress-Cluster"
    nodes_ips = Column(String)                 # e.g., "10.0.1.101,10.0.1.102"
    ssh_user = Column(String, default="root")
    infra_cabinet_id = Column(Integer, ForeignKey("infra_cabinet.id"), nullable=True)
    
    zones = relationship("NginxZone", back_populates="cluster", cascade="all, delete-orphan")
    eips = relationship("LvsEip", back_populates="nginx_cluster")
    node_ips_csv = synonym("nodes_ips")

class NginxZone(Base):
    """Nginx 服务虚拟主机 (VHost / Server Block)"""
    __tablename__ = "nginx_zone"
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("nginx_cluster.id"))
    domain = Column(String, index=True)        # e.g., "api.example.com"
    listen_port = Column(Integer, default=80)  # e.g., 80
    ssl_enabled = Column(Integer, default=0)   # 0或1
    
    cluster = relationship("NginxCluster", back_populates="zones")
    upstreams = relationship("NginxUpstream", back_populates="zone", cascade="all, delete-orphan")
    eips = relationship("LvsEip", back_populates="nginx_zone")
    ssl_enabled_flag = synonym("ssl_enabled")

class NginxUpstream(Base):
    """Nginx 代理后端真实应用池"""
    __tablename__ = "nginx_upstream"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("nginx_zone.id"))
    ip_address = Column(String)                # e.g., "192.168.10.100"
    port = Column(Integer, default=8080)
    weight = Column(Integer, default=1)
    
    zone = relationship("NginxZone", back_populates="upstreams")
