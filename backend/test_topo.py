import urllib.request
import json

def fetch_json(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

vips = fetch_json("http://localhost:8000/api/vips/")
infra = fetch_json("http://localhost:8000/api/infra/topology")
nodes = fetch_json("http://localhost:8000/api/datacenter/")

print(f"Total VIPs: {len(vips) if vips else 0}")
for v in vips or []:
    print(f"  VIP {v.get('id')} datacenters: {[d.get('id') for d in v.get('datacenters', [])]}")

print(f"Total Infra clusters: {len(infra) if infra else 0}")
if infra:
    print(f"  First cluster rooms: {len(infra[0].get('rooms', []))}")
    if infra[0].get('rooms'):
        print(f"  First room cabinets: {len(infra[0]['rooms'][0].get('cabinets', []))}")
        
print(f"Total Nodes: {len(nodes) if nodes else 0}")
for n in nodes or []:
    print(f"  Node {n.get('id')} infra_cabinet_id: {n.get('infra_cabinet_id')}")

