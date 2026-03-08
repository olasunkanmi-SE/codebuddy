# Skills System Roadmap

> **Vision**: Transform CodeBuddy skills from hidden prompt-based capabilities into a first-class, discoverable, toggle-able feature with OS-aware installation—mirroring the Connectors experience.

## Problem Statement

### Current Pain Points

| Issue | Impact |
|-------|--------|
| **Zero Discoverability** | New users have no idea skills exist. There's no UI, no settings, no documentation surface. |
| **Manual Setup Burden** | Users must know to create `.codebuddy/skills/` and copy skill files manually. |
| **No Installation Guidance** | Skills like `jira`, `github`, `aws` require CLI tools that users must install separately with no guidance. |
| **Inconsistent Experience** | Connectors have a polished toggle UI; skills are invisible configuration files. |
| **Repository vs Global** | Skills only load from workspace; users can't have global skills across projects. |

### User Journey Today (Broken)
```
User: "I want to use Jira with CodeBuddy"
       ↓
User: ??? (No indication skills exist)
       ↓
User: Gives up or manually discovers .codebuddy/skills through documentation
       ↓
User: Copies SKILL.md file manually
       ↓
User: Still doesn't work — needs to install jira-cli
       ↓
User: Frustrated, abandons feature
```

### User Journey Goal (Fixed)
```
User: Opens Settings → Skills tab
       ↓
User: Sees "Jira" skill with toggle & description
       ↓
User: Clicks "Enable"
       ↓
System: "Jira CLI not found. Install it?" → [Install] [Skip]
       ↓
User: Clicks Install
       ↓
System: Runs OS-appropriate install command in terminal
       ↓
User: Skill enabled, ready to use
```

---

## Architecture Overview

### Proposed System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Webview UI                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  SkillsSettings.tsx                                              │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  SkillRow: [Icon] Jira  [●] Enabled  [Configure] [Info]  │   │    │
│  │  │  SkillRow: [Icon] GitHub [○] Disabled [Enable]           │   │    │
│  │  │  ...                                                      │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ postMessage
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SkillHandler (Extension)                           │
│  Commands: get-skills, enable-skill, disable-skill,                      │
│            install-skill-deps, configure-skill                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SkillService (New)                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐    │
│  │ SkillRegistry  │  │ SkillInstaller │  │ SkillConfigManager      │    │
│  │ (built-in +    │  │ (OS-aware CLI  │  │ (user preferences,      │    │
│  │  discovery)    │  │  installation) │  │  authentication)        │    │
│  └────────────────┘  └────────────────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SkillManager (Enhanced)                            │
│  - Loads enabled skills into agent system prompt                         │
│  - Merges built-in + workspace + global skills                          │
│  - Provides `getSkillsPrompt()` to DeveloperAgent                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Skill Definition Schema (Enhanced)

```yaml
# .codebuddy/skills/jira.skill.md or skills/jira/SKILL.md
---
name: jira
displayName: Jira
description: Manage Jira issues, sprints, and epics via the jira-cli tool.
icon: jira  # Maps to bundled icon or URL
category: project-management  # For grouping in UI
version: 1.0.0

# Dependency information for auto-installation
dependencies:
  cli: jira
  checkCommand: jira --version  # Command to verify installation
  install:
    darwin:
      brew: ankitpokhrel/jira-cli/jira-cli
      script: brew install ankitpokhrel/jira-cli/jira-cli
    linux:
      script: |
        curl -sSL https://raw.githubusercontent.com/ankitpokhrel/jira-cli/master/install.sh | sh
    windows:
      scoop: jira-cli
      script: scoop install jira-cli

# Optional: Configuration fields shown in UI
config:
  - name: JIRA_API_TOKEN
    label: API Token
    type: secret
    required: true
    helpUrl: https://id.atlassian.com/manage-profile/security/api-tokens
  - name: JIRA_BASE_URL
    label: Jira Base URL
    type: string
    placeholder: https://yourcompany.atlassian.net
    required: true

# Authentication method
auth:
  type: api-key  # or 'oauth', 'none'
  setupCommand: jira init
---

# Skill Content (Markdown)
Use `./.codebuddy/bin/jira` or `jira` to interact with Jira...
```

---

## Implementation Phases

### Phase 1: Skill Service Foundation (Backend)

