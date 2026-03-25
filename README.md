# Gate Dashboard

Gate Dashboard is a Linux-first Node app that runs on the same EC2 instance as OpenClaw and serves a React dashboard on port `3000`.

## Current Deployment Shape

The currently used cluster naming is:

- `cio` = `agent_1`
- `md` = `agent_2`
- `others` = worker agents such as `agent_3`, `agent_4`, `agent_5`, and later `agent_x`

The current deployed layout is:

- `cio` / `agent_1`: this repo, deployed as `/home/ec2-user/Agent_Cluster_v2`
- `md` / `agent_2`: the adapter from `deploy/agent_2_dashboard_adapter`
- `/opt/.../agent_server.py`: colleague-owned runtime on `md` and worker nodes
- OpenClaw runtime under `/home/ec2-user/.nvm/...`, `/home/ec2-user/.openclaw`, and `/tmp/openclaw`

## What This Project Does

The first version supports:

- viewing dashboard health
- viewing agent status
- viewing session lists and session detail
- viewing and editing allowlisted skills
- viewing and editing selected markdown files

OpenClaw remains the source of truth for health and session data. The dashboard should sit behind the entry server and reverse proxy, and OpenClaw itself should not be exposed directly to the public internet.

The editable document roots in the current deployment are:

- fixed markdown files from `/home/ec2-user/.openclaw/workspace`
- managed or local skills from `/home/ec2-user/.openclaw/skills`
- workspace skills from `/home/ec2-user/.openclaw/workspace/skills`

## Important Safety Rules

- Do not open port `3000` directly to the public internet.
- Do not expose the OpenClaw gateway directly to the public internet.
- For the first server build, open only SSH (`22`) from your own IP address.
- Only open `80` and `443` later if you are putting a reverse proxy such as Nginx in front of the dashboard.

## Local Workflow

This repository is developed for Amazon Linux EC2 first. Local desktop work is supported for unit and integration checks, but Linux and OpenClaw are not installed in this workspace and E2E is intentionally out of scope for the current phase.

Use pnpm for all package management:

```bash
pnpm install
pnpm dev
```

## Current Runtime Paths

These are the currently observed OpenClaw paths relevant to this project:

- executable: `/home/ec2-user/.nvm/versions/node/v22.22.1/bin/openclaw`
- installation directory: `/home/ec2-user/.nvm/versions/node/v22.22.1/lib/node_modules/openclaw`
- user configuration: `/home/ec2-user/.openclaw`
- workspace: `/home/ec2-user/.openclaw/workspace`
- managed or local skills: `/home/ec2-user/.openclaw/skills`
- workspace skills: `/home/ec2-user/.openclaw/workspace/skills`
- logs and temp files: `/tmp/openclaw`
- observed user service unit: `/run/user/1000/systemd/units/invocation:openclaw-gateway.service`

## AWS Setup For A Non-Technical Operator

The section below is an older single-node beginner path and should be treated as background reference, not the current live deployment shape described above.

This section assumes:

- you do not already have an EC2 instance
- you want a fresh Ubuntu 24.04 LTS server
- you need OpenClaw installed too
- you want the dashboard and OpenClaw on the same machine

This is the safest beginner path:

1. Create an Ubuntu EC2 server.
2. Lock SSH down to your own IP.
3. Install Node 24.
4. Install OpenClaw `2026.3.11`.
5. Clone this repo and build the dashboard.
6. Run the dashboard as a service.
7. Put Nginx in front of the dashboard later if you want browser access from outside.

### Before You Start

Have these ready:

- an AWS account
- a GitHub account that can read this repo
- a terminal app on your laptop
  - macOS: Terminal
  - Windows: PowerShell or Windows Terminal
- your API/provider credentials for OpenClaw onboarding
- a domain name if you want a friendly public URL later

### Step 1: Create The EC2 Instance

