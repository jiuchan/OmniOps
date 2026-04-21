from pydantic import BaseModel
from typing import List, Optional

# --- Infra Schemas ---
class InfraCabinetBase(BaseModel):
    name: str
    code: str

class InfraCabinetCreate(InfraCabinetBase):
    room_id: int

class InfraCabinetSchema(InfraCabinetBase):
    id: int
    room_id: int
    class Config:
        from_attributes = True

class InfraRoomBase(BaseModel):
    name: str
    code: str

class InfraRoomCreate(InfraRoomBase):
    datacenter_id: int

class InfraRoomSchema(InfraRoomBase):
    id: int
    datacenter_id: int
    cabinets: List[InfraCabinetSchema] = []
    class Config:
        from_attributes = True

class InfraDatacenterBase(BaseModel):
    name: str
    code: str

class InfraDatacenterCreate(InfraDatacenterBase):
    pass

class InfraDatacenterSchema(InfraDatacenterBase):
    id: int
    rooms: List[InfraRoomSchema] = []
    class Config:
        from_attributes = True

class InfraCabinetUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class InfraRoomUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class InfraDatacenterUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

# --- LvsDatacenter Schemas ---
class DatacenterBase(BaseModel):
    name: str
    datacenter: str
    cabinet: str
    gid: int
    wip: str
    lip: str
    state: str
    router_id: str
    virtual_router_id: int
    priority: int
    notification_email: Optional[str] = None
    infra_cabinet_id: Optional[int] = None

class DatacenterCreate(DatacenterBase):
    pass

class DatacenterSchema(DatacenterBase):
    id: int
    zone_code: Optional[str] = None
    rack_code: Optional[str] = None
    vrrp_group_id: Optional[int] = None
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    ha_role: Optional[str] = None

    class Config:
        from_attributes = True


# --- LvsEip Schemas ---
class EipBase(BaseModel):
    ip_address: str
    asset_type: str = "PUBLIC_EIP"
    bandwidth: int = 100
    isp: str = "BGP"
    state: str = "UNASSIGNED"
    vip_id: Optional[int] = None
    target_internal_ip: Optional[str] = None
    nginx_cluster_id: Optional[int] = None
    nginx_zone_id: Optional[int] = None
    infra_room_id: Optional[int] = None
    infra_cabinet_id: Optional[int] = None

class EipCreate(EipBase):
    pass

class EipSchema(EipBase):
    id: int
    vip_id: Optional[int]

    class Config:
        from_attributes = True

# --- 身份安防鉴权模型 ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class PermissionBase(BaseModel):
    resource_name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionSchema(PermissionBase):
    id: int
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permissions: List[int] = []

class RoleSchema(RoleBase):
    id: int
    permissions: List[PermissionSchema] = []
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    roles: List[int] = []

class GroupSchema(GroupBase):
    id: int
    roles: List[RoleSchema] = []
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "VIEWER"

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    roles: List[RoleSchema] = []
    groups: List[GroupSchema] = []

    class Config:
        from_attributes = True

# --- LvsVip Schemas ---
class VipBase(BaseModel):
    virtual_ipaddress: str
    wan_ip: Optional[str] = None
    port: int
    app: str
    delay_loop: int
    lb_algo: str
    lb_kind: str

class VipCreate(VipBase):
    pass

class VipSchema(VipBase):
    id: int
    vip_address: Optional[str] = None
    service_name: Optional[str] = None
    health_check_interval: Optional[int] = None
    lb_algorithm: Optional[str] = None
    forwarding_mode: Optional[str] = None
    datacenters: List[DatacenterSchema] = []
    eips: List[EipSchema] = []

    class Config:
        from_attributes = True


# --- LvsMonitors Schemas ---
class MonitorBase(BaseModel):
    monitors_name: str
    monitors_type: str
    monitors_par1: str
    monitors_par2: str

class MonitorCreate(MonitorBase):
    pass

class MonitorSchema(MonitorBase):
    id: int

    class Config:
        from_attributes = True


# --- LvsServers Schemas ---
class ServerBase(BaseModel):
    serverip: str
    serverlip: str
    servername: str
    port: int
    weight: int
    onoff: str

class ServerCreate(ServerBase):
    monitors_id: Optional[int] = None

class ServerSchema(ServerBase):
    id: int
    server_ip: Optional[str] = None
    server_private_ip: Optional[str] = None
    server_name: Optional[str] = None
    enabled_state: Optional[str] = None
    monitor: Optional[MonitorSchema] = None
    vips: List[VipSchema] = []

    class Config:
        from_attributes = True

# --- Nginx 七层应用网关 Schemas ---

class NginxUpstreamBase(BaseModel):
    ip_address: str
    port: int = 8080
    weight: int = 1
    zone_id: Optional[int] = None

class NginxUpstreamCreate(NginxUpstreamBase):
    pass

class NginxUpstreamSchema(NginxUpstreamBase):
    id: int

    class Config:
        from_attributes = True

class NginxZoneBase(BaseModel):
    domain: str
    listen_port: int = 80
    ssl_enabled: int = 0
    cluster_id: Optional[int] = None

class NginxZoneCreate(NginxZoneBase):
    pass

class NginxZoneSchema(NginxZoneBase):
    id: int
    ssl_enabled_flag: Optional[int] = None
    upstreams: List[NginxUpstreamSchema] = []
    eips: List[EipSchema] = []

    class Config:
        from_attributes = True

class NginxClusterBase(BaseModel):
    name: str
    nodes_ips: str
    ssh_user: str = "root"
    infra_cabinet_id: Optional[int] = None

class NginxClusterCreate(NginxClusterBase):
    pass

class NginxClusterSchema(NginxClusterBase):
    id: int
    node_ips_csv: Optional[str] = None
    zones: List[NginxZoneSchema] = []
    eips: List[EipSchema] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    groups: List[int] = []