**Goal**: Create a robust backend service to manage skills lifecycle.

#### 1.1 Create SkillService Class
**File**: `src/services/skill.service.ts`

```typescript
interface SkillDefinition {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  category: string;
  version: string;
  dependencies?: SkillDependencies;
  config?: SkillConfigField[];
  auth?: SkillAuth;
  content: string;  // The markdown body
}

interface SkillState {
  enabled: boolean;
  installed: boolean;
  configured: boolean;
  lastError?: string;
}

interface SkillDependencies {
  cli: string;
  checkCommand: string;
  install: {
    darwin?: InstallConfig;
    linux?: InstallConfig;
    windows?: InstallConfig;
  };
}

interface InstallConfig {
  brew?: string;
  apt?: string;
  scoop?: string;
  script?: string;
}
```

**Responsibilities**:
- `getSkills()`: Returns all available skills with their states
- `enableSkill(skillId)`: Enables a skill for loading
- `disableSkill(skillId)`: Disables a skill
- `checkDependencies(skillId)`: Verifies if CLI tools are installed
- `installDependencies(skillId)`: Runs OS-appropriate install command
- `configureSkill(skillId, config)`: Saves skill configuration

#### 1.2 Skill Registry
**File**: `src/services/skill-registry.ts`

```typescript
class SkillRegistry {
  private builtInSkills: Map<string, SkillDefinition>;
  private userSkills: Map<string, SkillDefinition>;
  
  // Load built-in skills from extension's skills/ directory
  loadBuiltInSkills(): Promise<void>;
  
  // Discover skills from .codebuddy/skills/ in workspace
  discoverWorkspaceSkills(workspacePath: string): Promise<void>;
  
  // Discover global skills from ~/.codebuddy/skills/
  discoverGlobalSkills(): Promise<void>;
  
  // Get merged list (built-in + workspace + global, with precedence)
  getAllSkills(): SkillDefinition[];
}
```

#### 1.3 Skill Installer
**File**: `src/services/skill-installer.ts`

```typescript
class SkillInstaller {
  private readonly os: 'darwin' | 'linux' | 'windows';
  
  // Check if a skill's CLI dependency is installed
  async checkInstalled(skill: SkillDefinition): Promise<boolean>;
  
  // Install the skill's CLI dependency
  async install(skill: SkillDefinition): Promise<InstallResult>;
  
  // Get the install command for current OS
  getInstallCommand(skill: SkillDefinition): string | null;
  
  // Execute install in integrated terminal
  private executeInTerminal(command: string): Promise<void>;
}
```

#### 1.4 State Persistence
Store skill states in VS Code configuration:
```json
{
  "codebuddy.skills.states": {
    "jira": { "enabled": true, "installed": true, "configured": true },
    "github": { "enabled": true, "installed": true, "configured": false },
    "aws": { "enabled": false, "installed": false, "configured": false }
  }
}
```

---

### Phase 2: Webview UI (Frontend)

**Goal**: Create a discoverable, toggle-based UI for skills in Settings.

#### 2.1 Skills Settings Component
**File**: `webviewUi/src/components/settings/sections/SkillsSettings.tsx`

```tsx
// UI matching ConnectorsSettings pattern
<SkillsSettings>
  <SkillsHeader>
    <Title>Skills</Title>
    <Description>
      Enable skills to extend CodeBuddy with CLI integrations.
      Skills are installed to .codebuddy/skills/
    </Description>
  </SkillsHeader>
  
  <SkillCategories>
    <CategorySection title="Project Management">
      <SkillRow skill={jira} />
      <SkillRow skill={linear} />
    </CategorySection>
    
    <CategorySection title="Version Control">
      <SkillRow skill={github} />
      <SkillRow skill={gitlab} />
    </CategorySection>
    
    <CategorySection title="Cloud & DevOps">
      <SkillRow skill={aws} />
      <SkillRow skill={kubernetes} />
    </CategorySection>
    
    <CategorySection title="Databases">
      <SkillRow skill={postgres} />
      <SkillRow skill={mongodb} />
      <SkillRow skill={redis} />
    </CategorySection>
  </SkillCategories>
</SkillsSettings>
```

