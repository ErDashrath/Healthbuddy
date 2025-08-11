import { 
  MessageCircle, 
  Stethoscope, 
  Palette, 
  Music, 
  Target, 
  BookOpen, 
  Edit3, 
  Hash, 
  Sparkles, 
  Users, 
  Settings
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { icon: MessageCircle, label: "Chat", href: "/", active: true },
  { icon: Stethoscope, label: "Doctor Consultation", href: "/consultation" },
  { icon: Palette, label: "Doodle", href: "/doodle" },
  { icon: Music, label: "Music", href: "/music" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: BookOpen, label: "Journaling", href: "/journal" },
  { icon: Edit3, label: "Write", href: "/write" },
  { icon: Hash, label: "Tags", href: "/tags" },
  { icon: Sparkles, label: "Magic", href: "/magic" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  
  // Video background state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideo, setCurrentVideo] = useState('/indexv.mp4');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const isActive = (path: string) => currentPath === path;

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const { video, sound } = event.detail;
      setCurrentVideo(video);
      setSoundEnabled(sound);
      
      // Update video element
      if (videoRef.current) {
        videoRef.current.src = video;
        videoRef.current.muted = !sound;
        videoRef.current.load();
        videoRef.current.play();
      }
    };

    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  return (
  <Sidebar className="border-r border-white/20 fixed top-0 left-0 h-screen z-30 shadow-xl overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={!soundEnabled}
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={currentVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Light overlay for better readability */}
      <div className="absolute inset-0 bg-black/15 backdrop-blur-md z-10" />
      
      {/* Sidebar content */}
      <div className="relative z-20 h-full">
        {/* Header */}
        <SidebarHeader className="border-b border-white/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500/70 to-purple-500/70 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/30">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-white truncate enhanced-text-visibility">MindScribe</h1>
                <span className="text-xs text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap border border-white/30 enhanced-text-light">
                  AI Chat Beta
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-white/80 enhanced-text-light font-medium"}>
              Wellness Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton 
                        asChild
                        className={active 
                          ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30 enhanced-text-visibility" 
                          : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm enhanced-text-light"
                        }
                      >
                        <Link to={item.href} className="flex items-center gap-3">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && <span className="enhanced-text-light font-medium">{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-white/20 p-4">
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400/60 to-orange-500/60 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate enhanced-text-visibility">
                  Your wellness journey
                </p>
                <p className="text-xs text-white/80 enhanced-text-light">
                  Day 12 streak! 🌟
                </p>
              </div>
            )}
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}