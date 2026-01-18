"""
Service orchestrating the Design Experience session flow.
Persists partial step payloads and merges to underlying experiences.
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from supabase import Client
from app.core.database import get_service_client
from app.core.config import get_settings
from app.schemas.design_experience import (
    StepBasicsPayload,
    StepLogisticsPayload,
    StepMediaReorder,
    DesignSessionReview,
    ExperienceGenerationResponse,
    QAAnswer,
    ChatMessageRequest,
    ChatResponse,
    FieldSuggestionResponse,
)
from app.schemas.experience import ExperienceStatus


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DesignExperienceService:
    def __init__(self) -> None:
        self._db: Optional[Client] = None

    @property
    def _db_client(self) -> Client:
        """Lazy initialization of database client."""
        if self._db is None:
            self._db = get_service_client()
        return self._db

    def _sessions(self):
        return self._db_client.table("experience_design_sessions")

    async def start_session(self, host_id: str, experience_id: Optional[str]) -> Dict[str, Any]:
        now = _utcnow_iso()

        # If resuming, ensure session exists or create a new session referencing the experience
        if experience_id:
            existing = (
                self._sessions()
                .select("*")
                .eq("host_id", host_id)
                .eq("experience_id", experience_id)
                .limit(1)
                .execute()
            )
            if existing.data:
                return existing.data[0]

        # Otherwise create a fresh session; underlying experience will be created on submit
        record = {
            "host_id": host_id,
            "experience_id": experience_id or "",
            "step_completion": {"basics": False, "media": False, "logistics": False},
            "incomplete_fields": {},
            "autosave_version": 1,
            "last_saved_at": now,
            "created_at": now,
            "updated_at": now,
        }
        res = self._sessions().insert(record).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to start design session",
            )
        return res.data[0]

    async def upsert_basics(self, session_id: str, host_id: str, payload: StepBasicsPayload) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "basics_payload": payload.model_dump(exclude_none=True),
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def upsert_logistics(self, session_id: str, host_id: str, payload: StepLogisticsPayload) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "logistics_payload": payload.model_dump(exclude_none=True),
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def reorder_media(self, session_id: str, host_id: str, reorder: StepMediaReorder) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "media_order": reorder.order,
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def get_review(self, session_id: str, host_id: str) -> DesignSessionReview:
        res = self._sessions().select("*").eq("id", session_id).eq("host_id", host_id).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]

        # Construct a lightweight review payload from partials
        experience_preview: Dict[str, Any] = {}
        experience_preview.update(session.get("basics_payload") or {})
        experience_preview.update(session.get("logistics_payload") or {})

        photos: List[Dict[str, Any]] = session.get("photos_preview") or []
        validation_report = {
            "incomplete_fields": session.get("incomplete_fields") or {},
            "ready_for_submit": len((session.get("incomplete_fields") or {})) == 0,
        }
        return DesignSessionReview(
            experience=experience_preview,
            photos=photos,
            validation_report=validation_report,
        )

    async def submit(self, session_id: str, host_id: str) -> Dict[str, Any]:
        # Merge partials, validate, create/patch underlying experience, set SUBMITTED
        res = self._sessions().select("*").eq("id", session_id).eq("host_id", host_id).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]

        # Minimal validation — full validation can be added later
        basics = session.get("basics_payload") or {}
        logistics = session.get("logistics_payload") or {}
        required = ["title", "description", "domain", "duration_minutes", "traveler_max_capacity", "price_inr", "meeting_point"]
        missing = [f for f in required if not (basics.get(f) or logistics.get(f))]
        if missing:
            raise HTTPException(status_code=422, detail={"missing_fields": missing})

        # Create or update experience via service client
        exp_table = self._db.table("experiences")
        now = _utcnow_iso()
        if not session.get("experience_id"):
            # create draft
            record = {
                "host_id": host_id,
                "title": basics.get("title"),
                "promise": (basics.get("description") or "")[:200],
                "description": basics.get("description"),
                "unique_element": basics.get("what_to_expect") or "",
                "host_story": "",
                "experience_domain": basics.get("domain"),
                "experience_theme": basics.get("theme"),
                "country": "India",
                "city": "Mumbai",
                "neighborhood": logistics.get("neighborhood"),
                "meeting_landmark": (logistics.get("meeting_point") or "").split(",")[0] if logistics.get("meeting_point") else None,
                "meeting_point_details": logistics.get("meeting_point"),
                "duration_minutes": basics.get("duration_minutes"),
                "traveler_min_capacity": 1,
                "traveler_max_capacity": logistics.get("traveler_max_capacity"),
                "price_inr": logistics.get("price_inr"),
                "inclusions": ["Professional local guide"],
                "traveler_should_bring": logistics.get("what_to_bring") or [],
                "accessibility_notes": logistics.get("requirements") or [],
                "experience_safety_guidelines": logistics.get("safety_guidelines"),
                "status": ExperienceStatus.SUBMITTED.value,
                "created_at": now,
                "updated_at": now,
              }
            created = exp_table.insert(record).execute()
            if not created.data:
                raise HTTPException(status_code=500, detail="Failed to create experience")
            experience_id = created.data[0]["id"]
            self._sessions().update({"experience_id": experience_id, "updated_at": now}).eq("id", session_id).execute()
        else:
            experience_id = session["experience_id"]
            exp_table.update(
                {
                    "title": basics.get("title"),
                    "promise": (basics.get("description") or "")[:200],
                    "description": basics.get("description"),
                    "unique_element": basics.get("what_to_expect") or "",
                    "experience_domain": basics.get("domain"),
                    "experience_theme": basics.get("theme"),
                    "neighborhood": logistics.get("neighborhood"),
                    "meeting_landmark": (logistics.get("meeting_point") or "").split(",")[0] if logistics.get("meeting_point") else None,
                    "meeting_point_details": logistics.get("meeting_point"),
                    "duration_minutes": basics.get("duration_minutes"),
                    "traveler_max_capacity": logistics.get("traveler_max_capacity"),
                    "price_inr": logistics.get("price_inr"),
                    "status": ExperienceStatus.SUBMITTED.value,
                    "updated_at": now,
                }
            ).eq("id", experience_id).execute()

        return {"experience_id": experience_id, "status": "submitted"}

    async def generate_from_description(self, user_id: str, description: str) -> Dict[str, Any]:
        """
        Generate experience fields from a natural language description using LangChain + Groq.
        
        Args:
            user_id: User ID (for future use in personalization)
            description: Natural language description of the experience
            
        Returns:
            Dictionary with generated experience fields matching ExperienceGenerationResponse schema
        """
        settings = get_settings()
        
        # Check if Groq API key is configured
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service not configured. Please contact support."
            )
        
        try:
            import os
            from langchain_groq import ChatGroq
            from langchain_core.prompts import ChatPromptTemplate
            
            # Set Groq API key in environment if not already set (LangChain reads from env)
            if not os.getenv("GROQ_API_KEY") and settings.groq_api_key:
                os.environ["GROQ_API_KEY"] = settings.groq_api_key
            
            # Initialize Groq model
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2000,
            )
            
            # Create structured output chain using Pydantic schema
            structured_llm = llm.with_structured_output(ExperienceGenerationResponse)
            
            # Create prompt template
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert travel experience curator for Mayhouse, a platform for authentic, local experiences.

Your task is to analyze a user's description of a travel experience and generate structured data that will help them create a compelling experience listing.

Guidelines:
- Extract key information: location, activity type, duration, capacity, pricing
- Generate an engaging title (10-80 characters) that captures the essence
- Create a refined, detailed description (100-2000 characters) that expands on the user's input
- Identify the unique element ("what_to_expect") that makes this experience special
- Determine the appropriate domain: "culture", "adventure", "food", "nature", "wellness", "nightlife", or "other"
- Suggest a theme if applicable (e.g., "Local Markets & Heritage", "Street Food Tour", "Sunset Photography")
- Infer duration in minutes (typically 60-480 minutes, default to 180 if unclear)
- Suggest max_capacity (typically 1-4 travelers for intimate experiences)
- Extract neighborhood and meeting_point from the description if mentioned
- Generate relevant requirements (e.g., ["Age 18+", "Moderate fitness level"])
- Suggest what_to_bring items (e.g., ["Comfortable walking shoes", "Camera"])
- Provide important safety/contextual information in what_to_know

Be creative but realistic. Focus on authentic, local experiences that travelers would genuinely want to book."""),
                ("human", "Generate experience data from this description:\n\n{description}")
            ])
            
            # Create chain
            chain = prompt | structured_llm
            
            # Invoke the chain
            result = chain.invoke({"description": description})
            
            # Convert Pydantic model to dict
            return result.model_dump(exclude_none=False)
            
        except ImportError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI dependencies not installed: {str(e)}"
            )
        except Exception as e:
            # Log the error for debugging
            print(f"Error generating experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate experience: {str(e)}"
            )

    async def save_qa_answers(
        self, session_id: str, host_id: str, qa_answers: list[QAAnswer]
    ) -> Dict[str, Any]:
        """
        Save Q&A answers to a design session.
        
        Args:
            session_id: Design session ID
            host_id: Host user ID
            qa_answers: List of Q&A answers to save
            
        Returns:
            Updated session record
        """
        now = _utcnow_iso()
        
        # Convert Pydantic models to dicts for JSONB storage
        qa_answers_dict = [qa.model_dump(exclude_none=True) for qa in qa_answers]
        
        update = {
            "qa_answers": qa_answers_dict,
            "updated_at": now,
            "last_saved_at": now,
        }
        
        res = (
            self._sessions()
            .update(update)
            .eq("id", session_id)
            .eq("host_id", host_id)
            .execute()
        )
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return res.data[0]

    async def generate_from_qa(
        self, user_id: str, qa_answers: list[QAAnswer]
    ) -> Dict[str, Any]:
        """
        Generate experience fields from Q&A answers using LangChain + Groq.
        
        Args:
            user_id: User ID (for future use in personalization)
            qa_answers: List of Q&A answers from the guided flow
            
        Returns:
            Dictionary with generated experience fields matching ExperienceGenerationResponse schema
        """
        settings = get_settings()
        
        # Check if Groq API key is configured
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service not configured. Please contact support."
            )
        
        try:
            import os
            from langchain_groq import ChatGroq
            from langchain_core.prompts import ChatPromptTemplate
            
            # Set Groq API key in environment if not already set
            if not os.getenv("GROQ_API_KEY") and settings.groq_api_key:
                os.environ["GROQ_API_KEY"] = settings.groq_api_key
            
            # Initialize Groq model
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2000,
            )
            
            # Create structured output chain using Pydantic schema
            structured_llm = llm.with_structured_output(ExperienceGenerationResponse)
            
            # Build context from Q&A answers
            qa_context = "\n\n".join([
                f"Q{qa.question_id}: {qa.question_text}\nA: {qa.answer or (qa.structured_data if qa.structured_data else 'N/A')}"
                for qa in qa_answers
            ])
            
            # Create prompt template
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert travel experience curator for Mayhouse, a platform for authentic, local experiences.

