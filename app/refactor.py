import re

file_path = 'app/client/deliverables/[id]/page-client.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Avoid doing it twice
if 'useSuspenseQuery' not in content:
    content = content.replace(
        'import { useState, useEffect, useCallback } from \'react\'',
        'import { useState, useEffect, useCallback } from \'react\'\nimport { useSuspenseQuery, useQueryClient } from \'@tanstack/react-query\'\nimport { deliverableDetailQueryOptions, deliverableKeys } from \'@/features/deliverables/api/queries\''
    )
    content = content.replace(
        'export default function ClientDeliverableDetailPage() {',
        'export default function ClientDeliverableDetailPage({ deliverableId }: { deliverableId: string }) {'
    )
    content = content.replace(
        '  const params = useParams()\n  const deliverableId = params.id as string\n',
        ''
    )
    content = re.sub(
        r'  const \[deliverable, setDeliverable\] = useState<Deliverable \| null>\(null\)\n',
        '  const queryClient = useQueryClient()\n  const { data: deliverable } = useSuspenseQuery(deliverableDetailQueryOptions(deliverableId))\n',
        content
    )
    
    # Remove deliverable fetch from loadDeliverable
    content = re.sub(
        r'(const loadDeliverable = useCallback\(async \(\) => \{\n\s+setLoading\(true\)\n)(.*?)(    const \{ data: commentsData \})',
        r'\1\3',
        content,
        flags=re.DOTALL
    )
    
    # Mutations
    content = content.replace(
        'setDeliverable({ ...deliverable, status: \'approved\' })',
        'queryClient.invalidateQueries({ queryKey: deliverableKeys.detail(deliverableId) })'
    )
    content = content.replace(
        'setDeliverable({ ...deliverable, status: \'revision_requested\' })',
        'queryClient.invalidateQueries({ queryKey: deliverableKeys.detail(deliverableId) })'
    )

# Remove `if (loading)` blocks entirely
loading_pattern = r'  if \(loading\) \{\n    return \(\n      <div className=\"mx-auto w-full max-w-4xl\">\n        <Skeleton className=\"h-8 w-48 mb-6\" />\n        <div className=\"space-y-6\">\n          <Skeleton className=\"h-48 w-full\" />\n          <Skeleton className=\"h-32 w-full\" />\n        </div>\n      </div>\n    \)\n  \}\n\n'
content = re.sub(loading_pattern, '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