#### 2.2 Skill Row Component
```tsx
<SkillRow>
  <SkillIcon src={skill.icon} />
  <SkillInfo>
    <SkillName>{skill.displayName}</SkillName>
    <SkillDescription>{skill.description}</SkillDescription>
  </SkillInfo>
  <SkillStatus>
    {skill.installed ? <InstalledBadge /> : <NotInstalledBadge />}
    {skill.configured ? <ConfiguredBadge /> : null}
  </SkillStatus>
  <SkillActions>
    <ToggleSwitch 
      checked={skill.enabled} 
      onChange={handleToggle} 
    />
    <ConfigureButton onClick={handleConfigure} />
    <InfoButton onClick={showSkillDetails} />
  </SkillActions>
</SkillRow>
```

#### 2.3 Installation Modal
When enabling a skill that requires CLI tools:

```tsx
<InstallationModal skill={skill}>
  <ModalHeader>
    <Icon src={skill.icon} />
    <Title>Install {skill.displayName}?</Title>
  </ModalHeader>
  
  <ModalBody>
    <p>This skill requires the <code>{skill.dependencies.cli}</code> CLI tool.</p>
    <CommandPreview>
      {getInstallCommand(skill)}
    </CommandPreview>
  </ModalBody>
  
  <ModalFooter>
    <Button variant="secondary" onClick={skipInstall}>
      Skip (I'll install manually)
    </Button>
    <Button variant="primary" onClick={installNow}>
      Install Now
    </Button>
  </ModalFooter>
</InstallationModal>
```

#### 2.4 Configuration Panel
For skills requiring authentication/config:

```tsx
<ConfigurationPanel skill={skill}>
  <Form onSubmit={saveConfig}>
    {skill.config.map(field => (
      <FormField
        key={field.name}
        label={field.label}
        type={field.type}
        required={field.required}
        helpUrl={field.helpUrl}
        placeholder={field.placeholder}
      />
    ))}
    <SubmitButton>Save Configuration</SubmitButton>
  </Form>
  
  {skill.auth?.setupCommand && (
    <SetupSection>
      <p>Or run the setup wizard:</p>
      <CodeBlock>{skill.auth.setupCommand}</CodeBlock>
      <RunButton onClick={runSetupWizard}>
        Run in Terminal
      </RunButton>
    </SetupSection>
  )}
</ConfigurationPanel>
```

---

### Phase 3: Message Handler & Integration

**Goal**: Wire up the frontend to backend communication.

#### 3.1 Skill Handler
**File**: `src/webview-providers/handlers/skill-handler.ts`

```typescript
class SkillHandler implements IHandler {
  async handle(command: string, data: unknown): Promise<unknown> {
    switch (command) {
      case 'get-skills':
        return this.skillService.getSkills();
        
      case 'enable-skill':
        return this.handleEnableSkill(data.skillId);
        
      case 'disable-skill':
        return this.skillService.disableSkill(data.skillId);
        
      case 'install-skill-deps':
        return this.skillInstaller.install(data.skill);
        
      case 'configure-skill':
        return this.skillService.configureSkill(data.skillId, data.config);
        
      case 'check-skill-deps':
        return this.skillInstaller.checkInstalled(data.skill);
        
      case 'run-skill-setup':
        return this.runSetupCommand(data.skill);
    }
  }
  
  private async handleEnableSkill(skillId: string): Promise<EnableResult> {
    const skill = this.skillRegistry.getSkill(skillId);
    
    // Check if dependencies are installed
    const installed = await this.skillInstaller.checkInstalled(skill);
    
    if (!installed) {
      return {
        success: false,
        requiresInstall: true,
        installCommand: this.skillInstaller.getInstallCommand(skill)
      };
    }
    
    return this.skillService.enableSkill(skillId);
  }
}
```

#### 3.2 Register Handler
**File**: `src/webview-providers/base.ts`

```typescript
// Add to handler registry
this.handlers.set('skill', new SkillHandler(skillService, skillInstaller));
```

#### 3.3 Update SkillManager
**File**: `src/services/skill-manager.ts`

