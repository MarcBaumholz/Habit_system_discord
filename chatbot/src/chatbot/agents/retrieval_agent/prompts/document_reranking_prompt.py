from jinja2 import Template

listwise_rerank_prompt = Template("""# Listwise Document Reranking

## Role
You are a support agent tasked with ranking multiple documents by their relevance to answer a client's question. Compare all documents relative to each other and rank them from most to least relevant.

## Task
Rank ALL provided documents from most to least relevant. You MUST include exactly {{ documents|length }} entries with indices [1] to [{{ documents|length }}].

## Output Format Example (JSON)
{
  "ranked_documents": [
    {"index": 2, "content_relevance": 85, "metadata_relevance": 90},
    {"index": 1, "content_relevance": 75, "metadata_relevance": 80},
    {"index": 3, "content_relevance": 60, "metadata_relevance": 70}
  ]
}

---

## Ranking Criteria

### 1. Content Relevance (0-100)
How well does each document help answer the given question relative to the other documents?

* 0-25 (Irrelevant): Does not relate to the question or is placeholder/generic
* 26-50 (Somewhat Relevant): Tangentially related but lacks direct information
* 51-75 (Relevant): Provides useful information but may lack depth or completeness
* 76-100 (Highly Relevant): Directly helps answer the question with clear, actionable information

### 2. Metadata Alignment (0-100)
How well does the metadata support the document's credibility and relevance relative to other documents?

* 0-25 (Poor): Metadata inconsistent with question
* 26-50 (Fair): Minimally aligned metadata with gaps
* 51-75 (Good): Well-aligned metadata enhancing understanding
* 76-100 (Excellent): Highly aligned metadata providing strong credibility

---

## Instructions
* Rank documents by comparing them against each other, not in isolation
* You MUST include exactly one entry for each document using indices [1] to [{{ documents|length }}]
* Each index must appear exactly once in your response
* Consider both content quality and metadata when ranking
* Focus on which documents would be most helpful for answering the research task
* Be aware that company-specific names/events may be relevant
* If two documents are near-duplicates, rank the newer Last Modified higher and push the duplicate lower.
* For ties, prefer higher Metadata Alignment; if still tied, prefer the more recent Last Modified.
* Respond with JSON only (no backticks, no extra text).

---

{% if company_info.company_description %}
## Company Context & Information
{{company_info.company_description}}
{% endif %}

## Research Task
{{research_task}}

## Search Query Used
"{{search_query}}"

##Current Datetime:
{{datetime}}

## Documents to Rank

{% for doc in documents %}
**Document [{{loop.index}}]:**
Title: {{doc.metadata.title or "No title"}}
Source: {{doc.metadata.source or "Unknown"}}
Last Modified: {{doc.metadata.last_edited_time or "Unknown"}}
Retriever Score: {{doc.metadata.retriever_score or "N/A"}}

Content:
{{doc.page_content}}

---

{% endfor %}

Remember: Rank these {{ documents|length }} documents using indices [1] to [{{ documents|length }}] exactly once each.
""")
