# House (not for GitHub)

Canon on cubert: `/sd-backup/projects/castle-grounds`

```
ssh cubert
cd /sd-backup/projects/castle-grounds
python3 -m http.server 8767 --bind 0.0.0.0
```

LAN: <http://192.168.4.18:8767/>
Rose stays :8765. Well stays :8766. Do not steal them.

UFW: `8767/tcp` ALLOW from `192.168.0.0/16` only.
