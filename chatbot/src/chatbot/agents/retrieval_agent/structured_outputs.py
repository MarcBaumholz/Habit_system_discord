from pydantic import BaseModel, Field


class DocumentRanking(BaseModel):
    """Represents a ranked document with its relevance scores."""

    index: int = Field(description="Index of the document in the original list (1-based)")
    content_relevance: int = Field(description="How well does the context help answer the given question (0-100)")
    metadata_relevance: int = Field(description="Does the metadata align with the question and enhance credibility (0-100)")


class ListwiseRanking(BaseModel):
    """Listwise ranking of documents in order of relevance."""

    ranked_documents: list[DocumentRanking] = Field(description="Documents ranked by relevance, most relevant first. MUST include exactly one entry for each input document, with indices 1 to N.")


class ResultsEvaluation(BaseModel):
    """Evaluates if the search results sufficiently answer the research task."""

    sufficiency_score: int = Field(description="How sufficient are the current documents to answer the research task (0-100)")
    missing_information: str = Field(description="Description of what information might be missing to properly answer the research task")
