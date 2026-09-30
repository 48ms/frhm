# attribution-funnel Specification

## Purpose
Melacak dan mengukur atribusi hasil bisnis konkret (inquiry WhatsApp dan direct message) yang dihasilkan dari setiap konten publikasi untuk membuktikan ROI jasa agensi kepada klien.

## Requirements

### Requirement: Per-Post Inquiry Attribution Tracking
The system SHALL record discrete counts of WhatsApp inquiries (`wa_inquiries`) and direct message inquiries (`dm_inquiries`) associated with each published post in `post_metrics`.

#### Scenario: Operator or client logs post conversion metrics
- **WHEN** metrics are entered manually, pasted via bulk format, or submitted via API for a post
- **THEN** the system stores integer values for `wa_inquiries` and `dm_inquiries` alongside reach and engagement figures

### Requirement: Attribution Funnel Visualization
The system SHALL display aggregate conversion metrics (total inquiries, cost per inquiry, conversion rate from reach) within the client analytics report and board.

#### Scenario: Client reviews monthly business performance
- **WHEN** viewing the performance report
- **THEN** an Attribution Funnel section displays total leads generated and the contribution of each creative asset
