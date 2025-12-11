/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import styled from "styled-components";

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQAccordionProps {
  title?: string;
  items: any[];
  titleClassName?: string;
  questionClassName?: string;
  answerClassName?: string;
  containerClassName?: string;
  itemClassName?: string;
}

const AccordionContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
`;

const AccordionItem = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const AccordionButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 0;
  text-align: left;
  font-weight: 500;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.95);
  }
`;

const IconWrapper = styled.span`
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s ease;

  ${AccordionButton}:hover & {
    color: rgba(255, 255, 255, 0.6);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const AnswerWrapper = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  max-height: ${props => props.$isOpen ? '5000px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  padding: ${props => props.$isOpen ? '0 0 16px 0' : '0'};
`;

const AnswerContent = styled.div`
  font-size: 12px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
  
  p {
    margin: 0 0 12px 0;
    text-align: left;
  }

  p:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin: 16px 0 10px 0;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 6px 0;
    color: rgba(255, 255, 255, 0.55);
  }

  strong {
    color: rgba(255, 255, 255, 0.75);
    font-weight: 500;
  }

  a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
      border-bottom-color: rgba(255, 255, 255, 0.5);
    }
  }

  code {
    background: rgba(255, 255, 255, 0.04);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: 'Consolas', 'Monaco', monospace;
  }
`;

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  questionClassName = "",
  answerClassName = "",
  containerClassName = "",
  itemClassName = "",
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <AccordionContainer className={containerClassName}>
      <div>
        {items.map((item, index) => (
          <AccordionItem key={index} className={itemClassName}>
            <AccordionButton
              className={questionClassName}
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
              aria-controls={`answer-${index}`}
            >
              {item.question}
              <IconWrapper>
                {openIndex === index ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </IconWrapper>
            </AccordionButton>
            <AnswerWrapper
              id={`answer-${index}`}
              $isOpen={openIndex === index}
              className={answerClassName}
            >
              <AnswerContent>
                {React.isValidElement(item.answer) ? (
                  item.answer
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: item.answer as string }} />
                )}
              </AnswerContent>
            </AnswerWrapper>
          </AccordionItem>
        ))}
      </div>
    </AccordionContainer>
  );
};