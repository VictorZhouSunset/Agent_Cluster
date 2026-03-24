# workflows
Manual GitHub Actions workflows for validating and deploying this repo.
Current contents focus on one-button test deployment to `md` and `cio` through AWS SSM.
Workflows here assume EC2-side git credentials and systemd services are already prepared, and should stay current with official Node 24-compatible GitHub Actions runtimes.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| ARCH.md | folder contract | documents the workflow folder contents |
| deploy-test-cluster.yml | manual deployment workflow | validates the repo on the project target Node version, then deploys `md` and `cio` through AWS SSM using Node 24-compatible official actions |
