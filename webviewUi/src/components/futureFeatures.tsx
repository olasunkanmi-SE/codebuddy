import React, { useState } from "react";
import styled from "styled-components";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  status: "coming-soon" | "beta" | "experimental";
  category: string;
}

const Container = styled.div`
  width: 100%;
  padding: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  text-align: left;
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-align: left;
  line-height: 1.5;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.$active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  &:hover::before {
    left: 100%;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const IconWrapper = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.$status) {
      case 'beta': return 'rgba(59, 130, 246, 0.15)';
      case 'experimental': return 'rgba(168, 85, 247, 0.15)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'beta': return 'rgba(96, 165, 250, 0.9)';
      case 'experimental': return 'rgba(192, 132, 252, 0.9)';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'beta': return 'rgba(59, 130, 246, 0.3)';
      case 'experimental': return 'rgba(168, 85, 247, 0.3)';
      default: return 'rgba(255, 255, 255, 0.15)';
    }
  }};
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 8px 0;
  text-align: left;
`;

const CardDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.6;
  text-align: left;
`;

const CategoryTag = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const VoteButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const FutureFeatures: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");

  const features: FeatureCardProps[] = [
    {
      title: "Voice Coding",
      description: "Code with your voice using natural language. Hands-free programming with real-time transcription",
      icon: "🎤",
      status: "experimental",
      category: "Accessibility"
    },
    {
      title: "Team Collaboration",
      description: "Share AI conversations, custom agents, and context with your team. Real-time collaborative debugging",
      icon: "👥",
      status: "coming-soon",
      category: "Collaboration"
    },
    {
      title: "Documentation Generator",
      description: "Auto-generate comprehensive documentation from your code with examples and usage guides",
      icon: "📚",
      status: "coming-soon",
      category: "Documentation"
    },
    {
      title: "Test Generator",
      description: "Intelligent test generation with edge cases, mocks, and fixtures based on your code structure",
      icon: "🧪",
      status: "beta",
      category: "Testing"
    },
    {
      title: "Performance Profiler",
      description: "AI-driven performance analysis with bottleneck detection and optimization recommendations",
      icon: "⚡",
      status: "coming-soon",
      category: "Performance"
    },
    {
      title: "Security Scanner",
      description: "Real-time vulnerability detection with CVE database integration and fix suggestions",
      icon: "🔒",
      status: "coming-soon",
      category: "Security"
    },
    {
      title: "API Integration Hub",
      description: "Connect to external APIs with auto-generated clients and documentation",
      icon: "🔌",
      status: "coming-soon",
      category: "Integration"
    },
    {
      title: "Custom Prompts",
      description: "Create and share prompt templates for common coding tasks and workflows",
      icon: "✏️",
      status: "coming-soon",
      category: "Productivity"
    },
  ];

  const categories = ["all", ...Array.from(new Set(features.map(f => f.category)))];

  const filteredFeatures = filter === "all" 
    ? features 
    : features.filter(f => f.category === filter);

  return (
    <Container>
      <Header>
        <Title>Future Roadmap</Title>
        <Subtitle>
          Upcoming features and experiments. Vote for what you'd like to see next!
        </Subtitle>
      </Header>

      <FilterContainer>
        {categories.map(category => (
          <FilterButton
            key={category}
            $active={filter === category}
            onClick={() => setFilter(category)}
          >
            {category === "all" ? "All Features" : category}
          </FilterButton>
        ))}
      </FilterContainer>

      <Grid>
        {filteredFeatures.map((feature, index) => (
          <FeatureCard key={index}>
            <CardHeader>
              <IconWrapper>{feature.icon}</IconWrapper>
              <StatusBadge $status={feature.status}>
                {feature.status.replace("-", " ")}
              </StatusBadge>
            </CardHeader>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
            <CategoryTag>{feature.category}</CategoryTag>
            <VoteButton>
              <span>👍</span>
              <span>Vote for this feature</span>
            </VoteButton>
          </FeatureCard>
        ))}
      </Grid>
    </Container>
  );
};