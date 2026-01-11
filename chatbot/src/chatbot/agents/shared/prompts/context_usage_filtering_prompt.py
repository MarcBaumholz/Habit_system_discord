from jinja2 import Template

listwise_filter_context_used_prompt = Template(
    """# Task
Given an answer and {{contexts|length}} pieces of context, determine which contexts were used to generate the answer.

For each context, decide if that specific piece of context was used to answer the question or not. 
A context is considered "used" if information from it directly contributed to the answer.

You MUST include exactly {{contexts|length}} entries with indices [1] to [{{contexts|length}}].

## Output Format Example
For 3 contexts, your response should look like:
```json
{
  "used_contexts": [
    {"index": 1, "context_was_used": true},
    {"index": 2, "context_was_used": false},
    {"index": 3, "context_was_used": true}
  ]
}
```

#------------------------------------------------------------#
## Answer:

{{answer}}

#------------------------------------------------------------#
## Contexts to evaluate:

{% for context in contexts %}
**Context [{{loop.index}}]:**
{{context}}

---
{% endfor %}

Remember: Evaluate these {{contexts|length}} contexts using indices [1] to [{{contexts|length}}] exactly once each.
"""
)
