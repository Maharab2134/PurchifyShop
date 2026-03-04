import { useEffect, useState } from 'react'
import ProductCard from '@/components/product/ProductCard'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MainLayout from '@/components/templates/MainLayout'
import { categoriesApi, type Category } from '@/api/categories'
import { subcategoriesApi, type Subcategory } from '@/api/subcategories'
import { productsApi, type Product } from '@/api/products'
import { getRecentProducts } from '@/utils/recentProducts'
import { buildCategoryImageAlt } from '@/utils/seo'
import {
  Smartphone,
  Monitor,
  Headphones,
  Watch,
  Camera,
  Gamepad2,
  Laptop,
  Tablet,
  Speaker,
  Keyboard,
  Mouse,
  Printer,
  Router,
  HardDrive,
  MemoryStick,
  Cpu,
  MonitorSmartphone,
  SmartphoneCharging,
  Wifi,
  Bluetooth,
  Package,
  Search,
  ChevronRight,
  FolderTree,
  Sparkles,
  Eye,
  TrendingUp,
  Home,
  Shirt,
  Footprints,
  Sofa,
  Book,
  Watch as WatchIcon,
  Headphones as HeadphonesIcon,
  Speaker as SpeakerIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
  Truck,
  Utensils,
  Wine,
  Heart,
  Dumbbell,
  Music,
  Tv,
  Phone,
  Battery,
  Cpu as CpuIcon,
  HardDrive as HardDriveIcon,
  Server,
  Network,
  Cloud,
  Database,
  Shield,
  Lock,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  Camera as CameraIcon,
  Gamepad2 as GamepadIcon,
  Printer as PrinterIcon,
  Scan,
  ScanFace,
  QrCode,
  BatteryCharging,
  Zap,
  Power,
  Cable,
  Usb,
  HdmiPort,
  Plug,
  Radio,
  Satellite,
  SatelliteDish,
  Globe,
  MapPin,
  Navigation,
  Compass,
  Thermometer,
  Droplets,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Wind,
  Umbrella,
  Trees,
  Leaf,
  Sprout,
  Flower2,
  Bone,
  Dog,
  Cat,
  Bird,
  Fish,
  Bug,
  Shell,
  Apple,
  Carrot,
  Pizza,
  Hamburger,
  Coffee,
  IceCream,
  Cake,
  Wine as WineIcon,
  Beer,
  Martini,
  GlassWater,
  ChefHat,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  Bitcoin,
  TrendingUp as TrendingUpIcon,
  BarChart,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  Star,
  Heart as HeartIcon,
  Gem,
  Diamond,
  Sparkle,
  Moon as MoonIcon,
  Sun as SunIcon,
  Palette,
  Brush,
  PenTool,
  Ruler,
  Scissors,
  Hammer,
  Wrench,
  Settings,
  Cog,
  Wrench as WrenchIcon,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ship,
  Rocket,
  Navigation2,
  Map,
  Flag,
  Trophy as TrophyIcon,
  Bell,
  Megaphone,
  Volume2,
  Headphones as HeadphonesIcon2,
  Music as MusicIcon2,
  Film,
  Tv as TvIcon2,
  Gamepad2 as GamepadIcon2,
  BookOpen,
  Newspaper,
  PenSquare,
  Edit,
  FileText,
  File,
  Folder,
  Archive,
  Briefcase,
  GraduationCap,
  School,
  Book as BookIcon,
  Calculator,
  Microscope,
  FlaskRound,
  Atom,
  Brain,
  Stethoscope,
  Pill,
  Syringe,
  HeartPulse,
  Ambulance,
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield as ShieldIcon,
  Key,
  Fingerprint,
  EyeOff,
  CameraOff,
  Video,
  VideoOff,
  PhoneCall,
  PhoneOff,
  Mail,
  Inbox,
  Send,
  MessageSquare,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  AlarmClock,
  Timer,
  Watch as WatchIcon2,
  Sunrise,
  Sunset,
  Cloud as CloudIcon,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  ThermometerSun,
  ThermometerSnowflake,
  Droplet,
  Wind as WindIcon,
  Tornado,
  Snowflake,
  Waves,
  Mountain,
  TreePine,
  Earth,
  Globe as GlobeIcon,
  Map as MapIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon,
  Anchor,
  Ship as ShipIcon,
  Sailboat,
  LifeBuoy,
  Binoculars,
  Telescope,
  Camera as CameraIcon2,
  CameraOff as CameraOffIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Film as FilmIcon,
  Clapperboard,
  Ticket,
  Music as MusicIcon3,
  Headphones as HeadphonesIcon3,
  Radio as RadioIcon,
  Podcast,
  Tv as TvIcon3,
  Monitor as MonitorIcon,
  MonitorPlay,
  MonitorSpeaker,
  MonitorSmartphone as MonitorSmartphoneIcon,
  Smartphone as SmartphoneIcon2,
  Tablet as TabletIcon2,
  Watch as WatchIcon3,
  Cpu as CpuIcon2,
  HardDrive as HardDriveIcon2,
  Server as ServerIcon,
  Router as RouterIcon,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Zap as ZapIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  Power as PowerIcon,
  Cable as CableIcon,
  Usb as UsbIcon,
  Plug as PlugIcon,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Megaphone as MegaphoneIcon,
  Volume2 as Volume2Icon,
  Headphones as HeadphonesIcon4,
  Tv as TvIcon4,
  Gamepad2 as GamepadIcon3,
  Book as BookIcon2,
  Newspaper as NewspaperIcon,
  PenSquare as PenSquareIcon,
  FileText as FileTextIcon,
  Folder as FolderIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Calculator as CalculatorIcon,
  FlaskRound as FlaskIcon,
  Brain as BrainIcon,
  Stethoscope as StethoscopeIcon,
  HeartPulse as HeartPulseIcon,
  User as UserIcon,
  Users as UsersIcon,
  Shield as ShieldIcon2,
  Key as KeyIcon,
  Fingerprint as FingerprintIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Camera as CameraIcon3,
  CameraOff as CameraOffIcon2,
  Video as VideoIcon2,
  VideoOff as VideoOffIcon2,
  Phone as PhoneIcon,
  PhoneOff as PhoneOffIcon,
  Mail as MailIcon,
  MessageSquare as MessageSquareIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  AlarmClock as AlarmClockIcon,
  Timer as TimerIcon,
  Watch as WatchIcon4
} from 'lucide-react'

