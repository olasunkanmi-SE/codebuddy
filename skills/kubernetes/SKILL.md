---
name: kubernetes
description: Manage Kubernetes clusters via the kubectl CLI.
metadata:
  displayName: Kubernetes
  icon: cloud
  category: cloud
  version: 1.0.0
  dependencies:
    cli: kubectl
    checkCommand: kubectl version --client
    install:
      darwin:
        brew: kubernetes-cli
        scriptArch:
          x64: curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
          arm64: curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
        manual: Download from https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/
      linux:
        snap: kubectl --classic
        apt: kubectl
        scriptArch:
          x64: curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
          arm64: curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
      windows:
        scoop: kubectl
        choco: kubernetes-cli
        winget: Kubernetes.kubectl
        manual: Download from https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
  config:
    - name: KUBECONFIG
      label: Kubeconfig Path
      type: string
      required: false
      placeholder: ~/.kube/config
  auth:
    type: none
    setupCommand: kubectl config view
---

# kubectl

Use `kubectl` to interact with Kubernetes clusters.

## Common Commands

### Pods

- List pods: `kubectl get pods`
- Describe pod: `kubectl describe pod <pod-name>`
- Logs: `kubectl logs <pod-name>`
- Exec: `kubectl exec -it <pod-name> -- /bin/bash`

### Deployments

- List deployments: `kubectl get deployments`
- Scale: `kubectl scale deployment <name> --replicas=3`

### Services

- List services: `kubectl get services`

### Context

- Get context: `kubectl config current-context`
- Use context: `kubectl config use-context <context-name>`

## Notes

- Requires `kubectl` to be installed and configured (`~/.kube/config`).
