# ECS Execute Command Guide

## Overview

ECS Execute Command allows you to connect to running ECS tasks for debugging, maintenance, and troubleshooting. This guide covers how to use execute command with the TITAN Forecast frontend services.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Session Manager plugin installed
- Access to the ECS cluster and services

## Getting Started

### 1. Find Running Tasks

First, identify the task ARN for the service you want to connect to:

```bash
# Production service
aws ecs list-tasks --cluster titan-cluster --service-name titan-frontend-production

# Staging service  
aws ecs list-tasks --cluster titan-cluster --service-name titan-frontend-staging
```

### 2. Connect to Container

Use the execute command to connect to a running container:

```bash
aws ecs execute-command \
  --cluster titan-cluster \
  --task <TASK_ARN> \
  --container titan-frontend-production \
  --interactive \
  --command "/bin/sh"
```

## Available Commands

### Basic System Commands

```bash
# Check current directory
pwd

# List files and directories
ls -la

# Check environment variables
env

# View running processes
ps aux

# Check system information
uname -a

# Check disk usage
df -h

# Check memory usage
free -h
```

### Application-Specific Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages (if package.json exists)
npm list --depth=0

# Check if specific files exist
ls -la package.json
ls -la .next/
ls -la public/
```

### Debugging Commands

```bash
# Check application logs (if available)
cat /var/log/app.log

# Check environment variables related to the app
env | grep -E "(NODE|NEXT|APP)"

# Check network connections
netstat -tulpn

# Check if the application is listening on expected ports
netstat -tulpn | grep :3000
```

## Container Environment

### What's Available

- **Shell**: BusyBox (minimal shell environment)
- **Node.js**: Available for runtime operations
- **npm**: Available for package management
- **File System**: Read-only access to application files
- **Network**: Container networking capabilities

### What's NOT Available

- **Development Tools**: No git, vim, nano, or other development utilities
- **Package Installation**: Cannot install new packages (read-only filesystem)
- **File Editing**: Cannot modify files (production containers are immutable)
- **System Administration**: Limited system-level access

## Common Use Cases

### 1. Debugging Application Issues

```bash
# Check if the application is running
ps aux | grep node

# Check environment variables
env | grep NODE

# Verify file structure
ls -la /app
```

### 2. Monitoring Performance

```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h
```

### 3. Network Troubleshooting

```bash
# Check network connections
netstat -tulpn

# Test connectivity
ping google.com

# Check DNS resolution
nslookup google.com
```

## Troubleshooting

### Common Issues

1. **"no such file or directory" errors**
   - Use `/bin/sh` instead of `/bin/bash`
   - Check if the command exists with `which <command>`

2. **Session ends immediately**
   - This is normal for non-interactive commands
   - Use `--interactive` flag for shell access

3. **Permission denied**
   - Some commands may not be available in the minimal container
   - Try alternative commands or check with `which <command>`

### Getting Help

```bash
# Check available commands
ls /bin
ls /usr/bin

# Get help for specific commands
<command> --help
```

## Security Considerations

- Execute command sessions are logged in CloudTrail
- All commands are executed with the container's user permissions
- No persistent changes can be made to the container
- Sessions are encrypted and secure

## Best Practices

1. **Use for debugging only**: Don't attempt to modify production containers
2. **Check logs first**: Use CloudWatch logs before connecting to containers
3. **Be mindful of resources**: Don't run resource-intensive commands
4. **Document findings**: Keep notes of what you discover during debugging

## Example Session

```bash
# Connect to staging container
aws ecs execute-command \
  --cluster titan-cluster \
  --task arn:aws:ecs:us-east-1:183300739967:task/titan-cluster/abc123 \
  --container titan-frontend-staging \
  --interactive \
  --command "/bin/sh"

# Once connected, you can run commands:
/app # pwd
/app
/app # ls -la
total 1234
drwxr-xr-x    1 root     root          4096 Jan 15 10:30 .
drwxr-xr-x    1 root     root          4096 Jan 15 10:30 ..
-rw-r--r--    1 root     root           123 Jan 15 10:30 package.json
drwxr-xr-x    1 root     root          4096 Jan 15 10:30 .next
/app # node --version
v18.17.0
/app # npm --version
10.8.2
```

## Related Documentation

- [AWS ECS Execute Command Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [TITAN Forecast Infrastructure Documentation](../infrastructure/README.md)
