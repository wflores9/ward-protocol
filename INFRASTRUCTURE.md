# Ward Protocol - Infrastructure Documentation

## Production Environment

| Component | Details |
|-----------|---------|
| **Server** | DigitalOcean 1vCPU / 1GB RAM / 25GB SSD |
| **OS** | Ubuntu 24.04 LTS |
| **Runtime** | Python 3.12, FastAPI + Uvicorn |
| **Database** | PostgreSQL 16 |
| **Reverse Proxy** | Nginx with SSL termination |
| **SSL** | Let's Encrypt (auto-renewal via certbot) |
| **Domain** | api.wardprotocol.org |
| **XRPL** | Testnet integration |

## Security Hardening

### Firewall (UFW)
- Default deny incoming
- Allowed: SSH (22), HTTP (80), HTTPS (443)
- All other ports blocked

### SSH
- Password authentication disabled
- Key-only authentication
- Max 3 auth attempts per connection
- Root login restricted to key-only

### Fail2ban
- SSH jail: 3 failures → 2-hour ban
- Nginx rate limit jail: 10 failures → 1-hour ban
- Auto-starts on boot

### Nginx
- Rate limiting: 10 req/s per IP (burst 20)
- Gzip compression enabled
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Server tokens hidden
- SSL/TLS with Let's Encrypt

### API Security
- API key authentication required
- Rate limiting per endpoint tier
- Security headers middleware
- CORS configuration

## Reliability

### Memory Management
- 2GB swap file configured
- Swappiness tuned to 10 (prefer RAM)
- Prevents OOM kills on 1GB instance

### Automated Backups
- Daily PostgreSQL dumps at 03:00 UTC
- 7-day retention policy
- Stored at /opt/backups/

### Service Management
- systemd service with auto-restart
- Log rotation (14-day retention)
- SSL auto-renewal (certbot timer)

## Monitoring
```bash
# Service status
systemctl status ward-protocol

# API health
curl https://api.wardprotocol.org/health

# Fail2ban status
fail2ban-client status sshd

# Recent logs
journalctl -u ward-protocol --since "1 hour ago"

# Backup status
ls -la /opt/backups/*.sql.gz
```

## Deployment
```bash
cd /opt/ward-protocol
source venv/bin/activate
git pull origin main
sudo systemctl restart ward-protocol
```
