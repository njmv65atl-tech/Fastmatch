module.exports = {
  dependencies: {
    'react-native-prevent-screenshot-ios-android': {
      platforms: {
        android: null,
      },
    },
    'react-native-iap': {
      platforms: {
        android: {
          packageImportPath: 'import com.dooboolab.rniap.RNIapPackage;',
          packageInstance: 'new RNIapPackage()'
        }
      }
    },
    'react-native-orientation-locker': {
      platforms: {
        android: {
          packageImportPath: 'import org.wonday.orientation.OrientationPackage;',
          packageInstance: 'new OrientationPackage()'
        }
      }
    }
  }
};

