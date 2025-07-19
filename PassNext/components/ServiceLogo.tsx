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
  size = 20,
  style,
}) => {
  // Get fallback icon based on service name with white background and black icons
  const getFallbackIcon = (serviceName: string) => {
    const service = serviceName.toLowerCase();
    
    // Define icon mappings for popular services, devices, and categories with black color for white background
    const iconMap: { [key: string]: { name: any; color: string } } = {
      // Social & Communication
      google: { name: 'logo-google', color: '#000000' },
      gmail: { name: 'mail-outline', color: '#000000' },
      youtube: { name: 'logo-youtube', color: '#000000' },
      facebook: { name: 'logo-facebook', color: '#000000' },
      instagram: { name: 'logo-instagram', color: '#000000' },
      twitter: { name: 'logo-twitter', color: '#000000' },
      x: { name: 'logo-twitter', color: '#000000' },
      linkedin: { name: 'logo-linkedin', color: '#000000' },
      github: { name: 'logo-github', color: '#000000' },
      whatsapp: { name: 'logo-whatsapp', color: '#000000' },
      telegram: { name: 'paper-plane-outline', color: '#000000' },
      discord: { name: 'chatbubbles-outline', color: '#000000' },
      slack: { name: 'chatbubbles-outline', color: '#000000' },
      zoom: { name: 'videocam-outline', color: '#000000' },
      skype: { name: 'logo-skype', color: '#000000' },
      teams: { name: 'people-outline', color: '#000000' },
      
      // Tech & Cloud
      apple: { name: 'logo-apple', color: '#000000' },
      microsoft: { name: 'logo-microsoft', color: '#000000' },
      amazon: { name: 'logo-amazon', color: '#000000' },
      netflix: { name: 'tv-outline', color: '#000000' },
      spotify: { name: 'musical-notes-outline', color: '#000000' },
      dropbox: { name: 'logo-dropbox', color: '#000000' },
      icloud: { name: 'cloud-outline', color: '#000000' },
      aws: { name: 'cloud-outline', color: '#000000' },
      azure: { name: 'cloud-outline', color: '#000000' },
      
      // Payment & Banking
      paypal: { name: 'logo-paypal', color: '#000000' },
      stripe: { name: 'card-outline', color: '#000000' },
      visa: { name: 'card-outline', color: '#000000' },
      mastercard: { name: 'card-outline', color: '#000000' },
      amex: { name: 'card-outline', color: '#000000' },
      bank: { name: 'business-outline', color: '#000000' },
      atm: { name: 'card-outline', color: '#000000' },
      wallet: { name: 'wallet-outline', color: '#000000' },
      
      // Devices & Hardware
      laptop: { name: 'laptop-outline', color: '#000000' },
      computer: { name: 'desktop-outline', color: '#000000' },
      pc: { name: 'desktop-outline', color: '#000000' },
      phone: { name: 'phone-portrait-outline', color: '#000000' },
      mobile: { name: 'phone-portrait-outline', color: '#000000' },
      iphone: { name: 'phone-portrait-outline', color: '#000000' },
      android: { name: 'phone-portrait-outline', color: '#000000' },
      tablet: { name: 'tablet-portrait-outline', color: '#000000' },
      ipad: { name: 'tablet-portrait-outline', color: '#000000' },
      watch: { name: 'watch-outline', color: '#000000' },
      tv: { name: 'tv-outline', color: '#000000' },
      router: { name: 'wifi-outline', color: '#000000' },
      wifi: { name: 'wifi-outline', color: '#000000' },
      camera: { name: 'camera-outline', color: '#000000' },
      printer: { name: 'print-outline', color: '#000000' },
      
      // Gaming & Entertainment
      gaming: { name: 'game-controller-outline', color: '#000000' },
      xbox: { name: 'game-controller-outline', color: '#000000' },
      playstation: { name: 'game-controller-outline', color: '#000000' },
      nintendo: { name: 'game-controller-outline', color: '#000000' },
      steam: { name: 'game-controller-outline', color: '#000000' },
      
      // Work & Productivity
      notion: { name: 'document-text-outline', color: '#000000' },
      trello: { name: 'list-outline', color: '#000000' },
      office: { name: 'document-text-outline', color: '#000000' },
      outlook: { name: 'mail-outline', color: '#000000' },
      
      // Development
      gitlab: { name: 'git-branch-outline', color: '#000000' },
      docker: { name: 'cube-outline', color: '#000000' },
      
      // Others
      reddit: { name: 'logo-reddit', color: '#000000' },
      pinterest: { name: 'image-outline', color: '#000000' },
      email: { name: 'mail-outline', color: '#000000' },
      website: { name: 'globe-outline', color: '#000000' },
      web: { name: 'globe-outline', color: '#000000' },
      server: { name: 'server-outline', color: '#000000' },
      database: { name: 'library-outline', color: '#000000' },
      home: { name: 'home-outline', color: '#000000' },
      work: { name: 'briefcase-outline', color: '#000000' },
      personal: { name: 'person-outline', color: '#000000' },
      family: { name: 'people-outline', color: '#000000' },
      shopping: { name: 'bag-outline', color: '#000000' },
      food: { name: 'restaurant-outline', color: '#000000' },
      travel: { name: 'airplane-outline', color: '#000000' },
      health: { name: 'medical-outline', color: '#000000' },
      fitness: { name: 'fitness-outline', color: '#000000' },
      education: { name: 'school-outline', color: '#000000' },
      music: { name: 'musical-notes-outline', color: '#000000' },
      photo: { name: 'images-outline', color: '#000000' },
      video: { name: 'videocam-outline', color: '#000000' },
      file: { name: 'document-outline', color: '#000000' },
      note: { name: 'create-outline', color: '#000000' },
      calendar: { name: 'calendar-outline', color: '#000000' },
      clock: { name: 'time-outline', color: '#000000' },
      location: { name: 'location-outline', color: '#000000' },
      map: { name: 'map-outline', color: '#000000' },
      car: { name: 'car-outline', color: '#000000' },
      bike: { name: 'bicycle-outline', color: '#000000' },
      train: { name: 'train-outline', color: '#000000' },
      bus: { name: 'bus-outline', color: '#000000' },
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

    // Default fallback with first letter and black color for white background
    const firstLetter = serviceName.charAt(0).toUpperCase();
    
    return {
      type: 'letter',
      letter: firstLetter,
      color: '#000000', // Black color for white background
    };
  };

  const containerSize = size + 8; // Reduced padding for minimal look
  const iconSize = Math.round(size * 0.7); // Slightly smaller icon for better proportion

  const fallback = getFallbackIcon(serviceName);
  
  return (
    <View style={[
      styles.container, 
      { 
        width: containerSize, 
        height: containerSize,
        borderRadius: containerSize * 0.2, // Subtle rounded corners
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
            fontSize: iconSize * 0.9, 
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
    backgroundColor: '#FFFFFF', // White background
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Light border for definition
  },
  letterText: {
    fontWeight: '600', // Slightly bolder for better readability on white
    textAlign: 'center',
    fontFamily: 'System', // Use system font for consistency
  },
});
