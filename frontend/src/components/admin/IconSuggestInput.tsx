import { useState, useEffect, useRef, useMemo } from 'react'
import { Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Get ALL available icons from lucide-react dynamically
const getAllLucideIcons = (): string[] => {
  return Object.keys(LucideIcons).filter(
    (key) => 
      typeof LucideIcons[key as keyof typeof LucideIcons] === 'function' &&
      key !== 'createLucideIcon' &&
      key !== 'Icon' &&
      !key.startsWith('_') &&
      key[0] === key[0].toUpperCase() // Only export components (PascalCase)
  ) as string[]
}

// Popular Lucide React icons list (for initial suggestions)
const POPULAR_ICONS = [
  'Snowflake', 'Gift', 'Star', 'Flame', 'Heart', 'Sparkles', 'Zap', 'Trophy',
  'Award', 'Crown', 'Gem', 'Diamond', 'Fire', 'Sun', 'Moon', 'Cloud',
  'Rainbow', 'Leaf', 'Flower', 'Tree', 'Mountain', 'Wave', 'Droplet',
  'ShoppingCart', 'ShoppingBag', 'Package', 'Box', 'Tag', 'Percent',
  'DollarSign', 'TrendingUp', 'TrendingDown', 'ArrowUp', 'ArrowDown',
  'ArrowRight', 'ArrowLeft', 'Check', 'X', 'Plus', 'Minus', 'Circle',
  'Square', 'Triangle', 'Hexagon', 'Octagon', 'Bell', 'Mail', 'Phone',
  'MessageSquare', 'MessageCircle', 'Users', 'User', 'UserPlus', 'UserCheck',
  'Camera', 'Video', 'Image', 'Film', 'Music', 'Headphones', 'Speaker',
  'Play', 'Pause', 'SkipForward', 'SkipBack', 'Volume', 'Volume2',
  'Home', 'Building', 'Store', 'MapPin', 'Navigation', 'Compass',
  'Globe', 'World', 'Flag', 'Shield', 'Lock', 'Unlock', 'Key',
  'Eye', 'EyeOff', 'Search', 'Filter', 'Settings', 'Cog', 'Wrench',
  'Tool', 'Hammer', 'Screwdriver', 'Scissors', 'Pen',
  'Pencil', 'Edit', 'Trash', 'Trash2', 'Save', 'Download', 'Upload',
  'File', 'Folder', 'Archive', 'Book', 'BookOpen', 'Library', 'GraduationCap',
  'School', 'Briefcase', 'Calendar', 'Clock', 'Timer',
  'Watch', 'AlarmClock', 'Coffee', 'Utensils', 'Apple',
  'Carrot', 'Cherry', 'Cookie', 'IceCream', 'Pizza', 'Beer', 'Wine',
  'Gamepad', 'Gamepad2', 'Dice', 'Cards', 'Puzzle', 'Chess', 'Target',
  'Crosshair', 'Aim', 'Focus', 'Lightbulb', 'Lamp', 'Flashlight', 'Candle',
  'Rocket', 'Plane', 'Car', 'Bike', 'Ship', 'Train', 'Bus', 'Truck',
  'Activity', 'Pulse', 'Heartbeat', 'Thermometer', 'Wind',
  'CloudRain', 'CloudSnow', 'CloudLightning', 'Sunrise', 'Sunset',
  'Smile', 'Frown', 'Meh', 'Laugh', 'Angry', 'Surprise', 'ThumbsUp',
  'ThumbsDown', 'Hand', 'Handshake', 'Fist', 'Peace', 'Victory',
  'Clap', 'Point', 'Fingerprint', 'Scan', 'QrCode', 'Barcode',
  'CreditCard', 'Wallet', 'Banknote', 'Coins', 'PiggyBank', 'Receipt',
  'FileText', 'FileCheck', 'FileX', 'FilePlus', 'FileMinus', 'FileSearch',
  'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX', 'Database',
  'Server', 'HardDrive', 'Cpu', 'MemoryStick', 'Wifi', 'Bluetooth',
  'Radio', 'Signal', 'SignalHigh', 'SignalLow', 'SignalZero',
  'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Tv', 'Projector',
  'Printer', 'Scanner', 'Mouse', 'Keyboard', 'MousePointer', 'Touchpad',
  'Joystick', 'Headset', 'Microphone', 'Mic', 'MicOff',
  'VideoOff', 'CameraOff', 'Webcam', 'Satellite', 'SatelliteDish',
  'Router', 'Network', 'Share', 'Share2', 'Link', 'Link2', 'Unlink',
  'Copy', 'Paste', 'Cut', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy',
  'ClipboardList', 'ClipboardX', 'StickyNote', 'Note', 'Notebook',
  'Bookmark', 'BookmarkCheck', 'BookmarkPlus', 'BookmarkMinus',
  'Tags', 'Label', 'Badge', 'Medal', 'Ribbon', 'Certificate', 'Diploma',
  'Scroll', 'ScrollText', 'FileCode', 'Code', 'Brackets', 'Braces',
  'Terminal', 'Command', 'Power', 'Refresh', 'RefreshCw', 'RotateCw',
  'RotateCcw', 'Repeat', 'Repeat1', 'Shuffle', 'Shuffle2',
  'FastForward', 'Rewind', 'Maximize', 'Minimize', 'Maximize2',
  'Minimize2', 'Expand', 'Shrink', 'Move', 'MoveHorizontal', 'MoveVertical',
  'Move3d', 'Rotate', 'FlipHorizontal', 'FlipVertical', 'Flip', 'Flip2',
  'Crop', 'CropFree', 'CropRotate', 'Resize', 'ResizeHorizontal',
  'ResizeVertical', 'ZoomIn', 'ZoomOut', 'Zoom', 'Focus', 'Focus2',
  'Bullseye', 'Dart', 'BowArrow', 'Sword',
  'ShieldCheck', 'ShieldX', 'ShieldAlert', 'ShieldOff',
  'LockKeyhole', 'KeyRound', 'Fingerprint',
  'ScanLine', 'QrCode', 'Barcode', 'Nfc', 'Rfid',
  'WifiOff', 'Signal', 'SignalHigh', 'SignalLow', 'SignalZero',
  'Antenna', 'Tower', 'Broadcast',
  'Podcast', 'Rss', 'RssFeed', 'Megaphone', 'Bullhorn',
  'Volume1', 'VolumeX', 'VolumeOff', 'Mute',
  'Earbuds', 'Airpods', 'Mic2',
  'Filmstrip', 'Clapperboard', 'VideoIcon',
  'MonitorSpeaker', 'MonitorSmartphone',
  'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing',
  'PhoneMissed', 'PhoneOff', 'PhoneForwarded', 'Voicemail',
  'MessageDots', 'MessagePlus',
  'MessageMinus', 'MessageX', 'MessageCode', 'MessageQuestion',
  'MessageReply', 'MessageForward', 'MessageForwarded', 'MessageHeart',
  'MessageSmile', 'MessageLaugh', 'MessageAngry', 'MessageSad',
  'MessageWarning', 'MessageAlert', 'MessageInfo', 'MessageCheck',
  'MessageCheckmark', 'MessageCancel', 'MessageOff',
  'Chat', 'ChatBubble', 'ChatBubbleLeft', 'ChatBubbleRight', 'ChatBubbleTop',
  'Comments', 'Comment', 'CommentPlus', 'CommentMinus', 'CommentX',
  'CommentCheck', 'CommentQuestion', 'CommentAlert', 'CommentWarning',
  'CommentInfo', 'CommentHeart', 'CommentSmile', 'CommentLaugh',
  'CommentAngry', 'CommentSad', 'CommentOff', 'CommentsOff', 'ChatOff',
  'MailOpen', 'MailCheck', 'MailX', 'MailPlus',
  'MailMinus', 'MailQuestion', 'MailWarning', 'MailAlert', 'MailInfo',
  'MailHeart', 'MailSmile', 'MailLaugh',
  'MailAngry', 'MailSad',
  'MailForward', 'MailReply', 'MailReplyAll', 'MailForwarded',
  'Inbox', 'InboxFull', 'InboxEmpty', 'InboxCheck', 'InboxX', 'InboxPlus',
  'InboxMinus', 'InboxQuestion', 'InboxWarning', 'InboxAlert', 'InboxInfo',
  'InboxHeart', 'InboxSmile', 'InboxLaugh',
  'InboxAngry', 'InboxSad',
  'Send', 'SendHorizontal', 'SendVertical', 'SendToBack', 'SendToFront',
  'Paperclip', 'Attachment', 'Chain',
  'ChainBroken', 'ShareNetwork', 'Forward', 'Reply',
  'ReplyAll', 'CornerUpRight', 'CornerUpLeft', 'CornerDownRight',
  'CornerDownLeft', 'ArrowUpRight', 'ArrowUpLeft', 'ArrowDownRight', 'ArrowDownLeft',
  'ArrowUpCircle', 'ArrowDownCircle', 'ArrowLeftCircle', 'ArrowRightCircle',
  'ArrowUpSquare', 'ArrowDownSquare', 'ArrowLeftSquare', 'ArrowRightSquare',
  'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronsUp',
  'ChevronsDown', 'ChevronsLeft', 'ChevronsRight', 'ChevronUpDown',
  'ChevronLeftRight', 'ChevronFirst', 'ChevronLast', 'ChevronBack',
  'ChevronForward', 'ChevronBackward', 'DoubleChevronLeft',
  'DoubleChevronRight', 'DoubleChevronUp', 'DoubleChevronDown',
  'TriangleAlert', 'AlertTriangle',
  'AlertCircle', 'AlertOctagon', 'AlertHexagon', 'AlertSquare',
  'AlertDiamond', 'Info', 'HelpCircle', 'QuestionMark',
  'QuestionMarkCircle', 'CheckCircle', 'CheckCircle2', 'XCircle',
  'XCircle2', 'PlusCircle', 'MinusCircle', 'TimesCircle', 'DivideCircle',
  'CircleDot', 'CircleCheck', 'CircleX', 'CirclePlus',
  'CircleMinus', 'CircleAlert', 'CircleInfo', 'CircleHelp', 'CircleQuestion',
  'CircleWarning', 'CircleExclamation', 'CircleStop', 'CirclePlay',
  'CirclePause', 'CircleStop2', 'CirclePlay2', 'CirclePause2',
  'CircleRecord', 'CircleDot2', 'CircleDotBig', 'CircleDotSmall',
  'Dot', 'DotCircle', 'DotSquare', 'DotHexagon', 'DotOctagon',
  'SquareCheck', 'SquareX', 'SquarePlus', 'SquareMinus',
  'SquareAlert', 'SquareInfo', 'SquareHelp', 'SquareQuestion',
  'SquareWarning', 'SquareExclamation', 'SquareStop', 'SquarePlay',
  'SquarePause', 'SquareStop2', 'SquarePlay2', 'SquarePause2',
  'SquareRecord', 'SquareDot', 'SquareDot2', 'SquareDotBig',
  'SquareDotSmall', 'Rectangle', 'RectangleHorizontal', 'RectangleVertical',
  'RoundedRectangle', 'RoundedSquare', 'RoundedSquareCheck',
  'RoundedSquareX', 'RoundedSquarePlus', 'RoundedSquareMinus',
  'RoundedSquareAlert', 'RoundedSquareInfo', 'RoundedSquareHelp',
  'RoundedSquareQuestion', 'RoundedSquareWarning', 'RoundedSquareExclamation',
  'RoundedSquareStop', 'RoundedSquarePlay', 'RoundedSquarePause',
  'RoundedSquareStop2', 'RoundedSquarePlay2', 'RoundedSquarePause2',
  'RoundedSquareRecord', 'RoundedSquareDot', 'RoundedSquareDot2',
  'RoundedSquareDotBig', 'RoundedSquareDotSmall', 'Hexagon', 'Octagon',
  'Pentagon', 'Diamond2', 'Star2', 'Sparkle', 'Sparkle2',
  'Fire2', 'Droplets',
  'Water', 'Waves', 'Ocean', 'Sea', 'Lake', 'River', 'Stream',
  'Fountain', 'Sprinkler', 'Shower', 'Bath', 'BathTub', 'HotTub',
  'Pool', 'SwimmingPool', 'Beach', 'BeachUmbrella', 'Umbrella',
  'Umbrella2', 'Parasol', 'Sun2', 'Moon2', 'MoonStar', 'MoonStars', 'Stars',
  'Comet', 'Meteor', 'Asteroid', 'Planet',
  'Earth', 'Map', 'MapPinned', 'Compass2', 'Location', 'LocationPin', 'LocationDot',
  'LocationCrosshairs', 'LocationArrow', 'LocationCheck', 'LocationX',
  'LocationPlus', 'LocationMinus', 'LocationQuestion', 'LocationWarning',
  'LocationAlert', 'LocationInfo', 'LocationHeart', 'LocationSmile',
  'LocationLaugh', 'LocationAngry', 'LocationSad', 'LocationOff',
  'Flag2', 'FlagTriangle', 'FlagCheckered', 'FlagOff',
  'Banner', 'Banner2', 'Pennant', 'Pennant2', 'Streamer', 'Streamer2',
  'Ribbon2', 'Medal2', 'Trophy2', 'Award2',
  'Crown2', 'Tiara', 'Tiara2', 'Gem2'
]

// Remove duplicates and sort alphabetically
const POPULAR_ICONS_UNIQUE = Array.from(new Set(POPULAR_ICONS)).sort((a, b) => a.localeCompare(b))

interface IconSuggestInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function IconSuggestInput({
  value,
  onChange,
  placeholder = 'e.g. Snowflake, Gift, Star, Flame, Aim, Target',
  className = '',
}: IconSuggestInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredIcons, setFilteredIcons] = useState<string[]>([])
  const [notFoundMessage, setNotFoundMessage] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get all available icons from lucide-react
  const allAvailableIcons = useMemo(() => {
    const allIcons = getAllLucideIcons()
    // Combine with popular icons and remove duplicates
    const combined = Array.from(new Set([...POPULAR_ICONS_UNIQUE, ...allIcons]))
    return combined.sort((a, b) => a.localeCompare(b))
  }, [])

  // Helper function to normalize icon name
  const normalizeIconName = (name: string): string => {
    return name.toLowerCase().replace(/[-_\s]/g, '')
  }

  // Find similar icon names (fuzzy matching)
  const findSimilarIcons = (searchTerm: string, icons: string[], limit: number = 10): string[] => {
    const normalized = normalizeIconName(searchTerm)
    const matches: Array<{ icon: string; score: number }> = []

    icons.forEach((icon) => {
      const normalizedIcon = normalizeIconName(icon)
      let score = 0

      // Exact match
      if (normalizedIcon === normalized) {
        score = 100
      }
      // Starts with
      else if (normalizedIcon.startsWith(normalized)) {
        score = 80
      }
      // Contains
      else if (normalizedIcon.includes(normalized)) {
        score = 60
      }
      // Partial match (search term contains icon name or vice versa)
      else if (normalized.includes(normalizedIcon) || normalizedIcon.includes(normalized)) {
        score = 40
      }
      // Similar characters
      else {
        const similarity = calculateSimilarity(normalized, normalizedIcon)
        score = similarity * 30
      }

      if (score > 0) {
        matches.push({ icon, score })
      }
    })

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => m.icon)
  }

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.length === 0) return 1.0
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  // Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  useEffect(() => {
    if (value && value.trim()) {
      const searchTerm = value.trim()
      const normalized = normalizeIconName(searchTerm)
      
      // First try exact match
      const exactMatch = allAvailableIcons.find(
        (icon) => normalizeIconName(icon) === normalized
      )

      if (exactMatch) {
        setFilteredIcons([exactMatch])
        setShowSuggestions(true)
        setNotFoundMessage('')
      } else {
        // Try case-insensitive match
        const caseInsensitiveMatch = allAvailableIcons.find(
          (icon) => icon.toLowerCase() === searchTerm.toLowerCase()
        )

        if (caseInsensitiveMatch) {
          setFilteredIcons([caseInsensitiveMatch])
          setShowSuggestions(true)
          setNotFoundMessage('')
        } else {
          // Find similar icons
          const similar = findSimilarIcons(searchTerm, allAvailableIcons, 15)
          
          if (similar.length > 0) {
            setFilteredIcons(similar)
            setShowSuggestions(true)
            setNotFoundMessage(`"${searchTerm}" not found. Showing similar icons:`)
          } else {
            // No matches found - suggest searching on lucide.dev
            setFilteredIcons([])
            setShowSuggestions(false)
            setNotFoundMessage(`"${searchTerm}" not found in lucide-react. Search on https://lucide.dev/icons`)
          }
        }
      }
    } else {
      // Show popular icons when input is empty
      setFilteredIcons(POPULAR_ICONS_UNIQUE.slice(0, 20))
      setShowSuggestions(true)
      setNotFoundMessage('')
    }
  }, [value, allAvailableIcons])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (icon: string) => {
    onChange(icon)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pl-10 text-gray-900 dark:text-gray-100"
        />
      </div>
      {notFoundMessage && (
        <div className="absolute z-50 w-full mt-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">{notFoundMessage}</p>
          {value && value.trim() && (
            <a
              href={`https://lucide.dev/icons?search=${encodeURIComponent(value.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              🔍 Search "{value.trim()}" on Lucide Icons →
            </a>
          )}
        </div>
      )}
      {showSuggestions && filteredIcons.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {notFoundMessage && (
            <div className="px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              {notFoundMessage}
            </div>
          )}
          {filteredIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleSelect(icon)}
              className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm text-gray-900 dark:text-gray-100"
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
