from app.models import Scheme, SchemeChunk

class SchemeChunkerService:
    """
    Converts structured Scheme ORM instances into rich, search-optimized text chunks.
    """

    @staticmethod
    def create_chunks_for_scheme(scheme: Scheme) -> list[SchemeChunk]:
        chunks: list[SchemeChunk] = []

        # 1. General Metadata Chunk
        meta_content = (
            f"Scheme Name: {scheme.name}\n"
            f"Description: {scheme.short_description}\n"
            f"Government Level: {scheme.government_level.value if hasattr(scheme.government_level, 'value') else scheme.government_level}\n"
            f"Ministry: {scheme.administering_ministry or 'N/A'}"
        )
        chunks.append(SchemeChunk(
            scheme_id=scheme.id,
            chunk_type="METADATA",
            title=f"{scheme.name} - Metadata",
            content=meta_content,
            metadata_json={"scheme_id": scheme.id, "status": str(scheme.status.value if hasattr(scheme.status, 'value') else scheme.status)}
        ))

        # 2. Eligibility Rules Chunk
        if scheme.rule_groups:
            rule_texts = []
            for grp in scheme.rule_groups:
                for r in grp.rules:
                    rule_texts.append(f"Requires {r.parameter_name} {r.operator} {r.comparison_value}")
            elig_content = f"Eligibility requirements for {scheme.name}:\n" + "\n".join(rule_texts)
            chunks.append(SchemeChunk(
                scheme_id=scheme.id,
                chunk_type="ELIGIBILITY",
                title=f"{scheme.name} - Eligibility",
                content=elig_content,
                metadata_json={"scheme_id": scheme.id}
            ))

        # 3. Benefits Chunk
        if scheme.benefits:
            benefit_texts = [f"{b.title}: {b.description or ''} (Amount: {b.amount_financial_benefit or 'N/A'})" for b in scheme.benefits]
            benefit_content = f"Benefits of {scheme.name}:\n" + "\n".join(benefit_texts)
            chunks.append(SchemeChunk(
                scheme_id=scheme.id,
                chunk_type="BENEFITS",
                title=f"{scheme.name} - Benefits",
                content=benefit_content,
                metadata_json={"scheme_id": scheme.id}
            ))

        # 4. Documents Chunk
        if scheme.documents:
            doc_texts = [f"{d.document.name if d.document else 'Document'} (Mandatory: {d.mandatory})" for d in scheme.documents]
            doc_content = f"Required documents for {scheme.name}:\n" + "\n".join(doc_texts)
            chunks.append(SchemeChunk(
                scheme_id=scheme.id,
                chunk_type="DOCUMENTS",
                title=f"{scheme.name} - Documents",
                content=doc_content,
                metadata_json={"scheme_id": scheme.id}
            ))

        # 5. Application Process Chunk
        if scheme.application_process:
            ap = scheme.application_process
            step_texts = [f"Step {st.step_number}: {st.title} - {st.instructions}" for st in ap.steps]
            app_content = f"Application procedure for {scheme.name} (Mode: {ap.application_mode}):\nPortal: {ap.official_application_url or 'N/A'}\n" + "\n".join(step_texts)
            chunks.append(SchemeChunk(
                scheme_id=scheme.id,
                chunk_type="APPLICATION",
                title=f"{scheme.name} - Application Procedure",
                content=app_content,
                metadata_json={"scheme_id": scheme.id}
            ))

        return chunks
