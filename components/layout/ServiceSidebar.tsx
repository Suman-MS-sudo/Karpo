"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard, MessageSquare, Bell, User, Settings, Package, Plus,
  Search, Car, Wrench, Shield, Gift, GraduationCap, Tag, Users,
  ShoppingBag, Home, Briefcase, Crown, Zap, Rocket,
} from "lucide-react"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"

type NavItem    = { href: string; label: string; icon?: React.ComponentType<{ className?: string }> }
type NavSection = { title?: string; items: NavItem[] }

// ── Per-service sidebar navigation ────────────────────────────────────────────

const SERVICE_NAV: Record<string, NavSection[]> = {
  "buy-sell": [
    { items: [
      { href: "/marketplace",     label: "Browse All",    icon: ShoppingBag },
      { href: "/marketplace/new", label: "Post an Item",  icon: Plus        },
      { href: "/my-listings",     label: "My Listings",   icon: Package     },
    ]},
    { title: "Categories", items: [
      { href: "/marketplace?category=ELECTRONICS", label: "Electronics"  },
      { href: "/marketplace?category=VEHICLE",     label: "Vehicles"     },
      { href: "/marketplace?category=FURNITURE",   label: "Furniture"    },
      { href: "/marketplace?category=APPLIANCE",   label: "Appliances"   },
      { href: "/marketplace?category=BOOKS",       label: "Books"        },
      { href: "/marketplace?category=CLOTHING",    label: "Clothing"     },
      { href: "/marketplace?category=SPORTS",      label: "Sports"       },
      { href: "/marketplace?category=KITCHEN",     label: "Kitchen"      },
      { href: "/marketplace?category=BICYCLE",     label: "Bicycles"     },
      { href: "/marketplace?category=HEALTH",      label: "Health"       },
    ]},
  ],

  "rentals": [
    { items: [
      { href: "/rentals",     label: "Browse All",     icon: Home    },
      { href: "/rentals/new", label: "Post Rental",    icon: Plus    },
      { href: "/my-rentals",  label: "My Rentals",     icon: Package },
    ]},
    { title: "Type", items: [
      { href: "/rentals?type=APARTMENT", label: "Apartments" },
      { href: "/rentals?type=PG",        label: "PG / Hostel" },
      { href: "/rentals?type=ROOM",      label: "Rooms"      },
      { href: "/rentals?type=FLATMATE",  label: "Flatmates"  },
      { href: "/rentals?type=STUDIO",    label: "Studio"     },
      { href: "/rentals?type=VILLA",     label: "Villa"      },
    ]},
    { title: "Furnished", items: [
      { href: "/rentals?furnished=FULLY",  label: "Fully Furnished"  },
      { href: "/rentals?furnished=SEMI",   label: "Semi Furnished"   },
      { href: "/rentals?furnished=UNFURN", label: "Unfurnished"      },
    ]},
  ],

  "job-referrals": [
    { items: [
      { href: "/referrals",     label: "Browse Roles",   icon: Briefcase },
      { href: "/referrals/new", label: "Post Referral",  icon: Plus      },
      { href: "/my-referrals",  label: "My Referrals",   icon: Package   },
    ]},
    { title: "Department", items: [
      { href: "/referrals?dept=Engineering",        label: "Engineering"   },
      { href: "/referrals?dept=Product",            label: "Product"       },
      { href: "/referrals?dept=Design",             label: "Design"        },
      { href: "/referrals?dept=Data+%26+Analytics", label: "Data"          },
      { href: "/referrals?dept=Sales",              label: "Sales"         },
      { href: "/referrals?dept=Marketing",          label: "Marketing"     },
      { href: "/referrals?dept=Finance",            label: "Finance"       },
      { href: "/referrals?dept=HR",                 label: "HR"            },
    ]},
    { title: "Work Mode", items: [
      { href: "/referrals?mode=REMOTE", label: "Remote"  },
      { href: "/referrals?mode=HYBRID", label: "Hybrid"  },
      { href: "/referrals?mode=ONSITE", label: "On-site" },
    ]},
  ],

  "carpool": [
    { items: [
      { href: "/carpool",     label: "Find a Ride",  icon: Search      },
      { href: "/carpool/new", label: "Offer a Ride", icon: Plus        },
      { href: "/my-carpool",  label: "My Routes",    icon: Package     },
    ]},
    { title: "Schedule", items: [
      { href: "/carpool?freq=WEEKDAYS", label: "Mon – Fri" },
      { href: "/carpool?freq=DAILY",    label: "Daily"     },
      { href: "/carpool?freq=WEEKENDS", label: "Weekends"  },
      { href: "/carpool?freq=ONCE",     label: "One-time"  },
    ]},
    { title: "Time of Day", items: [
      { href: "/carpool?time=morning",   label: "Morning"   },
      { href: "/carpool?time=afternoon", label: "Afternoon" },
      { href: "/carpool?time=evening",   label: "Evening"   },
    ]},
  ],

  "services": [
    { items: [
      { href: "/services",    label: "Browse Skills", icon: Wrench  },
      { href: "/skills/new",  label: "Offer a Skill", icon: Plus    },
      { href: "/my-services", label: "My Services",   icon: Package },
    ]},
    { title: "Category", items: [
      { href: "/services?category=TECH",      label: "Tech & IT"     },
      { href: "/services?category=DESIGN",    label: "Design"        },
      { href: "/services?category=FINANCE",   label: "Finance"       },
      { href: "/services?category=LEGAL",     label: "Legal"         },
      { href: "/services?category=BUSINESS",  label: "Business"      },
      { href: "/services?category=COACHING",  label: "Coaching"      },
      { href: "/services?category=WELLNESS",  label: "Health"        },
      { href: "/services?category=CREATIVE",  label: "Creative"      },
      { href: "/services?category=DATA",      label: "Data"          },
      { href: "/services?category=MARKETING", label: "Marketing"     },
    ]},
  ],

  "deals": [
    { items: [
      { href: "/deals", label: "All Deals", icon: Tag },
    ]},
  ],

  "events": [
    { items: [
      { href: "/events",     label: "Browse Events", icon: Users   },
      { href: "/events/new", label: "Create Event",  icon: Plus    },
      { href: "/my-events",  label: "My Events",     icon: Package },
    ]},
  ],

  "learning": [
    { items: [
      { href: "/learning",     label: "Browse Courses", icon: GraduationCap },
      { href: "/learning/new", label: "Create Course",  icon: Plus          },
      { href: "/my-learning",  label: "My Courses",     icon: Package       },
    ]},
  ],

  "concierge": [
    { items: [
      { href: "/concierge",       label: "Expert Services", icon: Shield  },
      { href: "/concierge/new",   label: "New Request",     icon: Plus    },
      { href: "/concierge/my-leads", label: "My Requests",  icon: Package },
    ]},
    { title: "Request Type", items: [
      { href: "/concierge/new?type=TAX",       label: "📄 Tax Filing"          },
      { href: "/concierge/new?type=LEGAL",     label: "⚖️ Legal Assistance"   },
      { href: "/concierge/new?type=INSURANCE", label: "🛡️ Insurance Advisory" },
      { href: "/concierge/new?type=FINANCIAL", label: "📈 Financial Planning"  },
    ]},
  ],

  "benefits": [
    { items: [
      { href: "/benefits", label: "All Products", icon: Gift },
    ]},
    { title: "Product Type", items: [
      { href: "/benefits?type=LOAN",       label: "💰 Salary Loans"        },
      { href: "/benefits?type=INSURANCE",  label: "🏥 Group Insurance"     },
      { href: "/benefits?type=TRAVEL",     label: "✈️ Travel Packages"     },
      { href: "/benefits?type=INVESTMENT", label: "📊 Investment Products" },
    ]},
  ],
}

