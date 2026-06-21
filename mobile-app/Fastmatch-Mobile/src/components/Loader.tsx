import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { colors } from "../utils/colors"
import { loadingSelector } from "../redux/slices/globalSlice";

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

const Loader = () => {
  const isLoading  = useSelector(loadingSelector);

  return (
    <>
      {isLoading ? (
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator
              color={colors.white}
              size={"large"}
              animating={true}
            />
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    width: width,
    height: height,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-around",
    position: "absolute",
    backgroundColor: "transparent",
  },
  activityIndicatorWrapper: {
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default Loader;
