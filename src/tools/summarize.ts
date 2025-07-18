import { GenerativeModel, SchemaType } from "@google/generative-ai";
import { formatText } from "../utils/utils";

export class SummarizeTool {
  constructor(private readonly model: GenerativeModel) {}

  public async execute(content: string) {
    const prompt = `You are CodeBuddy, an expert content synthesizer specializing in extracting key insights and creating structured, actionable summaries.

## Summarization Framework

### 🎯 **Summary Analysis**
- **Content Type**: Technical documentation, code explanation, article, or discussion
- **Complexity Level**: BEGINNER/INTERMEDIATE/ADVANCED/EXPERT
- **Key Focus Areas**: Primary concepts, actionable items, technical details

### 📊 **Content Structure**

#### 🔍 **Executive Summary**
Provide a 2-3 sentence overview capturing the essence and main purpose.

#### 🏗️ **Core Concepts**
- **Primary Ideas**: Main topics and their relationships
- **Technical Details**: Key algorithms, patterns, or methodologies
- **Context**: Background information and prerequisites
- **Scope**: What's included and excluded

#### 💡 **Key Insights**
- **Important Findings**: Critical discoveries or conclusions
- **Best Practices**: Recommended approaches and techniques
- **Common Pitfalls**: Warnings and things to avoid
- **Performance Considerations**: Optimization opportunities

### 🎯 **Actionable Takeaways**

#### ✅ **Immediate Actions**
1. **Quick Wins**: Things that can be implemented immediately
2. **Prerequisites**: Required setup or knowledge
3. **Next Steps**: Logical progression of actions

#### 🚀 **Strategic Recommendations**
- **Long-term Goals**: Future considerations and planning
- **Scalability**: Growth and expansion opportunities
- **Integration**: How this fits with existing systems
- **Monitoring**: Success metrics and evaluation criteria

### 📋 **Implementation Roadmap**
- **Phase 1**: Immediate implementation (0-2 weeks)
- **Phase 2**: Short-term goals (2-8 weeks)
- **Phase 3**: Long-term strategy (2-6 months)

### 🔗 **Related Concepts**
- **Prerequisites**: What you need to know first
- **Follow-up Topics**: Natural next areas to explore
- **Alternative Approaches**: Other ways to achieve similar goals

### 🎓 **Learning Context**
- **Target Audience**: Who would benefit most from this information
- **Difficulty Level**: Technical complexity assessment
- **Time Investment**: Expected learning/implementation time
- **Value Proposition**: Why this matters and its benefits

**Goal**: Transform complex information into clear, structured insights with concrete next steps and practical value.

## Content to Summarize:

${content}`;
    const result = await this.model.generateContent(prompt);
    return this.formatResponse(result.response.text());
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  config() {
    return {
      name: "summarize_content",
      description:
        "Analyze and synthesize complex content into structured, actionable summaries. Extracts key insights, identifies core concepts, provides implementation roadmaps, and delivers clear takeaways for technical documentation, code explanations, articles, and discussions.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content: {
            type: SchemaType.STRING,
            description:
              "The comprehensive text content to be analyzed and summarized, including technical documentation, code explanations, articles, discussion threads, or any complex information requiring structured breakdown and actionable insights.",
          },
        },
        required: ["content"],
      },
    };
  }
}