const categoryIcons: Record<string, React.ElementType> = {
  // Main Categories
  electronics: Monitor,
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  accessories: Headphones,
  gaming: Gamepad2,
  cameras: Camera,
  smartwatches: Watch,
  audio: Speaker,
  peripherals: Keyboard,
  networking: Router,
  storage: HardDrive,
  components: Cpu,
  mobile: MonitorSmartphone,
  charging: SmartphoneCharging,
  wireless: Wifi,
  bluetooth: Bluetooth,
  memory: MemoryStick,
  input: Mouse,
  printing: Printer,
  
  // Home & Living
  home: Home,
  furniture: Sofa,
  decor: Palette,
  lighting: Sun,
  kitchen: ChefHat,
  bedding: Moon,
  bath: Droplet,
  garden: Trees,
  outdoor: Umbrella,
  tools: Wrench,
  appliances: Settings,
  
  // Clothing & Fashion
  clothing: Shirt,
  fashion: Shirt,
  apparel: Shirt,
  footwear: Footprints,
  shoes: Footprints,
  bags: ShoppingBag,
  jewelry: Gem,
  watches: WatchIcon,
  sunglasses: Sun,
  fashionaccessories: Package,
  
  // Health & Beauty
  health: HeartPulse,
  beauty: Sparkle,
  wellness: Heart,
  fitness: Dumbbell,
  sports: Trophy,
  gym: Dumbbell,
  nutrition: Apple,
  supplements: Pill,
  personalcare: User,
  
  // Entertainment
  entertainment: Film,
  music: Music,
  movies: Tv,
  games: Gamepad2,
  books: Book,
  toys: Package,
  hobbies: Palette,
  instruments: Music,
  collectibles: Trophy,
  
  // Office & Stationery
  office: Briefcase,
  stationery: PenTool,
  supplies: File,
  officefurniture: Sofa,
  equipment: Printer,
  
  // Automotive
  automotive: Car,
  vehicles: Car,
  parts: Settings,
  autoaccessories: Package,
  autotools: Wrench,
  
  // Baby & Kids
  baby: Heart,
  kids: Users,
  kidstoys: Package,
  nursery: Home,
  kidsclothing: Shirt,
  
  // Pet Supplies
  pets: Dog,
  pet: Dog,
  dog: Dog,
  cat: Cat,
  fish: Fish,
  bird: Bird,
  
  // Food & Beverage
  food: Apple,
  grocery: ShoppingCart,
  beverages: GlassWater,
  snacks: Pizza,
  alcohol: Wine,
  
  // Industrial & Scientific
  industrial: Settings,
  scientific: Microscope,
  lab: FlaskRound,
  safety: Shield,
  industrialtools: Wrench,
  
  // Arts & Crafts
  arts: Palette,
  crafts: Scissors,
  diy: Hammer,
  sewing: Scissors,
  painting: Brush,
  
  // Travel & Luggage
  travel: Briefcase,
  luggage: Briefcase,
  travelbags: ShoppingBag,
  
  // Software & Digital
  software: Cpu,
  digital: Cpu,
  digitalgames: Gamepad2,
  apps: Smartphone,
  subscriptions: CreditCard,
  
  // Default mappings for common substrings (only unique keys not in main categories)
  phone: Smartphone,
  computer: Cpu,
  watch: Watch,
  speaker: Speaker,
  headphone: Headphones,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  router: Router,
  drive: HardDrive,
  processor: Cpu,
  monitor: Monitor,
  tv: Tv,
  camera: Camera,
  game: Gamepad2,
  video: Video,
  book: Book,
  tool: Wrench,
  car: Car,
  bike: Bike,
  drink: GlassWater,
  shoe: Footprints,
  bag: ShoppingBag,
  sport: Trophy,
  art: Palette,
  craft: Scissors,
  subscription: CreditCard,
}

