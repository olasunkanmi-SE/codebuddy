import * as fs from 'fs';
import * as path from 'path';

export interface Skill {
    name: string;
    description: string;
    content: string;
}

export class SkillManager {
    private static instance: SkillManager;
    private skills: Skill[] = [];

    private constructor() {}

    public static getInstance(): SkillManager {
        if (!SkillManager.instance) {
            SkillManager.instance = new SkillManager();
        }
        return SkillManager.instance;
    }

    public async loadSkills(rootPath: string): Promise<void> {
        this.skills = [];
        const skillsDir = path.join(rootPath, '.codebuddy', 'skills');

        if (!fs.existsSync(skillsDir)) {
            return;
        }

        try {
            const files = await this.findAllSkillFiles(skillsDir);
            for (const file of files) {
                const content = fs.readFileSync(file, 'utf-8');
                const skill = this.parseSkill(content);
                if (skill) {
                    this.skills.push(skill);
                }
            }
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    }

    private async findAllSkillFiles(dir: string): Promise<string[]> {
        const results: string[] = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results.push(...await this.findAllSkillFiles(filePath));
            } else if (file.toLowerCase().endsWith('skill.md')) {
                results.push(filePath);
            }
        }
        return results;
    }

    private parseSkill(content: string): Skill | null {
        // Simple frontmatter parser
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return null;
        }

        const frontmatter = match[1];
        const body = match[2];

        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);

        if (!nameMatch) return null;

        let description = descMatch ? descMatch[1].trim() : '';
        if (description.startsWith('"') && description.endsWith('"')) {
            description = description.slice(1, -1);
        }

        return {
            name: nameMatch[1].trim(),
            description,
            content: body.trim()
        };
    }

    public getSkillsPrompt(): string {
        if (this.skills.length === 0) return '';

        let prompt = `\n\n## 🛠️ Available Skills\nYou have access to the following skills via their respective CLI commands. You can use them by running the commands described in their documentation using the 'RunCommand' tool.\n\n`;

        for (const skill of this.skills) {
            prompt += `### Skill: ${skill.name}\n${skill.description}\n\n${skill.content}\n\n---\n\n`;
        }

        return prompt;
    }
}
