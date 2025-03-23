import React, { useState, useEffect } from "react";

interface IParseURL {
  url: string;
  favicon: string;
  title: string;
}

interface UrlCardProps {
  metadatas: IParseURL[];
}

interface IurlMetadata {
  favicon: string;
  title: string;
}

const UrlCardList: React.FC<UrlCardProps> = ({ metadatas }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [favicons, setFavicons] = useState<Record<string, IurlMetadata>>({});

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.startsWith("www.") ? domain.substring(4) : domain;
    } catch {
      return url;
    }
  };

  useEffect(() => {
    const getFavicons = async () => {
      const faviconMap: Record<string, IurlMetadata> = {};

      metadatas.forEach(({ favicon, title, url }) => {
        faviconMap[url] = { favicon, title };
      });

      setFavicons(faviconMap);
    };

    getFavicons();
  }, [metadatas]);

  return (
    <div className="url-grid-container">
      {metadatas.map((item, index) => (
        <a
          key={item.url}
          href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="url-card"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            transform: hoveredIndex === index ? "translateY(-5px)" : "none",
            boxShadow: hoveredIndex === index ? "0 10px 20px rgba(0, 0, 0, 0.5)" : "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="url-card-content">
            <div className="url-icon">
              {favicons[item.url] && <img src={favicons[item.url].favicon} alt="Site icon" className="favicon" />}
            </div>
            <div className="url-details">
              <h3 className="domain-name">{extractDomain(item.url)}</h3>
              <p className="full-url">{item.title}</p>
            </div>
            <div className="visit-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default UrlCardList;
