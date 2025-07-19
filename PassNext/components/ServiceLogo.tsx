import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ServiceLogoProps {
  serviceName: string;
  size?: number;
  style?: any;
}

export const ServiceLogo: React.FC<ServiceLogoProps> = ({
  serviceName,
  size = 28, // Increased default size
  style,
}) => {
  // Get fallback icon based on service name with white background and black icons
  const getFallbackIcon = (serviceName: string) => {
    const service = serviceName.toLowerCase();
    
    // Define icon mappings for popular services, devices, and categories with brand colors
    const iconMap: { [key: string]: { name: any; color: string } } = {
      // Social & Communication
      google: { name: 'logo-google', color: '#4285F4' },
      gmail: { name: 'mail-outline', color: '#EA4335' },
      youtube: { name: 'logo-youtube', color: '#FF0000' },
      facebook: { name: 'logo-facebook', color: '#1877F2' },
      instagram: { name: 'logo-instagram', color: '#E4405F' },
      twitter: { name: 'chatbubble-ellipses-outline', color: '#1DA1F2' }, // Using different icon for Expo Go compatibility
      x: { name: 'chatbubble-ellipses-outline', color: 'rgba(255, 255, 255, 1)' }, // Using different icon for Expo Go compatibility
      linkedin: { name: 'logo-linkedin', color: '#0A66C2' },
      github: { name: 'logo-github', color: '#fffefeff' },
      whatsapp: { name: 'logo-whatsapp', color: '#25D366' },
      telegram: { name: 'paper-plane-outline', color: '#0088CC' },
      discord: { name: 'chatbubbles-outline', color: '#5865F2' },
      slack: { name: 'chatbubbles-outline', color: '#4A154B' },
      zoom: { name: 'videocam-outline', color: '#2D8CFF' },
      skype: { name: 'logo-skype', color: '#00AFF0' },
      teams: { name: 'people-outline', color: '#6264A7' },
      
      // Tech & Cloud
      apple: { name: 'phone-portrait-outline', color: '#ffffffff' }, // Alternative for Expo Go
      microsoft: { name: 'desktop-outline', color: '#00BCF2' }, // Alternative for Expo Go
      amazon: { name: 'storefront-outline', color: '#FF9900' }, // Alternative for Expo Go
      netflix: { name: 'tv-outline', color: '#E50914' },
      spotify: { name: 'musical-notes-outline', color: '#1DB954' },
      dropbox: { name: 'cloud-upload-outline', color: '#0061FF' }, // Alternative for Expo Go
      icloud: { name: 'cloud-outline', color: '#007AFF' },
      aws: { name: 'cloud-outline', color: '#FF9900' },
      azure: { name: 'cloud-outline', color: '#0078D4' },
      
      // Payment & Banking
      paypal: { name: 'card-outline', color: '#0070BA' }, // Alternative for Expo Go
      stripe: { name: 'card-outline', color: '#635BFF' },
      visa: { name: 'card-outline', color: '#1A1F71' },
      mastercard: { name: 'card-outline', color: '#EB001B' },
      amex: { name: 'card-outline', color: '#2E77BB' },
      bank: { name: 'business-outline', color: '#2E8B57' },
      atm: { name: 'card-outline', color: '#4169E1' },
      wallet: { name: 'wallet-outline', color: '#32CD32' },
      
      // Devices & Hardware
      laptop: { name: 'laptop-outline', color: '#708090' },
      computer: { name: 'desktop-outline', color: '#708090' },
      pc: { name: 'desktop-outline', color: '#708090' },
      phone: { name: 'phone-portrait-outline', color: '#4169E1' },
      mobile: { name: 'phone-portrait-outline', color: '#4169E1' },
      iphone: { name: 'phone-portrait-outline', color: '#007AFF' },
      android: { name: 'phone-portrait-outline', color: '#3DDC84' },
      tablet: { name: 'tablet-portrait-outline', color: '#9370DB' },
      ipad: { name: 'tablet-portrait-outline', color: '#007AFF' },
      watch: { name: 'watch-outline', color: '#FF6347' },
      tv: { name: 'tv-outline', color: '#000080' },
      router: { name: 'wifi-outline', color: '#20B2AA' },
      wifi: { name: 'wifi-outline', color: '#20B2AA' },
      camera: { name: 'camera-outline', color: '#FF4500' },
      printer: { name: 'print-outline', color: '#2F4F4F' },
      
      // Gaming & Entertainment
      gaming: { name: 'game-controller-outline', color: '#8A2BE2' },
      xbox: { name: 'game-controller-outline', color: '#107C10' },
      playstation: { name: 'game-controller-outline', color: '#003791' },
      nintendo: { name: 'game-controller-outline', color: '#E60012' },
      steam: { name: 'game-controller-outline', color: '#1B2838' },
      
      // Work & Productivity
      notion: { name: 'document-text-outline', color: '#ffffffff' },
      trello: { name: 'list-outline', color: '#0079BF' },
      office: { name: 'document-text-outline', color: '#D83B01' },
      outlook: { name: 'mail-outline', color: '#0078D4' },
      
      // Development
      gitlab: { name: 'git-branch-outline', color: '#FC6D26' },
      docker: { name: 'cube-outline', color: '#2496ED' },
      
      // Others
      reddit: { name: 'logo-reddit', color: '#FF4500' },
      pinterest: { name: 'image-outline', color: '#BD081C' },
      email: { name: 'mail-outline', color: '#4285F4' },
      website: { name: 'globe-outline', color: '#4169E1' },
      web: { name: 'globe-outline', color: '#4169E1' },
      server: { name: 'server-outline', color: '#708090' },
      database: { name: 'library-outline', color: '#FF6347' },
      home: { name: 'home-outline', color: '#32CD32' },
      work: { name: 'briefcase-outline', color: '#2F4F4F' },
      personal: { name: 'person-outline', color: '#9370DB' },
      family: { name: 'people-outline', color: '#FF69B4' },
      shopping: { name: 'bag-outline', color: '#FF1493' },
      food: { name: 'restaurant-outline', color: '#FFA500' },
      travel: { name: 'airplane-outline', color: '#00CED1' },
      health: { name: 'medical-outline', color: '#DC143C' },
      fitness: { name: 'fitness-outline', color: '#00FF00' },
      education: { name: 'school-outline', color: '#4682B4' },
      music: { name: 'musical-notes-outline', color: '#FF1493' },
      photo: { name: 'images-outline', color: '#FF6347' },
      video: { name: 'videocam-outline', color: '#8B008B' },
      file: { name: 'document-outline', color: '#4169E1' },
      note: { name: 'create-outline', color: '#FFD700' },
      calendar: { name: 'calendar-outline', color: '#FF4500' },
      clock: { name: 'time-outline', color: '#2E8B57' },
      location: { name: 'location-outline', color: '#DC143C' },
      map: { name: 'map-outline', color: '#32CD32' },
      car: { name: 'car-outline', color: '#FF6347' },
      bike: { name: 'bicycle-outline', color: '#00CED1' },
      train: { name: 'train-outline', color: '#4682B4' },
      bus: { name: 'bus-outline', color: '#FFD700' },
    };

    // Check if we have a specific icon for this service
    for (const [key, value] of Object.entries(iconMap)) {
      if (service.includes(key)) {
        return {
          type: 'icon',
          name: value.name,
          color: value.color,
        };
      }
    }

    // Default fallback with first letter and colorful approach
    const firstLetter = serviceName.charAt(0).toUpperCase();
    
    // Generate a consistent color based on the service name
    const generateColorFromString = (str: string): string => {
      const colors = [
        '#4285F4', '#EA4335', '#34A853', '#FBBC05', // Google colors
        '#1877F2', '#E4405F', '#1DA1F2', '#0A66C2', // Social colors
        '#25D366', '#0088CC', '#5865F2', '#FF9900', // Chat/Tech colors
        '#E50914', '#1DB954', '#0061FF', '#FF4500', // Entertainment colors
        '#9370DB', '#20B2AA', '#FF6347', '#32CD32', // Category colors
        '#4169E1', '#FF1493', '#00CED1', '#FFD700', // Misc colors
      ];
      
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return colors[Math.abs(hash) % colors.length];
    };
    
    return {
      type: 'letter',
      letter: firstLetter,
      color: generateColorFromString(serviceName), // Dynamic color based on service name
    };
  };

  const containerSize = size + 12; // Increased padding for better proportions
  const iconSize = Math.round(size * 0.75); // Better icon proportion

  const fallback = getFallbackIcon(serviceName);
  
  // Generate a subtle background color that complements the icon color
  const getBackgroundColor = (iconColor: string): string => {
    // Convert hex to RGB and create a very light tint
    const hex = iconColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Create a very light background with low opacity
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  };
  
  return (
    <View style={[
      styles.container, 
      { 
        width: containerSize, 
        height: containerSize,
        borderRadius: containerSize * 0.25, // More rounded for modern look
        backgroundColor: getBackgroundColor(fallback.color),
      }, 
      style
    ]}>
      {fallback.type === 'icon' ? (
        <Ionicons 
          name={fallback.name} 
          size={iconSize} 
          color={fallback.color} 
        />
      ) : (
        <Text style={[
          styles.letterText, 
          { 
            fontSize: iconSize * 0.85, // Slightly smaller letter for better fit
            color: fallback.color 
          }
        ]}>
          {fallback.letter}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is now dynamically set based on icon color
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border that works with dark theme
  },
  letterText: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
});
