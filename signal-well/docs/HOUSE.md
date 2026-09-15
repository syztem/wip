# House (not for GitHub)

Canon on cubert: `/sd-backup/projects/signal-well`

```
ssh cubert
cd /sd-backup/projects/signal-well
python3 -m http.server 8766 --bind 0.0.0.0
```

LAN: <http://192.168.4.18:8766/>
Rose stays :8765. Do not steal it.

UFW: `8766/tcp` and `8765/tcp` ALLOW from `192.168.0.0/16` only (preview). Default incoming deny. Do not open these to Anywhere.
