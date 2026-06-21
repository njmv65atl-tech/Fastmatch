import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../utils";
import { fontFamily } from "../assets/fonts/fontFamily";

const CustomFlash = ({ msg, desc, img, color }:{ msg: string, desc?: string, img?: any, color? :any }) => {
  return (
    <View style={styles.container}>
      <View style={styles.txtStyle}>
        <Text style={{...styles.msgTxt, color: color || 'red'}}>{msg}</Text>
      </View>
    </View>
  );
};

export default CustomFlash;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: colors.black,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 50,
    borderWidth: 0.5,
    borderColor: colors.borderSlate,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  imgStyle: {
    width: 20,
    height: 20,
  },
  msgTxt: {
    fontSize: 16,
    color: colors.black,
    flexWrap: "wrap",
    fontWeight: '600',
  },
  descTxt: {
    fontSize: 14,
    color: colors.black,
  },
  txtStyle: {
    maxWidth: 300,
  },
})
