from typing import List, Optional
from fastapi import APIRouter, Query

from app.core.config import settings
from app.memory.hindsight_service import hindsight_service

router = APIRouter()


@router.get("/banks")
def get_memory_banks():
    """Returns status and record counts across all Hindsight memory banks."""
    return hindsight_service.get_bank_summary()


@router.get("/records")
def get_bank_records(bank: str = Query("opsmind-incidents")):
    """Returns actual retained memory records stored in the specified Hindsight bank."""
    records = hindsight_service._local_memory_store.get(bank, [])
    return {
        "bank": bank,
        "total_records": len(records),
        "records": [r.to_dict() for r in reversed(records)]
    }


@router.get("/recall")
def recall_memories(
    query: str = Query(...),
    bank: str = Query("opsmind-incidents"),
    top_k: int = Query(5, ge=1, le=20)
):
    """Execute hybrid 4-way search on a specific Hindsight memory bank."""
    hits = hindsight_service.recall(bank_id=bank, query=query, top_k=top_k)
    return {
        "bank": bank,
        "query": query,
        "total_hits": len(hits),
        "results": [h.to_dict() for h in hits]
    }


@router.get("/mental-models")
def get_mental_models():
    """Returns living service reliability profiles and standing mental models."""
    return {
        "payment-service": {
            "tier": "P1",
            "failure_profiles": [
                "High sensitivity to Redis maxmemory eviction policies under flash-sale traffic.",
                "Deadlock vulnerability on connection pool exhaustion."
            ],
            "verified_mitigations": [
                "Apply volatile-lru eviction policy.",
                "Scale connection pool to minimum 50 workers."
            ],
            "owner": "payments-reliability-team",
            "last_updated": "Refreshed via continuous retention"
        },
        "auth-service": {
            "tier": "P1",
            "failure_profiles": [
                "JWT signature verification latency spike during canary deployments."
            ],
            "verified_mitigations": [
                "Warm up public key cache before shifting production traffic."
            ],
            "owner": "security-infra-team",
            "last_updated": "Refreshed via continuous retention"
        }
    }