```typescript
class SkillManager {
  // Existing methods...
  
  // New: Only load enabled skills
  async loadEnabledSkills(): Promise<void> {
    const enabledSkills = this.skillService.getEnabledSkills();
    
    for (const skillId of enabledSkills) {
      const skill = this.skillRegistry.getSkill(skillId);
      if (skill) {
        this.skills.set(skill.name, skill);
      }
    }
  }
  
  // Enhanced: Include both workspace and built-in skills
  async loadSkills(workspacePath?: string): Promise<void> {
    // Load from built-in registry (enabled only)
    await this.loadEnabledSkills();
    
    // Load workspace-specific skills (always loaded if present)
    if (workspacePath) {
      await this.discoverWorkspaceSkills(workspacePath);
    }
  }
}
```

---

### Phase 4: CLI Installation System

**Goal**: Robust, OS-aware CLI tool installation.

#### 4.1 Installation Strategies

| OS | Package Manager | Fallback |
|----|-----------------|----------|
| macOS | Homebrew | Direct script download |
| Linux | apt/dnf/pacman | Direct script download |
| Windows | Scoop/Chocolatey/winget | Direct script download |

#### 4.2 Installation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    installDependency(skill)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Detect OS       │
                    │ (darwin/linux/  │
                    │  windows)       │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check Package   │
                    │ Manager (brew,  │
                    │ apt, scoop)     │
                    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Use brew │    │ Use apt  │    │ Use      │
        │ formula  │    │ package  │    │ script   │
        └──────────┘    └──────────┘    └──────────┘
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Run in Terminal │
                    │ (show progress) │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Verify Install  │
                    │ (checkCommand)  │
                    └─────────────────┘
```

#### 4.3 Terminal Integration

```typescript
class SkillInstaller {
  async install(skill: SkillDefinition): Promise<InstallResult> {
    const command = this.getInstallCommand(skill);
    if (!command) {
      return { success: false, error: 'No install method for this OS' };
    }
    
    // Create terminal with skill name
    const terminal = vscode.window.createTerminal({
      name: `Install: ${skill.displayName}`,
      message: `Installing ${skill.dependencies.cli}...`
    });
    
    terminal.show();
    terminal.sendText(command);
    
    // Wait for command to complete (with timeout)
    await this.waitForInstall(terminal, skill);
    
    // Verify installation
    const installed = await this.checkInstalled(skill);
    
    return { 
      success: installed, 
      error: installed ? undefined : 'Installation may have failed. Please check terminal output.'
    };
  }
}
```

---

### Phase 5: Built-in Skills Enhancement

**Goal**: Enhance existing skills with proper metadata.

#### 5.1 Skill Categories

| Category | Skills |
|----------|--------|
| **Project Management** | jira, linear |
| **Version Control** | github, gitlab |
| **Communication** | slack, email, gmail, whatsapp |
| **Cloud & DevOps** | aws, kubernetes, sentry |
| **Databases** | postgres, mysql, mongodb, redis, elasticsearch |

#### 5.2 Update Existing Skills

Update each skill file in `skills/*/SKILL.md` to include:
- `displayName` for UI
- `icon` reference
- `category` for grouping
- `dependencies` with install commands per OS
- `config` fields for authentication
- `auth` setup information

Example migration for `skills/jira/SKILL.md` → full schema.

#### 5.3 Bundled Icons

```
images/skills/
├── jira.svg
├── github.svg
├── gitlab.svg
├── aws.svg
├── kubernetes.svg
├── postgres.svg
├── mongodb.svg
├── redis.svg
├── slack.svg
├── linear.svg
└── ...
```

---

### Phase 6: Global Skills & Sync

**Goal**: Allow users to have skills available across all workspaces.

#### 6.1 Global Skills Directory
```
~/.codebuddy/
├── skills/
│   ├── custom-skill.skill.md
│   └── ...
├── config.json  # Global skill states
└── bin/         # CLI binaries (optional)
```

#### 6.2 Skill Precedence Order
1. **Workspace** (`.codebuddy/skills/`) - Highest priority
2. **Global** (`~/.codebuddy/skills/`) - Medium priority
3. **Built-in** (extension bundled) - Lowest priority

#### 6.3 Sync Across Workspaces
```typescript
// When enabling a skill, prompt user
async enableSkill(skillId: string): Promise<void> {
  const scope = await vscode.window.showQuickPick([
    { label: 'This workspace only', value: 'workspace' },
    { label: 'All workspaces (global)', value: 'global' }
  ], { placeHolder: 'Where should this skill be enabled?' });
  
  if (scope?.value === 'global') {
    // Save to global config
    await this.saveGlobalSkillState(skillId, true);
  } else {
    // Save to workspace config
    await this.saveWorkspaceSkillState(skillId, true);
  }
}
```

---

## Migration Strategy

### From Current System

1. **Preserve Backward Compatibility**
   - Existing `.codebuddy/skills/*.skill.md` files continue to work
   - Old format (without dependencies block) still loads

2. **Auto-Migration**
   - On first run, detect existing skills
   - Mark them as "enabled" in new state system
   - Show migration notification

3. **Gradual Rollout**
   - Phase 1-2: Backend + basic UI (no installation)
   - Phase 3-4: Full installation flow
   - Phase 5-6: Enhanced skills + global support

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Skill discoverability | 100% of users can find skills in Settings |
| Enable flow completion | >90% of users successfully enable a skill |
| Install success rate | >80% of CLI installs succeed on first try |
| Time to first skill | <2 minutes from discovery to working |

---

## Open Questions

1. **Connector Unification**: Should skills become a "type" of connector, or remain separate?
   - Pros: Unified UI, single place to manage integrations
   - Cons: Different mental model (connectors = services, skills = capabilities)

2. **Binary Distribution**: Should we bundle pre-compiled CLIs for common skills?
   - Pros: Instant installation, no network dependency
   - Cons: Extension size, maintenance burden, licensing

3. **MCP vs Skills**: Some skills could be MCP servers instead. Migration path?
   - Consider: Skills that would benefit from MCP's tool interface

4. **Marketplace**: Future skill marketplace for community contributions?
   - Consider: Security review, quality standards, hosting

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Backend | 2 weeks | None |
| Phase 2: WebView UI | 2 weeks | Phase 1 |
| Phase 3: Integration | 1 week | Phase 1, 2 |
| Phase 4: Installation | 2 weeks | Phase 3 |
| Phase 5: Skill Enhancement | 1 week | Phase 4 |
| Phase 6: Global Skills | 1 week | Phase 5 |

**Total**: ~9 weeks for full implementation

---

## File Changes Summary

### New Files
```
src/services/skill.service.ts
src/services/skill-registry.ts
src/services/skill-installer.ts
src/webview-providers/handlers/skill-handler.ts
webviewUi/src/components/settings/sections/SkillsSettings.tsx
webviewUi/src/components/settings/sections/SkillRow.tsx
webviewUi/src/components/settings/sections/InstallationModal.tsx
images/skills/*.svg
```

### Modified Files
```
src/services/skill-manager.ts  # Enhanced with service integration
src/webview-providers/base.ts  # Register skill handler
webviewUi/src/components/settings/Settings.tsx  # Add Skills tab
skills/*/SKILL.md  # Add dependencies metadata
package.json  # Add configuration schema
```

---

## Appendix: Example Skill Definitions

### Jira (Full Schema)
```yaml
---
name: jira
displayName: Jira
description: Manage Jira issues, sprints, and epics via CLI.
icon: jira
category: project-management
version: 1.0.0

