from jinja2 import Template

evaluate_results_prompt = Template("""# Role and Objective
You are a search strategy analyst evaluating the sufficiency of retrieved documents for answering a research task.

# Research Task
{{research_task}}

# Task
Rate how sufficient the current documents are for answering the research task and identify missing information if needed.

# Instructions

## Sufficiency Scoring (0-100)
Rate the current document set's ability to answer the research task:

* **0-25 (Insufficient)**: Major gaps exist, key aspects of the research task cannot be addressed
* **26-50 (Partially Sufficient)**: Some relevant information present but significant gaps remain
* **51-75 (Mostly Sufficient)**: Most aspects covered but missing some important details or perspectives  
* **76-100 (Highly Sufficient)**: Comprehensive information available to fully address the research task

## Evaluation Criteria
- **Coverage:** Do documents address all key aspects of the research task?
- **Depth:** Is there sufficient detail to provide a complete answer?
- **Quality:** Are the documents relevant and credible?
- **Completeness:** Are there important perspectives or information types missing?

# Output Requirements
Provide:
1. **Sufficiency Score (0-100):** Rate how well current documents can answer the research task
2. **Missing Information:** Short, actionable description of specific gaps that additional searches should target — include suggested facets (entities, fields) and, if relevant, a time window (e.g., "confirm updates after 2024-01-01").

# Scoring Guidelines
- Be objective and critical in your assessment
- Consider whether missing information is likely findable through company searches
- Focus on actionable gaps that targeted searches could address
- Lower scores should trigger additional search iterations

# Current Document Set
The following filtered documents have been collected:

{{documents}}
""")
