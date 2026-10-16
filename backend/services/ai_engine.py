from __future__ import annotations

import json
import os
import re
from typing import Any


class VerityEngine:
    """Uses OpenAI when configured, otherwise performs conservative local matching."""

    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("VERITY_MODEL", "gpt-4o-mini")

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key)

    def _chat(self, system: str, user: str) -> str:
        from openai import OpenAI
        response = OpenAI(api_key=self.api_key).chat.completions.create(
            model=self.model, temperature=0, response_format={"type": "json_object"},
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
        return response.choices[0].message.content or "{}"

    def extract_claims(self, report_text: str) -> list[str]:
        if self.has_api_key:
            payload = self._chat(
                "Extract concrete, checkable factual assertions from the report. Exclude opinions, recommendations, headings, and questions. Return JSON with a claims array of strings. Do not invent claims.",
                report_text[:60_000],
            )
            claims = json.loads(payload).get("claims", [])
            return [str(item).strip() for item in claims if str(item).strip()][:40]
        sentences = re.split(r"(?<=[.!?])\s+|\n+", report_text)
        candidates = [re.sub(r"\s+", " ", sentence).strip(" •\t") for sentence in sentences]
        return [sentence for sentence in candidates if len(sentence.split()) >= 6 and re.search(r"\d|\b(is|are|was|were|has|have|will|increased|reduced|reported|reached)\b", sentence, re.I)][:40]

    def verify_claim(self, claim: str, references: list[dict[str, str]]) -> dict[str, Any]:
        if self.has_api_key:
            evidence = "\n\n".join(f"SOURCE: {doc['filename']}\n{doc['text'][:18_000]}" for doc in references)
            payload = self._chat(
                "Verify the claim only against the provided sources. Return JSON keys verdict (SUPPORTED, CONTRADICTED, or UNVERIFIABLE), explanation, evidence_quote, source_doc, page. A contradiction requires direct evidence for an incompatible fact; missing evidence is UNVERIFIABLE. Quotes must be exact substrings of a source. If no quote supports the verdict, use null and UNVERIFIABLE.",
                f"CLAIM:\n{claim}\n\nSOURCES:\n{evidence[:55_000]}",
            )
            result = json.loads(payload)
            verdict = str(result.get("verdict", "UNVERIFIABLE")).upper()
            if verdict not in {"SUPPORTED", "CONTRADICTED", "UNVERIFIABLE"}:
                verdict = "UNVERIFIABLE"
            quote = result.get("evidence_quote")
            joined_sources = "\n".join(doc["text"] for doc in references)
            if quote and quote not in joined_sources:
                quote, verdict = None, "UNVERIFIABLE"
            return {"text": claim, "verdict": verdict, "explanation": str(result.get("explanation", "No explanation was returned.")), "evidence_quote": quote, "source_doc": result.get("source_doc") if quote else None, "page": result.get("page") if quote else None}

        stop_words = {"the", "and", "for", "with", "from", "that", "this", "was", "were", "are", "has", "have", "had", "its", "into", "than", "then", "they", "their", "our", "in", "on", "at", "by", "to", "of", "a", "an", "is"}
        tokens = re.findall(r"[a-z0-9%$]+", claim.lower())
        terms = {word for word in tokens if len(word) > 2 and word not in stop_words}
        best: tuple[float, str, str] = (0.0, "", "")
        for doc in references:
            for passage in re.split(r"(?<=[.!?])\s+|\n+", doc["text"]):
                passage_terms = {word for word in re.findall(r"[a-z0-9%$]+", passage.lower()) if len(word) > 2 and word not in stop_words}
                score = len(terms & passage_terms) / max(len(terms), 1)
                if score > best[0]:
                    best = (score, passage.strip(), doc["filename"])
        claim_numbers = set(re.findall(r"\b\d+(?:\.\d+)?%?\b", claim))
        source_numbers = set(re.findall(r"\b\d+(?:\.\d+)?%?\b", best[1]))
        claim_negated = bool(re.search(r"\b(no|not|never|without|declined|decreased|fell|failed)\b", claim, re.I))
        source_negated = bool(re.search(r"\b(no|not|never|without|declined|decreased|fell|failed)\b", best[1], re.I))
        if best[0] >= 0.55 and best[1] and ((claim_numbers and source_numbers and claim_numbers.isdisjoint(source_numbers)) or claim_negated != source_negated):
            verdict, explanation, quote, source = "CONTRADICTED", "Local matching found overlapping subject terms but a conflicting number or polarity. Confirm this apparent conflict in context.", best[1], best[2]
        elif best[0] >= 0.65 and best[1]:
            verdict, explanation, quote, source = "SUPPORTED", "Local keyword matching found a passage with substantial term overlap. Review the source before relying on this result.", best[1], best[2]
        else:
            verdict, explanation, quote, source = "UNVERIFIABLE", "Local matching did not find strong evidence. This does not mean the claim is false.", None, None
        return {"text": claim, "verdict": verdict, "explanation": explanation, "evidence_quote": quote, "source_doc": source, "page": None}
