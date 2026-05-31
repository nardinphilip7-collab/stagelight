import urllib.request, json
req = urllib.request.Request('http://localhost:8000/api/auth/login/', data=json.dumps({'email':'actor@example.com', 'password':'password123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['access']
req2 = urllib.request.Request('http://localhost:8000/api/availability/', data=json.dumps({'start_date': '2026-06-01', 'end_date': '2026-06-18', 'state': 'available', 'note': 'test', 'willing_to_travel': True}).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
try:
    print(urllib.request.urlopen(req2).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
