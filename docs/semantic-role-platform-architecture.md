# Semantic Role — Pega Platform Architecture

This document captures the proposed architecture for introducing **Semantic Role** as a
first-class Pega Platform capability: a new rule type, a base-class mapping property, an
AI-assisted authoring flow in Blueprint, a new category of Data-Model-agnostic DX Components
("Semantic Templates"), and the runtime consumption of that mapping by both the rendering
engine and the AI Assistant.

Five diagrams are provided:

1. Container/Component overview (design time vs. runtime)
2. Sequence — Author a Data Model with semantic roles
3. Sequence — Compose a View using a Semantic Template
4. Sequence — Runtime AI Assistant answers a question about a record
5. Flow — Remap a role and regenerate views

A traceability table at the end maps each of the 8 source requirements back to the diagram(s)
and node(s) that represent it.

---

## Diagram 1 — Container/Component overview

```mermaid
graph TD
  subgraph DT["Design Time"]
    RSR["Rule-SemanticRole<br/>(Role Catalog: predefined + custom)"]
    BPA["Blueprint Authoring"]
    BPAI["Blueprint AI Assistant"]
    DM["Data-Model base class<br/>.pySemanticRoleMapping (PageList)"]
    STC["Rule-DX-Component<br/>(Semantic Template, config.json slots)"]
    VC["Rule-View / Rule-Section<br/>Composition"]
  end

  subgraph RT["Runtime"]
    INST["Case-/Data- instance"]
    RESV["Resolved View<br/>(slots bound to fields)"]
    UI["Runtime UI"]
    RAI["Runtime AI Assistant"]
    USER["End User"]
  end

  RSR -->|"(1) predefined + optional custom roles"| BPAI
  BPA -->|"(3) developer adds Case/Data/fields"| BPAI
  BPAI -->|"(3)(4) proposes / backfills mapping"| DM
  DM -->|"inherited by all Case/Data types"| INST

  STC -->|"(6) declares semantic-role slots + density"| VC
  DM -->|"(7) resolves slot -> field"| VC
  VC -->|"produces"| RESV
  RESV --> UI
  USER --> UI

  INST -->|"record data"| RAI
  DM -->|"(5) semantic mapping"| RAI
  USER -->|"asks question"| RAI
  RAI -->|"answer using title/subtitle/status roles"| USER

  DM -.->|"(8) mapping changed"| VC
```

---

## Diagram 2 — Sequence: Author a Data Model with semantic roles

```mermaid
sequenceDiagram
    actor Dev as LSA / Developer
    participant BPA as Blueprint Authoring
    participant BPAI as Blueprint AI Assistant
    participant RSR as Rule-SemanticRole (Role Catalog)
    participant DM as Data Model (.pySemanticRoleMapping)

    Dev->>BPA: Add field "Reference Code" to Data Object
    BPA->>BPAI: New field created
    BPAI->>RSR: Look up standard role catalog
    RSR-->>BPAI: identifier, title, subtitle, status, ...
    BPAI-->>Dev: Suggest role = "identifier" (confidence: high)
    Dev->>BPA: Accept suggestion (or edit role/rank)
    BPA->>DM: Append {field, role, rank} to PageList

    alt Backfill existing Data Model (no mapping yet)
        Dev->>BPAI: "Generate semantic mapping for this object"
        BPAI->>DM: Read existing fields/types
        BPAI->>RSR: Match each field to closest standard role
        BPAI-->>Dev: Proposed full mapping for review
        Dev->>DM: Approve -> persist full PageList
    end
```

---

## Diagram 3 — Sequence: Compose a View using a Semantic Template

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant VC as Rule-View / Rule-Section
    participant STC as Semantic Template (Rule-DX-Component)
    participant DM as Data Model (.pySemanticRoleMapping)

    Dev->>VC: Select "Semantic Template: Row" for this View
    VC->>STC: Read config.json (declared role slots + density)
    STC-->>VC: Slots = [title, subtitle, status, metric, people]
    VC->>DM: Resolve each slot's role against bound Data Model
    DM-->>VC: title -> "Client Name", status -> "Case Status", ...
    VC->>VC: Cache resolved slot -> field bindings
    VC-->>Dev: View renders using resolved bindings
```

---

## Diagram 4 — Sequence: Runtime AI Assistant answers a question about a record

```mermaid
sequenceDiagram
    actor User as End User
    participant RAI as Runtime AI Assistant
    participant DM as Data Model (.pySemanticRoleMapping)
    participant INST as Case-/Data- instance

    User->>RAI: "What's the status of this claim?"
    RAI->>INST: Load record data
    RAI->>DM: Load class-level semantic role mapping
    DM-->>RAI: title -> Claim Name, status -> Claim Status, ...
    RAI->>RAI: Compose answer prioritizing title/status/subtitle roles
    RAI-->>User: "Claim 'Jane Doe – Auto Collision' is currently In Review"
```

---

## Diagram 5 — Flow: Remap a role and regenerate views

```mermaid
flowchart TD
    A["Developer changes mapping:<br/>field X no longer owns role 'title';<br/>field Y now owns 'title'"]
    B["Update Data Model's<br/>.pySemanticRoleMapping"]
    C{"Any View/Section<br/>bound to a Semantic Template<br/>referencing this role?"}
    D["Flag View's cached<br/>slot binding as stale"]
    E["Regeneration process<br/>re-resolves slot -> field<br/>against new mapping"]
    F["View re-rendered / re-saved<br/>with updated binding"]
    G["No action needed"]

    A --> B --> C
    C -->|Yes| D --> E --> F
    C -->|No| G
```

---

## Traceability

| # | Requirement (from source description) | Diagram(s) / Node(s) |
|---|------------------------------------------|------------------------|
| 1 | SemanticRole is a new Rule Type in Pega Platform | Diagram 1 — `Rule-SemanticRole` node |
| 2 | Roles are predefined; customers can rarely define custom roles (only if they own a consuming template) | Diagram 1 — `Rule-SemanticRole` (Role Catalog: predefined + custom) |
| 3 | In Blueprint, semantic role mapped to fields when authoring Case/Data objects; Blueprint AI Assistant knows standard role-to-field mapping | Diagram 1 — `BPA`/`BPAI` edges; Diagram 2 — full sequence |
| 4 | Blueprint AI Assistant can also generate mapping for existing objects (default mapping), stored as a PageList on the Data Model base class | Diagram 2 — "Backfill existing Data Model" `alt` block; Diagram 1 — `DM` node |
| 5 | Runtime AI Assistant uses data-model + semantic mapping to respond using title/subtitle roles instead of random fields | Diagram 1 — `RAI` edges; Diagram 4 — full sequence |
| 6 | Runtime UI templates are Data-Model-agnostic DX Components ("Semantic Templates") whose config.json annotates semantic-role slots | Diagram 1 — `STC` node; Diagram 3 — config.json read step |
| 7 | View composition references a Semantic Template with slots sized by information density; resolves slot -> field via mapping | Diagram 1 — `STC -> VC -> DM` edges; Diagram 3 — full sequence |
| 8 | Changing the mapping (slot now points to a different field) triggers view regeneration | Diagram 1 — dashed `DM -.-> VC` edge; Diagram 5 — full flow |
