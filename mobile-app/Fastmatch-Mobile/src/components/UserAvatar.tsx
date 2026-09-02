import React, { useState } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { IMAGE_URL } from "../config/env";

interface UserAvatarProps {
  uri?: string | null;
  gender?: string | null;
  size?: number;
  name?: string | null;
  style?: any;
  borderRadius?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cleanAvatarUri = (img?: string | null): string | null => {
  if (!img || img.trim() === "" || img === "null" || img === "undefined") return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const cleanPath = img.startsWith("/") ? img.substring(1) : img;
  return `${IMAGE_URL}/${cleanPath}`;
};

// ─── Male Vector Favicon ─────────────────────────────────────────────────────

const MaleFavicon = ({ size }: { size: number }) => {
  const iconScale = size / 44;
  return (
    <View
      style={[
        styles.maleContainer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 36 36"
        fill="none"
      >
        {/* Male Short Hair & Head */}
        <Circle cx="18" cy="13" r="6.5" fill="#93C5FD" />
        {/* Short stylish hair cap */}
        <Path
          d="M11.5 13.5C11.5 9 14.5 6 18 6C21.5 6 24.5 9 24.5 13.5C24.5 13.5 22.5 10.5 18 10.5C13.5 10.5 11.5 13.5 11.5 13.5Z"
          fill="#3B82F6"
        />
        {/* Male Neck & Shoulders */}
        <Path
          d="M7 29.5C7 24 11.5 20.5 18 20.5C24.5 20.5 29 24 29 29.5"
          stroke="#60A5FA"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ─── Female Vector Favicon ───────────────────────────────────────────────────

const FemaleFavicon = ({ size }: { size: number }) => {
  return (
    <View
      style={[
        styles.femaleContainer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 36 36"
        fill="none"
      >
        {/* Female Hair Behind */}
        <Path
          d="M10.5 14C10.5 8 13.5 5 18 5C22.5 5 25.5 8 25.5 14C25.5 20 23.5 23 23.5 23C23.5 23 21 16 18 16C15 16 12.5 23 12.5 23C12.5 23 10.5 20 10.5 14Z"
          fill="#F43F5E"
        />
        {/* Female Head */}
        <Circle cx="18" cy="13.5" r="5.5" fill="#FBCFE8" />
        {/* Female Fringe / Hair top */}
        <Path
          d="M12 12C13 9 15 7.5 18 7.5C21 7.5 23 9 24 12C22 10.5 20 10 18 10C16 10 14 10.5 12 12Z"
          fill="#E11D48"
        />
        {/* Female Shoulders */}
        <Path
          d="M8.5 29.5C8.5 24.5 12.5 21 18 21C23.5 21 27.5 24.5 27.5 29.5"
          stroke="#FB7185"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ─── Neutral / Default Silhouette ────────────────────────────────────────────

const DefaultFavicon = ({ size, name }: { size: number; name?: string | null }) => {
  if (name && name.trim()) {
    return (
      <View
        style={[
          styles.defaultContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.defaultInitial, { fontSize: size * 0.42 }]}>
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.defaultContainer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#818CF8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
      </Svg>
    </View>
  );
};

// ─── Main UserAvatar Component ────────────────────────────────────────────────

export const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  gender,
  size = 44,
  name,
  style,
  borderRadius,
}) => {
  const [imageError, setImageError] = useState(false);
  const finalUri = cleanAvatarUri(uri);
  const radius = borderRadius !== undefined ? borderRadius : size / 2;

  if (finalUri && !imageError) {
    return (
      <Image
        source={{ uri: finalUri, cache: "force-cache" }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: "#1E293B",
          },
          style,
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to Gender-based Favicons
  const g = gender?.toLowerCase().trim();
  if (g === "female" || g === "f") {
    return (
      <View style={[{ width: size, height: size, borderRadius: radius }, style]}>
        <FemaleFavicon size={size} />
      </View>
    );
  }

  if (g === "male" || g === "m") {
    return (
      <View style={[{ width: size, height: size, borderRadius: radius }, style]}>
        <MaleFavicon size={size} />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, borderRadius: radius }, style]}>
      <DefaultFavicon size={size} name={name} />
    </View>
  );
};

const styles = StyleSheet.create({
  maleContainer: {
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.3)",
  },
  femaleContainer: {
    backgroundColor: "#831843",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251, 113, 133, 0.3)",
  },
  defaultContainer: {
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  defaultInitial: {
    color: "#818CF8",
    fontWeight: "bold",
  },
});
