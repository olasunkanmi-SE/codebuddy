#!/usr/bin/env python3
import sys

filepath = "src/services/news.service.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_start = "  // Human Side of Tech & Leadership"
old_end_marker = 'url: "https://lilianweng.github.io/index.xml",'

start_idx = content.index(old_start)
# Find the end marker and then the closing brace + comma after it
end_search_start = content.index(old_end_marker, start_idx)
# Find the closing "}," after the end marker
closing = content.index("},", end_search_start)
end_idx = closing + len("},")

old_section = content[start_idx:end_idx]
print("=== OLD SECTION ===")
print(old_section)
print("=== END OLD ===")

new_section = '  // Cloud & Infrastructure Engineering\n'
new_section += '  {\n'
new_section += '    name: "Cloudflare Blog",\n'
new_section += '    url: "https://blog.cloudflare.com/rss/",\n'
new_section += '  },\n'
new_section += '  // Human Side of Tech & Leadership\n'
new_section += '  {\n'
new_section += '    name: "The Engineering Manager",\n'
new_section += '    url: "https://theengineeringmanager.com/feed/",\n'
new_section += '  },\n'
new_section += '  { name: "Rands in Repose", url: "https://randsinrepose.com/feed/" },\n'
new_section += '  {\n'
new_section += '    name: "Irrational Exuberance (Will Larson)",\n'
new_section += '    url: "https://lethain.com/feeds.xml",\n'
new_section += '  },\n'
new_section += '  { name: "LeadDev", url: "https://leaddev.com/feed" },\n'
new_section += '  { name: "StaffEng", url: "https://staffeng.com/rss" },\n'
new_section += '  {\n'
new_section += '    name: "Charity Majors (CTO Craft)",\n'
new_section += '    url: "https://charity.wtf/feed/",\n'
new_section += '  },\n'
new_section += '  // Substack & Independent - Architecture & Leadership\n'
new_section += '  {\n'
new_section += '    name: "The Pragmatic Engineer",\n'
new_section += '    url: "https://newsletter.pragmaticengineer.com/feed",\n'
new_section += '  },\n'
new_section += '  { name: "ByteByteGo System Design", url: "https://blog.bytebytego.com/feed" },\n'
new_section += '  { name: "Refactoring (Luca Rossi)", url: "https://refactoring.fm/feed" },\n'
new_section += '  {\n'
new_section += '    name: "Tidy First? (Kent Beck)",\n'
new_section += '    url: "https://tidyfirst.substack.com/feed",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "The Beautiful Mess (John Cutler)",\n'
new_section += '    url: "https://cutlefish.substack.com/feed",\n'
new_section += '  },\n'
new_section += '  { name: "Martin Fowler", url: "https://martinfowler.com/feed.atom" },\n'
new_section += '  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/" },\n'
new_section += '  // System Design & Architecture\n'
new_section += '  {\n'
new_section += '    name: "High Scalability",\n'
new_section += '    url: "https://highscalability.com/feed/",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "InfoQ",\n'
new_section += '    url: "https://feed.infoq.com/",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "The New Stack",\n'
new_section += '    url: "https://thenewstack.io/feed/",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "Architecture Notes",\n'
new_section += '    url: "https://architecturenotes.co/rss/",\n'
new_section += '  },\n'
new_section += '  // AI Agents, LLMs & Research\n'
new_section += '  { name: "Google Research", url: "https://research.google/blog/rss" },\n'
new_section += '  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },\n'
new_section += '  {\n'
new_section += '    name: "BAIR (Berkeley AI)",\n'
new_section += '    url: "https://bair.berkeley.edu/blog/feed.xml",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += "    name: \"Lil'Log (Lilian Weng)\",\n"
new_section += '    url: "https://lilianweng.github.io/index.xml",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "Anthropic Research",\n'
new_section += '    url: "https://www.anthropic.com/research/rss.xml",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "DeepMind Blog",\n'
new_section += '    url: "https://deepmind.google/blog/rss.xml",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "Meta AI Blog",\n'
new_section += '    url: "https://ai.meta.com/blog/rss/",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += '    name: "AI Snake Oil",\n'
new_section += '    url: "https://www.aisnakeoil.com/feed",\n'
new_section += '  },\n'
new_section += '  {\n'
new_section += "    name: \"Simon Willison's Weblog\",\n"
new_section += '    url: "https://simonwillison.net/atom/everything/",\n'
new_section += '  },'

content = content[:start_idx] + new_section + content[end_idx:]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done! Feeds updated successfully.")