1. Sign in to AWS.
2. Open the EC2 console: [https://console.aws.amazon.com/ec2/](https://console.aws.amazon.com/ec2/)
3. Choose the AWS Region you want to use.
4. Click `Launch instance`.
5. For `Name`, enter something like `gate-dashboard-prod`.
6. Under `Application and OS Images`, choose `Ubuntu`.
7. Choose `Ubuntu Server 24.04 LTS`.
8. Under `Instance type`, choose a general-purpose instance size that your technical owner approved.
   If nobody has told you otherwise, ask before choosing a large machine because that affects cost.
9. Under `Key pair (login)`, choose `Create new key pair`.
10. Choose:
    - type: `RSA`
    - format: `.pem`
11. Download the `.pem` file and keep it somewhere safe.
    Do not email it around and do not lose it.
12. Under `Network settings`, create or use a security group with:
    - inbound `SSH` on port `22`
    - source = `My IP`
13. Do not add port `3000`.
14. Do not add any OpenClaw gateway port.
15. Launch the instance.

AWS reference:

- EC2 getting started: [AWS EC2 Get Started](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
- Security groups: [AWS EC2 Security Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html)

### Step 2: Give The Server A Stable Public IP

This is optional, but recommended.

If you stop and start an EC2 instance, the public IP can change. If you want a stable address:

1. In the EC2 console, go to `Elastic IPs`.
2. Allocate a new Elastic IP.
3. Associate it with your new instance.

AWS reference:

- Elastic IPs: [AWS Elastic IP Addresses](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)

### Step 3: Connect To The Server Over SSH

On your laptop, open a terminal and run:

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_SERVER_IP
```

Notes:

- The username for Ubuntu EC2 images is usually `ubuntu`.
- Replace `YOUR_SERVER_IP` with the instance public IP or Elastic IP.

### Step 4: Update Ubuntu

Once logged into the server, run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

### Step 5: Install Node 24 And pnpm

This repo targets Node 24.

Install Node 24:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Check it:

```bash
node -v
npm -v
```

Enable pnpm through Corepack:

```bash
sudo corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm -v
```

OpenClaw reference:

- Install overview: [OpenClaw Install](https://docs.openclaw.ai/install)
- Node runtime: [OpenClaw Node.js](https://docs.openclaw.ai/install/node)

### Step 6: Install OpenClaw On Ubuntu

This repo targets OpenClaw `2026.3.11`.

Install that version explicitly:

```bash
sudo npm install -g openclaw@2026.3.11
openclaw onboard --install-daemon
```

During onboarding:

- follow the prompts
- sign in or provide the credentials OpenClaw asks for
- choose the normal gateway/daemon install path

After onboarding, verify the install:

```bash
openclaw doctor
openclaw status
```

If OpenClaw needs repair later, `openclaw doctor` is the first command to try.

OpenClaw reference:

- Linux platform notes: [OpenClaw Linux](https://docs.openclaw.ai/platforms/linux)

### Step 7: Clone This Dashboard Repo

Choose a place to keep the app:

```bash
cd /opt
sudo git clone https://github.com/VictorZhouSunset/Agent_Cluster.git
sudo chown -R $USER:$USER /opt/Agent_Cluster
cd /opt/Agent_Cluster
```

### Step 8: Install And Build The Dashboard

From inside the repo:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

If all four commands succeed, the dashboard is ready to run.

### Step 9: Start The Dashboard Manually The First Time

Run:

```bash
pnpm start
```

This starts the built Node server from `dist/server/server/index.js`.

By default it listens on:

```text
http://127.0.0.1:3000
```

Keep this terminal open while you test.

### Step 10: Make The Dashboard Start Automatically On Boot

Create a systemd service:

```bash
sudo tee /etc/systemd/system/gate-dashboard.service > /dev/null <<'EOF'
[Unit]
Description=Gate Dashboard
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/Agent_Cluster
Environment=PORT=3000
Environment=GATE_CLUSTER_TOPOLOGY=tier0
ExecStart=/usr/bin/env pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gate-dashboard
sudo systemctl start gate-dashboard
sudo systemctl status gate-dashboard
```

To read logs later:

```bash
sudo journalctl -u gate-dashboard -f
```

### Step 11: Put Nginx In Front Of The Dashboard

Do this only when the dashboard itself is already working.

Install Nginx:

```bash
sudo apt install -y nginx
```

Create an Nginx site:

```bash
sudo tee /etc/nginx/sites-available/gate-dashboard > /dev/null <<'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/gate-dashboard /etc/nginx/sites-enabled/gate-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

Now update the EC2 security group:

- add inbound `HTTP` on port `80`
- add inbound `HTTPS` on port `443` if you will add TLS
- keep port `3000` closed

### Step 12: Add HTTPS Later

If you have a real domain name pointing to the server, you can add TLS later with Certbot.

Typical path on Ubuntu:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

### Step 13: What To Check If Something Is Broken

If the dashboard does not load:

```bash
sudo systemctl status gate-dashboard
sudo journalctl -u gate-dashboard -n 100 --no-pager
```

If OpenClaw data is missing:

```bash
openclaw doctor
openclaw status
```

If Nginx is the problem:

```bash
sudo nginx -t
sudo systemctl status nginx
```

### Step 14: What A Non-Tech Person Should Never Open Publicly

Never open these directly in the EC2 security group:

- port `3000`
- the raw OpenClaw gateway port
- broad SSH access from `Anywhere`

Safe beginner rule:

- keep SSH on `22` limited to `My IP`
- keep dashboard behind Nginx
- keep OpenClaw private to the server unless your technical owner explicitly gives you a different secure setup

## Production Start

Build the dashboard, then start the built Node server entrypoint:

```bash
pnpm build
pnpm start
```

You can override the default port with `PORT`, though the intended default remains `3000`.

## Cluster Adapter

For the multi-node cluster setup discussed in this repo:

- `cio` / `agent_1` keeps running the Node dashboard on `3000`
- `md` / `agent_2` runs the Python dashboard adapter on `9011`
- `others` such as `agent_3` and future worker nodes stay behind their existing `9001` control-plane APIs

The folder to deploy on `md` / `agent_2` is:

```text
deploy/agent_2_dashboard_adapter
```

On `cio` / `agent_1`, point the dashboard backend at that adapter with:

```bash
export GATE_CLUSTER_ADAPTER_BASE_URL=http://<agent-2-private-ip>:9011
export GATE_CLUSTER_ADAPTER_SECRET=<same dashboard adapter secret configured on agent_2>
```

For Tier 0 single-node deployments, do not configure those adapter variables.
Set this instead:

```bash
export GATE_CLUSTER_TOPOLOGY=tier0
```

In Tier 0 mode the dashboard only expects the local `cio` node and `/api/health`
does not wait on `md`.

On `md` / `agent_2`, read the adapter-specific setup instructions in:

```text
deploy/agent_2_dashboard_adapter/README.md
```

## Current EC2 Install Targets

When following the current live structure, use these install locations:

- `cio` / `agent_1`: `/home/ec2-user/Agent_Cluster_v2`
- `md` / `agent_2`: copy `deploy/agent_2_dashboard_adapter` to a deployment folder such as `/home/ec2-user/agent_2_dashboard_adapter`
- colleague-owned agent runtime: `/opt/.../agent_server.py`

## Manual GitHub Deployment Button

This repo now includes a manual GitHub Actions deployment workflow:

```text
.github/workflows/deploy-test-cluster.yml
```

It is designed for the current test cluster shape:

1. validate the repo in GitHub Actions
2. deploy `md` first through AWS SSM
3. deploy `cio` second through AWS SSM
4. fail the whole run if either machine fails

### What The Workflow Assumes

- `cio` and `md` are both online in AWS Systems Manager
- GitHub Actions can assume an AWS role through OIDC
- `cio` already stores a GitHub read credential so `git pull --ff-only` can run non-interactively
- `md` already stores a GitHub read credential so `git pull --ff-only` can run non-interactively
- the existing systemd service names are:
  - `gate-dashboard`
  - `agent2-dashboard-adapter`

### One-Time EC2 Git Credential Setup

Because the deployment workflow runs `git pull --ff-only` on each machine, each EC2 needs a stored read-only GitHub credential once before the workflow can run unattended.

Run these commands as `ec2-user` on both `cio` and `md`:

```bash
git config --global credential.helper store
chmod 700 /home/ec2-user
```

Then run one authenticated pull in the relevant repo directory:

- `cio`

  ```bash
  cd /home/ec2-user/Agent_Cluster_v2
  git pull --ff-only
  chmod 600 /home/ec2-user/.git-credentials
  ```

- `md`

  ```bash
  cd /home/ec2-user/Agent_Cluster_deploy_src
  git pull --ff-only
  chmod 600 /home/ec2-user/.git-credentials
  ```

Use your GitHub username and a read-only Personal Access Token when prompted. After that first successful pull, the GitHub Actions workflow can reuse the stored credential non-interactively.

### Required GitHub Repository Variables

In GitHub:

`Settings -> Secrets and variables -> Actions -> Variables`

Add these repository variables:

- `AWS_REGION`
  Example: `us-east-1`
- `AWS_DEPLOY_ROLE_ARN`
  The IAM role ARN that GitHub Actions should assume through OIDC
- `AWS_CIO_INSTANCE_ID`
  The EC2 instance id for `cio`
- `AWS_MD_INSTANCE_ID`
  The EC2 instance id for `md`

### What The Workflow Runs On md

The workflow updates the source clone on `md`, syncs the adapter into the live runtime folder, and restarts the adapter:

```bash
cd /home/ec2-user/Agent_Cluster_deploy_src
git pull --ff-only
rsync -a --delete /home/ec2-user/Agent_Cluster_deploy_src/deploy/agent_2_dashboard_adapter/ /home/ec2-user/agent_2_dashboard_adapter/
sudo systemctl restart agent2-dashboard-adapter
```

### What The Workflow Runs On cio

The workflow updates the main repo on `cio`, rebuilds the dashboard, and restarts the service:

```bash
cd /home/ec2-user/Agent_Cluster_v2
git pull --ff-only
source /home/ec2-user/.nvm/nvm.sh
pnpm install
pnpm build
sudo systemctl restart gate-dashboard
```

### How To Use It

1. Push your code to GitHub
2. Open the `Actions` tab in GitHub
3. Open `Deploy Test Cluster`
4. Click `Run workflow`
5. Wait for `md` to complete before `cio` begins

## Validation

Run the non-E2E checks after changes:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test -- --run
```

## Notes

- The dashboard listens on port `3000`.
- Public traffic should be routed through the entry server and reverse proxy rather than direct access to port `3000`.
- Editable files are limited to the allowlisted markdown files and `skills/*/SKILL.md`.
- As of March 14, 2026, npm shows OpenClaw `2026.3.13` as latest, but this repo still targets `2026.3.11`.
