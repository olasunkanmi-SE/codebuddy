/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
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

  // Custom CSS styles
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      maxWidth: "100%",
      margin: "0 auto",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#c8a750",
      textAlign: "left" as const,
      borderBottom: "",
      paddingBottom: "10px",
    },
    item: {
      borderBottom: "",
    },
    question: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      padding: "16px 0",
      textAlign: "left" as const,
      fontWeight: "bold",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
    },
    icon: {
      marginLeft: "10px",
    },
    answer: {
      overflow: "hidden",
      transition: "max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease",
      maxHeight: "0",
      opacity: "0",
      padding: "0",
      fontSize: "15px",
    },
    answerOpen: {
      maxHeight: "5000px",
      opacity: "1",
      padding: "16px 0",
    },
    paragraph: {
      margin: "0",
      lineHeight: "1.5",
    },
  };

  return (
    <div
      style={{ ...styles.container, ...(containerClassName ? {} : {}) }}
      className={containerClassName}
    >
      <div>
        {items.map((item, index) => (
          <div
            key={index}
            style={{ ...styles.item, ...(itemClassName ? {} : {}) }}
            className={itemClassName}
          >
            <button
              style={{ ...styles.question, ...(questionClassName ? {} : {}) }}
              className={questionClassName}
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
              aria-controls={`answer-${index}`}
            >
              {item.question}
              <span style={styles.icon}>
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
              </span>
            </button>
            <div
              id={`answer-${index}`}
              style={{
                ...styles.answer,
                ...(openIndex === index ? styles.answerOpen : {}),
                ...(answerClassName ? {} : {}),
              }}
              className={answerClassName}
            >
              <p style={styles.paragraph}>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