// Home context — shown when not inside any service
const HOME_NAV: NavSection[] = [
  { items: [
    { href: "/dashboard",     label: "Home",           icon: LayoutDashboard },
    { href: "/my-postings",   label: "My Postings",    icon: Package         },
    { href: "/messages",      label: "Messages",       icon: MessageSquare   },
    { href: "/notifications", label: "Notifications",  icon: Bell            },
    { href: "/profile/me",    label: "My Profile",     icon: User            },
    { href: "/settings",      label: "Settings",       icon: Settings        },
  ]},
]

// ── Component ─────────────────────────────────────────────────────────────────

// Routes that belong to a service but don't start with its base path
const MY_ROUTE_MAP: Record<string, string> = {
  "/my-listings":  "buy-sell",
  "/my-rentals":   "rentals",
  "/my-referrals": "job-referrals",
  "/my-carpool":   "carpool",
  "/my-services":  "services",
  "/my-events":    "events",
  "/my-learning":  "learning",
}

export function ServiceSidebar({ className }: { className?: string }) {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const cleanPath = pathname.split("?")[0]
  const activeService =
    SERVICES.find((s) => pathname.startsWith(s.route)) ??
    SERVICES.find((s) => s.id === MY_ROUTE_MAP[cleanPath])

  const sections = activeService ? (SERVICE_NAV[activeService.id] ?? []) : HOME_NAV

  return (
    <aside className={cn(
      "hidden lg:flex flex-col w-[220px] bg-sidebar border-r border-sidebar-border h-full shrink-0",
      className
    )}>

      {/* Service / Home header */}
      <div className="h-14 px-4 flex items-center border-b border-sidebar-border shrink-0">
        {activeService ? (
          <div className="flex items-center gap-2.5">
            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", activeService.bgColor)}>
              {(() => {
                const iconMap2: Record<string, React.ComponentType<{ className?: string }>> = {
                  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
                }
                const Icon = iconMap2[activeService.icon] ?? ShoppingBag
                return <Icon className={cn("h-4 w-4", activeService.color)} />
              })()}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{activeService.name}</p>
              </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Korpo</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1.5">
                {section.title}
              </p>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                // Active: exact for query-param links, prefix for path-only links
                const hasQuery = item.href.includes("?")
                const isActive = hasQuery
                  ? false  // category filter links — never highlighted
                  : item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all",
                      isActive
                        ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 font-semibold"
                        : hasQuery
                          ? "text-muted-foreground hover:text-foreground hover:bg-muted/50 text-[13px]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                    )}
                  >
                    {item.icon && (
                      <item.icon className={cn("h-4 w-4 shrink-0",
                        isActive ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground"
                      )} />
                    )}
                    {!item.icon && hasQuery && (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0 ml-1" />
                    )}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

    </aside>
  )
}
