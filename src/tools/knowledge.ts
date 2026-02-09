import { KnowledgeService } from "../services/knowledge.service";

export class KnowledgeTool {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  public async getProfile(limit: number = 10) {
    const topics = await this.knowledgeService.getTopTopics(limit);
    const history = await this.knowledgeService.getRecentHistory(limit);
    return { topics, history };
  }

  public async getTopicDetails(topics: string[]) {
    return await this.knowledgeService.getTopicDetails(topics);
  }

  public async recordQuizResult(topic: string, isCorrect: boolean) {
    return await this.knowledgeService.recordQuizResult(topic, isCorrect);
  }
}
