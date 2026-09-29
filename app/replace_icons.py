import os
import re

MAPPING = {
    'AlertCircle': 'alertCircle',
    'AlertTriangle': 'warning',
    'AlignJustify': 'dots',
    'ArrowDown': 'chevronDown',
    'ArrowRight': 'arrowRight',
    'ArrowRightIcon': 'arrowRight',
    'ArrowUp': 'chevronUp',
    'ArrowUpRightIcon': 'arrowUpRight',
    'Award': 'badgeCheck',
    'BarChart3': 'barChart',
    'BellIcon': 'notification',
    'BellOffIcon': 'notification',
    'BookOpen': 'bookOpen',
    'Bookmark': 'tag',
    'Bug': 'alertCircle',
    'Building2Icon': 'building2',
    'Calendar': 'calendar',
    'CalendarClock': 'calendar',
    'CalendarIcon': 'calendar',
    'ChartColumnIcon': 'barChart',
    'ChartNoAxesColumn': 'barChart',
    'Check': 'check',
    'CheckCheck': 'checks',
    'CheckCircle2': 'circleCheck',
    'CheckCircle2Icon': 'circleCheck',
    'CheckIcon': 'check',
    'ChevronDownIcon': 'chevronDown',
    'ChevronLeft': 'chevronLeft',
    'ChevronRight': 'chevronRight',
    'ChevronRightIcon': 'chevronRight',
    'ChevronUp': 'chevronUp',
    'ChevronUpIcon': 'chevronUp',
    'ChevronsRight': 'chevronsRight',
    'ChevronsUpDownIcon': 'chevronsUpDown',
    'CircleCheck': 'circleCheck',
    'CircleCheckIcon': 'circleCheck',
    'CircleDashed': 'circleDashed',
    'CircleDashedIcon': 'circleDashed',
    'CircleHelp': 'help',
    'CircleIcon': 'circle',
    'CircleX': 'circleX',
    'ClapperboardIcon': 'clapperboard',
    'Clock': 'clock',
    'Clock5': 'clock',
    'Code2': 'code',
    'Copy': 'copy',
    'CornerDownLeft': 'arrowLeft',
    'CreditCard': 'creditCard',
    'Crown': 'pro',
    'DollarSignIcon': 'banknote',
    'DoorOpen': 'logout',
    'Download': 'download',
    'DownloadIcon': 'download',
    'EditIcon': 'edit',
    'ExternalLink': 'externalLink',
    'ExternalLinkIcon': 'externalLink',
    'FileIcon': 'page',
    'FileText': 'post',
    'FileTextIcon': 'post',
    'FilterIcon': 'adjustments',
    'Flame': 'flame',
    'FolderIcon': 'workspace',
    'Globe': 'link',
    'Grid3X3': 'dashboard',
    'GripVertical': 'gripVertical',
    'Handshake': 'teams',
    'Headphones': 'phone',
    'InboxIcon': 'inbox',
    'Kanban': 'kanban',
    'Laptop': 'laptop',
    'LayoutTemplate': 'dashboard',
    'LineChart': 'trendingUp',
    'Link': 'link',
    'List': 'forms',
    'ListChecksIcon': 'listChecks',
    'Loader2': 'spinner',
    'Loader2Icon': 'spinner',
    'LoaderIcon': 'spinner',
    'LogOut': 'logout',
    'Mail': 'mail',
    'MapPin': 'mapPin',
    'MessageCircle': 'chat',
    'MessageSquare': 'messageSquare',
    'MessagesSquare': 'chat',
    'Minus': 'minus',
    'Moon': 'moon',
    'MoreHorizontalIcon': 'moreHorizontal',
    'MousePointerClick': 'mousePointer',
    'MousePointerClickIcon': 'mousePointer',
    'MoveRight': 'arrowRight',
    'Palette': 'palette',
    'PanelLeftIcon': 'panelLeft',
    'Paperclip': 'paperclip',
    'PenLineIcon': 'pencil',
    'PencilIcon': 'pencil',
    'PhoneCall': 'phone',
    'PlayIcon': 'play',
    'Plus': 'add',
    'PlusIcon': 'add',
    'ReceiptIcon': 'forms',
    'RefreshCw': 'refresh',
    'RefreshCwIcon': 'refresh',
    'RotateCcwIcon': 'refresh',
    'Save': 'save',
    'ScanSearch': 'search',
    'Search': 'search',
    'SearchIcon': 'search',
    'SearchX': 'search',
    'Send': 'send',
    'SendIcon': 'send',
    'Server': 'layers',
    'Settings': 'settings',
    'Settings2Icon': 'settings',
    'Share2': 'share',
    'ShieldAlert': 'shield',
    'ShieldCheck': 'shield',
    'ShieldCheckIcon': 'shield',
    'Sparkles': 'sparkles',
    'SplitSquareHorizontal': 'kanban',
    'Star': 'exclusive',
    'Sun': 'sun',
    'Target': 'activity',
    'TargetIcon': 'activity',
    'ThumbsDown': 'trendingDown',
    'ThumbsUp': 'trendingUp',
    'Trash2': 'trash',
    'Trash2Icon': 'trash',
    'TrashIcon': 'trash',
    'TrendingUp': 'trendingUp',
    'TrendingUpIcon': 'trendingUp',
    'TriangleAlert': 'warning',
    'Upload': 'upload',
    'UserCheck': 'userCheck',
    'User': 'profile',
    'Video': 'video',
    'WalletIcon': 'billing',
    'Workflow': 'workflow',
    'X': 'close',
    'XCircle': 'xCircle',
    'XIcon': 'close',
    'Zap': 'sparkles'
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the lucide-react import
    lucide_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"]', re.DOTALL)
    match = lucide_pattern.search(content)
    if not match:
        return

    imported_icons = match.group(1)
    
    # Check if we already import Icons
    has_icons_import = "import { Icons }" in content
    
    if has_icons_import:
        # Just remove lucide-react import
        content = lucide_pattern.sub('', content)
    else:
        # Replace with @/components/icons
        content = lucide_pattern.sub('import { Icons } from \'@/components/icons\'', content)

    # For each icon in mapping, replace its usages
    for lucide_icon, our_icon in MAPPING.items():
        # Tag usages: <IconName ...
        content = re.sub(rf'<{lucide_icon}([\s>])', rf'<Icons.{our_icon}\1', content)
        # Type usages or references: IconName -> Icons.our_icon
        # But wait, we might have aliased imports like `Loader2 as Spinner`
        # We handle standard usages.
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            replace_in_file(os.path.join(root, file))

print("Replacement complete.")