Your task is to analyze Q&A answers from a host and generate structured data that will help them create a compelling experience listing.

Guidelines:
- Extract key information from the Q&A answers: location, activity type, duration, capacity, pricing
- Generate an engaging title (10-80 characters) that captures the essence
- Create a refined, detailed description (100-2000 characters) that expands on the host's answers
- Identify the unique element ("what_to_expect") that makes this experience special
- Determine the appropriate domain: "food", "culture", "art", "history", "nature", "nightlife", "photography", or "other"
- Suggest a theme if applicable (e.g., "Local Markets & Heritage", "Street Food Tour", "Sunset Photography")
- Infer duration in minutes (typically 60-480 minutes, default to 180 if unclear)
- Suggest max_capacity (typically 1-4 travelers for intimate experiences)
- Extract neighborhood and meeting_point from the answers
- Generate relevant requirements (e.g., ["Age 18+", "Moderate fitness level"])
- Suggest what_to_bring items (e.g., ["Comfortable walking shoes", "Camera"])
- Provide important safety/contextual information in what_to_know

Be creative but realistic. Focus on authentic, local experiences that travelers would genuinely want to book.
Use the Q&A answers as your primary source of information."""),
                ("human", "Generate experience data from these Q&A answers:\n\n{qa_context}")
            ])
            
            # Create chain
            chain = prompt | structured_llm
            
            # Invoke the chain
            result = chain.invoke({"qa_context": qa_context})
            
            # Convert Pydantic model to dict
            return result.model_dump(exclude_none=False)
            
        except ImportError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI dependencies not installed: {str(e)}"
            )
        except Exception as e:
            # Log the error for debugging
            print(f"Error generating experience from Q&A: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate experience from Q&A: {str(e)}"
            )

    def _assess_field_quality(self, field_name: str, value: Any) -> float:
        """Assess quality of a field value (0-1 score)."""
        if not value:
            return 0.0
        
        value_str = str(value).strip()
        
        # Field-specific quality checks
        if field_name == "title":
            length = len(value_str)
            if 20 <= length <= 80:
                return 1.0
            elif 10 <= length < 20 or 80 < length <= 200:
                return 0.7
            else:
                return 0.4
        
        if field_name == "description":
            word_count = len(value_str.split())
            if 150 <= word_count <= 300:
                return 1.0
            elif 100 <= word_count < 150 or 300 < word_count <= 500:
                return 0.8
            elif 50 <= word_count < 100:
                return 0.5
            else:
                return 0.3
        
        if field_name == "what_to_expect":
            length = len(value_str)
            if 50 <= length <= 300:
                return 1.0
            elif 30 <= length < 50 or 300 < length <= 500:
                return 0.7
            elif length > 0:
                return 0.4
            return 0.0
        
        # Default: field has value
        return 0.5

    def _validate_field(self, field_name: str, value: Any) -> List[str]:
        """Return list of validation issues for a field."""
        issues = []
        
        if not value:
            return ["Field is empty"]
        
        value_str = str(value).strip()
        
        if field_name == "title":
            if len(value_str) < 10:
                issues.append("Title is too short (minimum 10 characters)")
            if len(value_str) > 200:
                issues.append("Title is too long (maximum 200 characters)")
        
        if field_name == "description":
            if len(value_str) < 100:
                issues.append("Description is too short (minimum 100 characters)")
            if len(value_str) > 2000:
                issues.append("Description is too long (maximum 2000 characters)")
        
        if field_name == "what_to_expect":
            if len(value_str) < 30:
                issues.append("What to expect is too short (minimum 30 characters)")
            if len(value_str) > 500:
                issues.append("What to expect is too long (maximum 500 characters)")
        
        return issues

    def _calculate_completion(self, fields_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate completion metrics."""
        total_fields = len(fields_analysis)
        completed_fields = sum(1 for f in fields_analysis.values() if f.get("status") == "complete")
        high_quality_fields = sum(1 for f in fields_analysis.values() if f.get("quality_score", 0) >= 0.7)
        
        required_fields = ["title", "description", "price_inr"]
        missing_required = [
            name for name, f in fields_analysis.items() 
            if f.get("status") == "empty" and name in required_fields
        ]
        
        return {
            "percentage": (completed_fields / total_fields * 100) if total_fields > 0 else 0,
            "completed_count": completed_fields,
            "total_count": total_fields,
            "high_quality_count": high_quality_fields,
            "missing_required": missing_required,
        }

    def _identify_priority_fields(self, fields_analysis: Dict[str, Any]) -> List[str]:
        """Identify which fields should be prioritized next."""
        priority = []
        
        # Required fields first
        required = ["title", "description", "price_inr"]
        for field in required:
            if fields_analysis.get(field, {}).get("status") == "empty":
                priority.append(field)
        
        # Then fields that enhance the experience
        enhancement_fields = ["what_to_expect", "theme", "neighborhood"]
        for field in enhancement_fields:
            if fields_analysis.get(field, {}).get("status") == "empty":
                priority.append(field)
        
        return priority

    def _check_alignment(self, title: Optional[str], description: Optional[str]) -> str:
        """Check if title and description align well."""
        if not title or not description:
            return "unknown"
        
        title_lower = title.lower()
        desc_lower = description.lower()
        
        # Check if description expands on title
        title_words = set(title_lower.split())
        desc_words = set(desc_lower.split())
        
        # Count common words (excluding common stop words)
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
        title_words_clean = title_words - stop_words
        desc_words_clean = desc_words - stop_words
        
        if len(title_words_clean) == 0:
            return "unknown"
        
        common = len(title_words_clean & desc_words_clean)
        overlap_ratio = common / len(title_words_clean)
        
        if overlap_ratio >= 0.3:
            return "high"
        elif overlap_ratio >= 0.1:
            return "medium"
        else:
            return "low"

    def _calculate_price_duration_ratio(self, price: Optional[float], duration: Optional[int]) -> str:
        """Analyze pricing against duration."""
        if not price or not duration:
            return "unknown"
        
        # Price per hour
        hours = duration / 60.0
        price_per_hour = price / hours if hours > 0 else 0
        
        # Typical range: ₹500-₹2000 per hour for experiences
        if 500 <= price_per_hour <= 2000:
            return "reasonable"
        elif price_per_hour < 500:
            return "low"
        elif price_per_hour > 2000:
            return "high"
        return "unknown"

    def _classify_experience_type(self, basics: Dict[str, Any], logistics: Dict[str, Any]) -> str:
        """Classify experience based on domain, theme, content."""
        domain = basics.get("domain", "").lower()
        theme = basics.get("theme", "").lower()
        
        if domain:
            return domain
        if theme:
            return theme
        return "general"

    def _build_intelligent_form_context(
        self, session: Dict[str, Any], form_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build comprehensive context with field analysis, quality scores, completion metrics."""
        basics = session.get("basics_payload") or {}
        logistics = session.get("logistics_payload") or {}
        
        # Use form_state if provided, otherwise use session data
        if form_state:
            # Map form_state to basics/logistics structure
            basics = {
                "title": form_state.get("title"),
                "description": form_state.get("description"),
                "what_to_expect": form_state.get("whatToExpect"),
                "domain": form_state.get("domain"),
                "theme": form_state.get("theme"),
                "duration_minutes": form_state.get("duration_minutes") or form_state.get("duration"),
            }
            logistics = {
                "neighborhood": form_state.get("neighborhood"),
                "meeting_point": form_state.get("meeting_point") or form_state.get("meetingPoint"),
                "traveler_max_capacity": form_state.get("max_capacity") or form_state.get("maxCapacity"),
                "price_inr": form_state.get("price_inr") or (float(form_state.get("price")) if form_state.get("price") else None),
                "requirements": form_state.get("requirements"),
                "what_to_bring": form_state.get("what_to_bring") or form_state.get("whatToBring"),
            }
        
        # Build field-by-field analysis
        fields_analysis = {
            "title": {
                "value": basics.get("title") or "",
                "status": "complete" if basics.get("title") else "empty",
                "quality_score": self._assess_field_quality("title", basics.get("title")),
                "issues": self._validate_field("title", basics.get("title")),
                "suggestions_needed": not basics.get("title") or len(basics.get("title", "")) < 20,
            },
            "description": {
                "value": basics.get("description") or "",
                "status": "complete" if basics.get("description") else "empty",
                "quality_score": self._assess_field_quality("description", basics.get("description")),
                "issues": self._validate_field("description", basics.get("description")),
                "word_count": len(basics.get("description", "").split()) if basics.get("description") else 0,
                "suggestions_needed": not basics.get("description") or len(basics.get("description", "")) < 100,
            },
            "what_to_expect": {
                "value": basics.get("what_to_expect") or "",
                "status": "complete" if basics.get("what_to_expect") else "empty",
                "quality_score": self._assess_field_quality("what_to_expect", basics.get("what_to_expect")),
                "issues": self._validate_field("what_to_expect", basics.get("what_to_expect")),
                "suggestions_needed": not basics.get("what_to_expect"),
            },
            "domain": {
                "value": basics.get("domain") or "",
                "status": "complete" if basics.get("domain") else "empty",
                "quality_score": 1.0 if basics.get("domain") else 0.0,
                "issues": [],
                "suggestions_needed": not basics.get("domain"),
            },
            "theme": {
                "value": basics.get("theme") or "",
                "status": "complete" if basics.get("theme") else "empty",
                "quality_score": 1.0 if basics.get("theme") else 0.0,
                "issues": [],
                "suggestions_needed": False,
            },
            "duration_minutes": {
                "value": basics.get("duration_minutes") or "",
                "status": "complete" if basics.get("duration_minutes") else "empty",
                "quality_score": 1.0 if basics.get("duration_minutes") else 0.0,
                "issues": [],
                "suggestions_needed": not basics.get("duration_minutes"),
            },
            "price_inr": {
                "value": logistics.get("price_inr") or "",
                "status": "complete" if logistics.get("price_inr") else "empty",
                "quality_score": 1.0 if logistics.get("price_inr") else 0.0,
                "issues": [],
                "suggestions_needed": not logistics.get("price_inr"),
            },
            "max_capacity": {
                "value": logistics.get("traveler_max_capacity") or "",
                "status": "complete" if logistics.get("traveler_max_capacity") else "empty",
                "quality_score": 1.0 if logistics.get("traveler_max_capacity") else 0.0,
                "issues": [],
                "suggestions_needed": False,
            },
            "neighborhood": {
                "value": logistics.get("neighborhood") or "",
                "status": "complete" if logistics.get("neighborhood") else "empty",
                "quality_score": 1.0 if logistics.get("neighborhood") else 0.0,
                "issues": [],
                "suggestions_needed": not logistics.get("neighborhood"),
            },
            "meeting_point": {
                "value": logistics.get("meeting_point") or "",
                "status": "complete" if logistics.get("meeting_point") else "empty",
                "quality_score": 1.0 if logistics.get("meeting_point") else 0.0,
                "issues": [],
                "suggestions_needed": not logistics.get("meeting_point"),
            },
        }
        
        # Calculate overall completion
        completion = self._calculate_completion(fields_analysis)
        
        # Detect patterns
        patterns = {
            "has_location": bool(logistics.get("neighborhood") or logistics.get("meeting_point")),
            "has_pricing": bool(logistics.get("price_inr")),
            "has_schedule": bool(basics.get("duration_minutes")),
            "is_food_experience": basics.get("domain") == "food",
            "is_culture_experience": basics.get("domain") == "culture",
        }
        
        # Build context relationships
        relationships = {
            "title_description_alignment": self._check_alignment(
                basics.get("title"), 
                basics.get("description")
            ),
            "price_duration_ratio": self._calculate_price_duration_ratio(
                logistics.get("price_inr"),
                basics.get("duration_minutes")
            ),
        }
        
        return {
            "fields": fields_analysis,
            "completion": completion,
            "patterns": patterns,
            "relationships": relationships,
            "next_priority_fields": self._identify_priority_fields(fields_analysis),
            "validation_issues": self._collect_all_validation_issues(fields_analysis),
            "experience_type": self._classify_experience_type(basics, logistics),
        }

    def _collect_all_validation_issues(self, fields_analysis: Dict[str, Any]) -> List[str]:
        """Collect all validation issues from fields."""
        issues = []
        for field_info in fields_analysis.values():
            issues.extend(field_info.get("issues", []))
        return issues

    def _build_conversation_history(self, history: List[Dict[str, str]]) -> List:
        """Convert conversation history to LangChain messages."""
        from langchain_core.messages import HumanMessage, AIMessage
        
        messages = []
        for msg in history[-15:]:  # Limit to last 15 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
        return messages

    def _format_form_context(self, form_context: Dict[str, Any]) -> str:
        """Format form context as JSON string for prompt."""
        import json
        return json.dumps(form_context, indent=2)

    def _build_experience_aware_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build system prompt that makes AI truly understand the experience."""
        completion = context.get("completion", {})
        fields = context.get("fields", {})
        patterns = context.get("patterns", {})
        relationships = context.get("relationships", {})
        
        # Build field status summary
        field_status_lines = []
        for name, info in fields.items():
            status = info.get("status", "unknown")
            quality = info.get("quality_score", 0)
            field_status_lines.append(f"- {name}: {status} (quality: {quality:.1f})")
        field_status = "\n".join(field_status_lines)
        
        # Build current state summary
        current_state = f"""
EXPERIENCE STATE ANALYSIS:
- Completion: {completion.get('percentage', 0):.1f}% ({completion.get('completed_count', 0)}/{completion.get('total_count', 0)} fields)
- High Quality Fields: {completion.get('high_quality_count', 0)}
- Missing Required: {', '.join(completion.get('missing_required', [])) or 'None'}

FIELD STATUS:
{field_status}

PATTERNS DETECTED:
- Experience Type: {context.get('experience_type', 'Unknown')}
- Has Location: {patterns.get('has_location', False)}
- Has Pricing: {patterns.get('has_pricing', False)}
- Domain: {fields.get('domain', {}).get('value', 'Not set')}

RELATIONSHIPS:
- Title-Description Alignment: {relationships.get('title_description_alignment', 'Unknown')}
- Price-Duration Ratio: {relationships.get('price_duration_ratio', 'Unknown')}
"""
        
        return f"""You are an expert travel experience curator AI assistant for Mayhouse, a platform for authentic local experiences.

{current_state}

YOUR ROLE:
You are not just a chatbot - you are a **co-creator** helping build the best possible experience. You have deep knowledge of:
1. The current state of this specific experience (what's filled, what's missing, quality of each field)
2. Best practices for creating compelling travel experiences
3. How fields relate to each other (e.g., price should match duration and value)
4. What makes experiences successful on Mayhouse

INTELLIGENT CAPABILITIES:

1. **Proactive Assistance**:
   - Detect incomplete or low-quality fields and suggest improvements BEFORE user asks
   - Identify missing critical information (e.g., no meeting point for walking tour)
   - Suggest next steps based on completion status

2. **Context-Aware Generation**:
   - When generating content, use ALL available context (title, domain, theme, location)
   - Ensure generated content aligns with existing fields
   - Detect inconsistencies (e.g., food tour but description mentions culture)

3. **Quality Assessment**:
   - Evaluate current field values against best practices
   - Provide specific, actionable feedback
   - Suggest improvements with reasoning

4. **Relationship Understanding**:
   - Understand that price should match duration and experience type
   - Know that "what to expect" should align with description
   - Recognize that meeting point should match neighborhood

5. **Implicit Intent Recognition**:
   - "suggest something for what to expect" → Generate what_to_expect based on title/description/domain
   - "is my price good?" → Analyze price against duration, location, experience type
   - "what's missing?" → Identify incomplete required fields and suggest priorities

FIELD MAPPING (Understand synonyms and implicit references):
- "what to expect", "unique element", "promise", "highlight" → what_to_expect
- "description", "about", "overview" → description
- "title", "name", "headline" → title
- "price", "cost", "pricing" → price_inr
- "duration", "length", "how long" → duration_minutes
- "capacity", "group size" → max_capacity

RESPONSE STYLE:
- Be specific and actionable, not generic
- Reference the actual current values when making suggestions
- Explain WHY you're suggesting something (e.g., "Your title is good but could be more specific - here's why...")
- Proactively identify issues even if user doesn't ask
- Use the completion status to guide your suggestions

EXAMPLES OF SMART RESPONSES:

User: "suggest something for what to expect"
→ You see: title="Mumbai Street Food Tour", domain="food", description="Explore local street food..."
→ Response: "Based on your Mumbai Street Food Tour, here's a compelling 'what to expect': 'Taste authentic vada pav and pav bhaji at 5 hidden family-run stalls, learn stories from vendors, and discover the flavors that define Mumbai's street food culture.' This highlights the unique, specific experience travelers will have."

User: "is my price good?"
→ You see: price_inr=2000, duration_minutes=180, domain="food"
→ Response: "Your price of ₹2000 for a 3-hour food tour is reasonable. Similar experiences in Mumbai range from ₹1500-₹2500. However, consider: your description emphasizes 'hidden gems' and 'family-run stalls' which adds value - you could potentially price at ₹2200-₹2500 if you emphasize the exclusivity."

User: "what should I do next?"
→ You see: completion=45%, missing_required=["what_to_expect", "meeting_point"]
→ Response: "You're 45% complete! Here's what to prioritize: 1) Add 'What to Expect' - this is critical for travelers to understand the unique value. I can generate this based on your title and description. 2) Set a meeting point - travelers need to know where to start. Would you like me to help with either?"
"""

    async def chat(
        self,
        session_id: str,
        host_id: str,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        form_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Conversational chat endpoint for experience refinement.
        
        Args:
            session_id: Design session ID
            host_id: Host user ID (for authorization)
            message: User's chat message
            conversation_history: Previous messages in format [{"role": "user|assistant", "content": "..."}]
            form_context: Current form state
            
        Returns:
            Dictionary with response, suggestions, and metadata
        """
        settings = get_settings()
        
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service not configured"
            )
        
        try:
            # Verify session belongs to host
            session_res = self._sessions().select("*").eq("id", session_id).eq("host_id", host_id).limit(1).execute()
            if not session_res.data:
                raise HTTPException(status_code=404, detail="Session not found")
            
            session = session_res.data[0]
            
            # Build intelligent form context
            intelligent_context = self._build_intelligent_form_context(session, form_context)
            
            # Build conversation history
            history_messages = self._build_conversation_history(conversation_history or [])
            
            # Build system prompt with context
            system_prompt = self._build_experience_aware_system_prompt(intelligent_context)
            
            # Initialize LLM
            import os
            import json
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            from langchain_core.pydantic_v1 import BaseModel as PydanticBaseModel, Field as PydanticField
            
            if not os.getenv("GROQ_API_KEY") and settings.groq_api_key:
                os.environ["GROQ_API_KEY"] = settings.groq_api_key
            
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2000,
            )
            
            # Define structured output schema
            class FieldSuggestionModel(PydanticBaseModel):
                field: str = PydanticField(..., description="Form field name")
                current_value: Any = PydanticField(..., description="Current value")
                suggested_value: Any = PydanticField(..., description="Suggested value")
                reasoning: str = PydanticField(..., description="Reasoning for suggestion")
                confidence: float = PydanticField(..., ge=0, le=1, description="Confidence score")
                auto_apply_safe: bool = PydanticField(default=False, description="Safe to auto-apply")
                change_type: str = PydanticField(default="replace", description="replace, append, refine, generate")
            
            class ChatResponseModel(PydanticBaseModel):
                natural_response: str = PydanticField(..., description="Conversational answer")
                intent: str = PydanticField(..., description="READ, MODIFY, GENERATE, ADVICE, VALIDATE, NAVIGATION")
                detected_fields: List[str] = PydanticField(default_factory=list, description="Fields mentioned")
                suggestions: List[FieldSuggestionModel] = PydanticField(default_factory=list)
                validation_warnings: List[str] = PydanticField(default_factory=list)
                proactive_suggestions: List[str] = PydanticField(default_factory=list)
                confidence: float = PydanticField(ge=0, le=1, default=0.8)
                reasoning: Optional[str] = None
            
            # Create structured output chain
            structured_llm = llm.with_structured_output(ChatResponseModel)
            
            # Build prompt with context
            prompt_messages = [
                SystemMessage(content=system_prompt),
            ] + history_messages + [
                HumanMessage(content=f"User query: {message}\n\nCurrent form state:\n{self._format_form_context(intelligent_context)}")
            ]
            
            # Invoke chain
            result = structured_llm.invoke(prompt_messages)
            
            # Convert to dict for response
            response_dict = result.model_dump(exclude_none=True)
            
            # Ensure natural_response is always present
            if not response_dict.get("natural_response"):
                response_dict["natural_response"] = "I'm here to help you refine your experience. What would you like to work on?"
            
            return response_dict
            
        except Exception as e:
            # Log error for debugging
            print(f"Error in chat endpoint: {str(e)}")
            # Fallback to basic response
            return {
                "natural_response": "I'm temporarily having trouble processing that. Could you try rephrasing?",
                "intent": "ADVICE",
                "detected_fields": [],
                "suggestions": [],
                "validation_warnings": [],
                "proactive_suggestions": [],
                "confidence": 0.3,
                "reasoning": f"Error occurred: {str(e)}"
            }


design_experience_service = DesignExperienceService()