const DefaultIcon = Package

// Skeleton Loader Component
const CategorySkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="relative w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
)

// Empty State Component
const EmptyState = ({ searchQuery, onClearSearch }: { searchQuery: string; onClearSearch: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20 px-4"
  >
    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
      <FolderTree className="w-12 h-12 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      {searchQuery ? 'No Results Found' : 'No Categories Available'}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      {searchQuery 
        ? `We couldn't find any categories matching "${searchQuery}"`
        : 'Check back later for new categories and products.'
      }
    </p>
    {searchQuery && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClearSearch}
        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 shadow-md"
      >
        Clear Search
      </motion.button>
    )}
  </motion.div>
)

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsResponse, subcatsResponse] = await Promise.all([
          categoriesApi.getAll(),
          subcategoriesApi.getAll()
        ])
        
        const cats = catsResponse.data.data || []
        const subcats = subcatsResponse.data.data?.subcategories || []
        
        setCategories(cats)
        
        const grouped: Record<string, Subcategory[]> = {}
        subcats.forEach((sc) => {
          if (!grouped[sc.categoryId]) grouped[sc.categoryId] = []
          grouped[sc.categoryId].push(sc)
        })
        setSubcategories(grouped)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '')
    
    // Exact match
    if (categoryIcons[normalizedName]) return categoryIcons[normalizedName]
    
    // Partial match
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) return icon
    }
    
    // Default icon
    return DefaultIcon
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subcategories[category.id] || []).some(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Calculate total products across all subcategories
  const totalProducts = Object.values(subcategories)
    .flat()
    .reduce((sum, sub) => sum + (sub.productsCount || 0), 0)

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 sm:mb-14 lg:mb-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Explore Everything
              </span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent mb-4">
              All Categories
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Browse through our extensive collection of products. Find exactly what you need.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 sm:mb-14"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search categories or subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 pl-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </motion.div>

          {/* Categories Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {[...Array(8)].map((_, index) => (
                <CategorySkeleton key={index} />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <EmptyState 
              searchQuery={searchQuery} 
              onClearSearch={() => setSearchQuery('')} 
            />
          ) : (
            <>
              {/* Search Results Info */}
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6"
                >
                  <p className="text-gray-600 dark:text-gray-400">
                    Found {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} matching "{searchQuery}"
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                <AnimatePresence>
                  {filteredCategories.map((category, index) => {
                    const hasImages = category.images && category.images.length > 0
                    const imageSrc = hasImages ? category.images[0] : null
                    const Icon = getCategoryIcon(category.name)
                    const catSubcats = subcategories[category.id] || []
                    const hasSubcats = catSubcats.length > 0
                    const isExpanded = expandedCategories.has(category.id)
                    const totalProductsInCategory = catSubcats.reduce(
                      (sum, sub) => sum + (sub.productsCount || 0), 
                      0
                    )

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        layout
                        className="group"
                      >
                        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 overflow-visible">
                          {/* Category Header with Image/Icon */}
                          <Link 
                            to={`/shop?categoryId=${category.id}`} 
                            className="block flex-1"
                          >
                            <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              {hasImages && imageSrc ? (
                                <>
                                  <img
                                    src={imageSrc}
                                    alt={buildCategoryImageAlt(category.name)}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                  >
                                    <Icon className="w-10 h-10 text-white" />
                                  </motion.div>
                                </div>
                              )}
                            </div>

                            {/* Category Info */}
                            <div className="mb-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                  {category.name}
                                </h3>
                                {totalProductsInCategory > 0 && (
                                  <span className="text-xs font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full whitespace-nowrap">
                                    {totalProductsInCategory}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <FolderTree className="w-4 h-4 flex-shrink-0" />
                                {hasSubcats ? (
                                  <span>{catSubcats.length} subcategor{catSubcats.length !== 1 ? 'ies' : 'y'}</span>
                                ) : (
                                  <span>No subcategories</span>
                                )}
                              </div>
                            </div>
                          </Link>

                          {/* Explore Button */}
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col gap-3">
                              <Link
                                to={`/shop?categoryId=${category.id}`}
                                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-300 text-center"
                              >
                                Explore Category
                              </Link>
                              
                              {hasSubcats && (
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/btn"
                                >
                                  <span className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    View Subcategories
                                  </span>
                                  <ChevronRight
                                    size={16}
                                    className={`transition-transform duration-300 ${
                                      isExpanded ? 'rotate-90' : ''
                                    } group-hover/btn:translate-x-1`}
                                  />
                                </button>
                              )}
                            </div>
                            
                            <AnimatePresence>
                              {isExpanded && hasSubcats && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-3 space-y-2"
                                >
                                  {catSubcats.map((subcat) => (
                                    <Link
                                      key={subcat.id}
                                      to={`/shop?categoryId=${category.id}&subcategoryId=${subcat.id}`}
                                      className="block px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-200 group/subcat"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300 group-hover/subcat:text-indigo-700 dark:group-hover/subcat:text-indigo-400 transition-colors truncate">
                                          {subcat.name}
                                        </span>
                                        {subcat.productsCount !== undefined && subcat.productsCount > 0 && (
                                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full whitespace-nowrap">
                                            {subcat.productsCount}
                                          </span>
                                        )}
                                      </div>
                                    </Link>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Stats Section */}
          {!loading && categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16 sm:mt-20 pt-12 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl border border-indigo-200 dark:border-indigo-800"
                >
                  <TrendingUp className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {categories.length}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Total Categories</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                >
                  <FolderTree className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {Object.values(subcategories).flat().length}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Total Subcategories</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl border border-green-200 dark:border-green-800"
                >
                  <Package className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {totalProducts}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Total Products</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Recent Products Slider */}
          <RecentProductsSlider />
        </div>
      </div>
    </MainLayout>
  )
}

// Recent Products Slider Component
function RecentProductsSlider() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(4)

  useEffect(() => {
    const loadRecentProducts = async () => {
      try {
        const recent = getRecentProducts()
        
        if (recent.length === 0) {
          setLoading(false)
          return
        }

        const productPromises = recent.map((p) =>
          productsApi.getById(p.id).catch(() => null)
        )
        
        const results = await Promise.all(productPromises)
        const products = results
          .filter((r) => r !== null)
          .map((r) => r!.data.data)
          .filter((p) => p)
        
        setRecentProducts(products)
      } catch (error) {
        console.error('Failed to load recent products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentProducts()
  }, [])

  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window === 'undefined') return
      if (window.innerWidth < 640) setItemsPerView(1)
      else if (window.innerWidth < 768) setItemsPerView(2)
      else if (window.innerWidth < 1024) setItemsPerView(3)
      else setItemsPerView(4)
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  const next = () => {
    setCurrentIndex((prev) => 
      prev >= recentProducts.length - itemsPerView ? 0 : prev + 1
    )
  }

  const prev = () => {
    setCurrentIndex((prev) => 
      prev <= 0 ? recentProducts.length - itemsPerView : prev - 1
    )
  }

  if (loading || recentProducts.length === 0) {
    return null
  }

  const totalSlides = Math.ceil(recentProducts.length / itemsPerView)
  const currentSlide = Math.floor(currentIndex / itemsPerView)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-20 sm:mt-24 pt-12 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Recently Viewed
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Continue browsing where you left off
          </p>
        </div>
        
        {recentProducts.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prev}
              className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              aria-label="Previous products"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              aria-label="Next products"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <motion.div
          className="flex gap-6"
          animate={{ x: `-${currentIndex * (100 / itemsPerView)}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {recentProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
            >
              <div className="hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <ProductCard 
                  product={product} 
                  compact
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}