dependencies:
  cli: jira
  checkCommand: jira version
  install:
    darwin:
      brew: ankitpokhrel/jira-cli/jira-cli
    linux:
      script: curl -fsSL https://raw.githubusercontent.com/ankitpokhrel/jira-cli/master/scripts/install.sh | sh
    windows:
      scoop: jira-cli

config:
  - name: JIRA_API_TOKEN
    label: API Token
    type: secret
    required: true
    helpUrl: https://id.atlassian.com/manage-profile/security/api-tokens
  - name: JIRA_BASE_URL
    label: Base URL
    type: string
    required: true
    placeholder: https://yourcompany.atlassian.net

auth:
  type: api-key
  setupCommand: jira init
---
# Skill content...
```

### GitHub (OAuth)
```yaml
---
name: github
displayName: GitHub
description: Manage GitHub repos, issues, and PRs via gh CLI.
icon: github
category: version-control
version: 1.0.0

dependencies:
  cli: gh
  checkCommand: gh --version
  install:
    darwin:
      brew: gh
    linux:
      apt: gh
      script: |
        type -p curl >/dev/null || sudo apt install curl -y
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update && sudo apt install gh -y
    windows:
      winget: GitHub.cli
      scoop: gh

auth:
  type: oauth
  setupCommand: gh auth login
---
# Skill content...
```
